import type { Job } from 'bullmq';
import { Queue, Worker, QueueEvents, Job as BullJob } from 'bullmq';
import Redis from 'ioredis';

export type Handler<T, R extends { type?: string } = { type: 'nil-result-type' }> = (job: Job<T>) => Promise<R | void>;

// Runtime to register handlers
export class JobRuntime<T extends { type: string }, R extends { type?: string } = { type: 'nil-result-type' }> {
  private handlers: Record<string, Handler<any, any>> = {};
  private resultQueue?: Queue<R>;

  constructor({ queueName, connection, resultQueueName }: { queueName: string, connection?: Redis, resultQueueName?: string }) {
    const finalResultQueueName = resultQueueName || `${queueName}_result`;
    if (finalResultQueueName && connection) {
      this.resultQueue = new Queue<R>(finalResultQueueName, { connection });
    }
  }

  registerHandler<K extends T['type']>(type: K, handler: Handler<Extract<T, { type: K }>, R>) {
    this.handlers[type] = handler as Handler<any, any>;
  }

  getHandler<K extends T['type']>(type: K): Handler<Extract<T, { type: K }>, R> | undefined {
    return this.handlers[type] as Handler<Extract<T, { type: K }>, R> | undefined;
  }

  async handleResult(result: R) {
    if (this.resultQueue && result && 'type' in result) {
      await this.resultQueue.add(result.type!, result);
    }
  }
}

export class JobRuntimeManager<T extends { type: string }, R extends { type?: string } = { type: 'nil-result-type' }> {
  private connection: Redis;
  public jobRuntime: JobRuntime<T, R>;
  public queue: Queue<T>;
  private worker: Worker<T>;
  private interval: Timer | undefined;
  private queueEvents: QueueEvents;
  private debug: boolean;
  private debugInterval: number;
  private debugAfterRequest: boolean;

  constructor({ queueName, host, port, resultQueueName, debugInterval = 10000, debugAfterRequest = false }: { queueName: string, host: string, port: number, resultQueueName?: string, debugInterval?: number, debugAfterRequest?: boolean }) {
    this.connection = new Redis({
      host: host,
      port: port,
      maxRetriesPerRequest: null,
    });

    this.jobRuntime = new JobRuntime<T, R>({ queueName, connection: this.connection, resultQueueName });
    this.queue = new Queue<T>(queueName, { connection: this.connection });
    this.queueEvents = new QueueEvents(queueName, { connection: this.connection });
    this.debugInterval = debugInterval;
    this.debug = !!debugInterval;
    this.debugAfterRequest = debugAfterRequest;

    this.worker = new Worker<T>(queueName, async (job: Job<T>) => {
      const handler = this.jobRuntime.getHandler(job.data.type as T['type']);
      if (handler) {
        const result = await handler(job as Job<Extract<T, { type: T['type'] }>>);
        if (result) {
          await this.jobRuntime.handleResult(result as R);
        }
      } else {
        console.error(`No handler found for job type: ${job.data.type}. Job will remain in the queue.`);
        await job.moveToDelayed(Date.now() + 60000); // Move job to delayed state for 1 minute
      }

      if (this.debugAfterRequest) {
        const jobCounts = await this.queue.getJobCounts();
        console.log(`Queue ${this.queue.name} job counts after handling request:`, jobCounts);
      }
    }, { connection: this.connection });

    this.setupQueueEvents();
    this.setupShutdownOnExit();
    this.setupDebugLogging();
    console.log(`Job runtime for queue ${queueName} is up and ready to start`);
  }

  private setupQueueEvents() {
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`Job with ID ${jobId} in queue ${this.queue.name} has been completed`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.log(`Job with ID ${jobId} in queue ${this.queue.name} has failed with reason: ${failedReason}`);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`Job with ID ${jobId} in queue ${this.queue.name} reported progress: ${data}`);
    });

    this.queueEvents.on('waiting', ({ jobId }) => {
      console.log(`Job with ID ${jobId} in queue ${this.queue.name} is waiting to be processed`);
    });

    this.queueEvents.on('active', ({ jobId, prev }) => {
      console.log(`Job with ID ${jobId} in queue ${this.queue.name} is now active; previous status was ${prev}`);
    });

    this.queueEvents.on('stalled', ({ jobId }) => {
      console.log(`Job with ID ${jobId} in queue ${this.queue.name} has stalled and will be reprocessed`);
    });

    this.queueEvents.on('error', (error) => {
      console.error(`Queue event error: ${error}`);
    });
  }

  private setupShutdownOnExit() {
    const shutdown = async () => {
      console.log(`Job runtime for queue ${this.queue.name} is closing`);
      await this.worker.close();
      await this.connection.quit();
      clearInterval(this.interval);
      console.log(`Job runtime for queue ${this.queue.name} is closed`);
      process.exit(0);
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  }

  private setupDebugLogging() {
    if (this.debug) {
      this.interval = setInterval(async () => {
        const jobCounts = await this.queue.getJobCounts();
        console.log(`Queue ${this.queue.name} job counts:`, jobCounts);
      }, this.debugInterval);
    }
  }

  public async shutdown() {
    console.log(`Job runtime for queue ${this.queue.name} is closing`);
    await this.worker.close();
    await this.connection.quit();
    clearInterval(this.interval);
    console.log(`Job runtime for queue ${this.queue.name} is closed`);
  }

  public registerHandler<K extends T['type']>(type: K, handler: Handler<Extract<T, { type: K }>, R>) {
    this.jobRuntime.registerHandler(type, handler);
  }

  public async fireJob(data: T): Promise<BullJob<T>> {
    try {
      const job = await this.queue.add(data.type, data);
      console.log(`Job fired with ID: ${job.id} in queue ${this.queue.name}`);
      return job;
    } catch (error) {
      console.error('Error firing job:', error);
      throw error;
    }
  }

  public async awaitJobCompletion(job: BullJob<T>): Promise<void> {
    try {
      const completedJob = await job.waitUntilFinished(this.queueEvents);
      console.log(`Job with ID: ${job.id} in queue ${this.queue.name} has completed with result: ${completedJob}`);
    } catch (error) {
      console.error(`Error waiting for job completion: ${error}`);
      throw error;
    }
  }

  public async fireAndAwaitJobCompletion(data: T): Promise<void> {
    try {
      const job = await this.fireJob(data);
      await this.awaitJobCompletion(job);
    } catch (error) {
      console.error('Error firing and awaiting job completion:', error);
      throw error;
    }
  }
}
