import type { Job } from 'bullmq';
import { Queue, Worker, QueueEvents } from 'bullmq';
import Redis from 'ioredis';

export type Handler<T, R extends { type?: string } = { type: 'nil-result-type' }> = (job: Job<T>) => Promise<R | void>;

// Runtime to register handlers
export class JobRuntime<T extends { type: string }, R extends { type?: string } = { type: 'nil-result-type' }> {
  private handlers: Record<string, Handler<any, any>> = {};
  private resultQueue?: Queue<R>;

  constructor(queueName: string, connection?: Redis, resultQueueName?: string) {
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

  constructor(queueName: string, host: string, port: number, resultQueueName?: string) {
    this.connection = new Redis({
      host: host,
      port: port,
      maxRetriesPerRequest: null,
    });

    this.jobRuntime = new JobRuntime<T, R>(queueName, this.connection, resultQueueName);
    this.queue = new Queue<T>(queueName, { connection: this.connection });
    this.queueEvents = new QueueEvents(queueName, { connection: this.connection });

    this.worker = new Worker<T>(queueName, async (job: Job<T>) => {
      const handler = this.jobRuntime.getHandler(job.data.type as T['type']);
      if (handler) {
        const result = await handler(job as Job<Extract<T, { type: T['type'] }>>);
        if (result) {
          await this.jobRuntime.handleResult(result as R);
        }
      } else {
        console.error(`No handler found for job type: ${job.data.type}`);
      }
    }, { connection: this.connection });

    this.setupQueueEvents();
  }

  private setupQueueEvents() {
    this.queueEvents.on('completed', ({ jobId }) => {
      console.log(`Job with ID ${jobId} has been completed`);
    });

    this.queueEvents.on('failed', ({ jobId, failedReason }) => {
      console.log(`Job with ID ${jobId} has failed with reason: ${failedReason}`);
    });

    this.queueEvents.on('progress', ({ jobId, data }) => {
      console.log(`Job with ID ${jobId} reported progress: ${data}`);
    });

    this.queueEvents.on('waiting', ({ jobId }) => {
      console.log(`Job with ID ${jobId} is waiting to be processed`);
    });

    this.queueEvents.on('active', ({ jobId, prev }) => {
      console.log(`Job with ID ${jobId} is now active; previous status was ${prev}`);
    });

    this.queueEvents.on('stalled', ({ jobId }) => {
      console.log(`Job with ID ${jobId} has stalled and will be reprocessed`);
    });
  }

  public start() {
    console.log('App is running');
    this.interval = setInterval(() => {
      console.log('App is running');
    }, 10000);
  }

  public async shutdown() {
    console.log('Server is closing');
    await this.worker.close();
    await this.connection.quit();
    clearInterval(this.interval);
    console.log('Server is closed');
  }

  public registerHandler<K extends T['type']>(type: K, handler: Handler<Extract<T, { type: K }>, R>) {
    this.jobRuntime.registerHandler(type, handler);
  }

  public async fireJob(data: T) {
    try {
      const job = await this.queue.add(data.type, data);
      console.log(`Job fired with ID: ${job.id}`);
    } catch (error) {
      console.error('Error firing job:', error);
    }
  }
}
