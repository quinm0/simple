import type { Job } from 'bullmq';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

type Handler<T> = (job: Job<T>) => Promise<void>;

// Runtime to register handlers
export class JobRuntime<T extends { type: string }> {
  private handlers: Record<string, Handler<any>> = {};

  registerHandler<K extends T['type']>(type: K, handler: Handler<Extract<T, { type: K }>>) {
    this.handlers[type] = handler as Handler<any>;
  }

  getHandler<K extends T['type']>(type: K): Handler<Extract<T, { type: K }>> | undefined {
    return this.handlers[type] as Handler<Extract<T, { type: K }>> | undefined;
  }
}


export class JobRuntimeManager<T extends { type: string }> {
  private connection: Redis;
  public jobRuntime: JobRuntime<T>;
  public queue: Queue<T>;
  private worker: Worker<T>;
  private interval: Timer | undefined;

  constructor(queueName: string, host: string, port: number) {
    this.connection = new Redis({
      host: host,
      port: port,
      maxRetriesPerRequest: null,
    });

    this.jobRuntime = new JobRuntime<T>();
    this.queue = new Queue<T>(queueName, { connection: this.connection });

    this.worker = new Worker<T>(queueName, async (job: Job<T>) => {
      const handler = this.jobRuntime.getHandler(job.data.type as T['type']);
      if (handler) {
        await handler(job as Job<Extract<T, { type: T['type'] }>>);
      } else {
        console.error(`No handler found for job type: ${job.data.type}`);
      }
    }, { connection: this.connection });
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

  public registerHandler<K extends T['type']>(type: K, handler: Handler<Extract<T, { type: K }>>) {
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
