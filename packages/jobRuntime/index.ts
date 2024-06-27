import Redis, { type RedisOptions } from 'ioredis';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';

export type HandlerFunction<RequestT, ResponseT = void> = (job: Job<RequestT>) => Promise<ResponseT>;

type JobHandlerOptions<RequestT, ResponseT> = {
  queueName: string;
  handler?: HandlerFunction<RequestT, ResponseT>;
} & (
  | { redis: RedisOptions }
  | { redis?: Redis }
);

export class Handler<RequestT, ResponseT = void> {
  public queue: Queue<RequestT, ResponseT>;
  public worker?: Worker<RequestT, ResponseT>;
  private queueEvents: QueueEvents;

  constructor(options: JobHandlerOptions<RequestT, ResponseT>) {
    const { queueName, handler, redis: connectionDetails } = options;
    console.log(`Listening to BullMQ queue: ${queueName}`);

    const queueOptions = { 
      connection: connectionDetails instanceof Redis ? connectionDetails : new Redis({
        ...connectionDetails as RedisOptions,
        maxRetriesPerRequest: (connectionDetails as RedisOptions).maxRetriesPerRequest ?? null,
      }) 
    };

    this.queue = new Queue<RequestT>(queueName, queueOptions);
    this.queueEvents = new QueueEvents(queueName, queueOptions);

    if (handler) {
      this.worker = new Worker<RequestT>(queueName, handler, queueOptions);

      this.worker.on('completed', job => {
        console.log(`Job ${job.id} has been completed`);
      });

      this.worker.on('failed', (job, err) => {
        console.log(`Job ${job?.id} has failed with error ${err.message}`);
      });
    }
  }

  public async fireJob(data: RequestT): Promise<void> {
    await this.queue.add('job', data);
    console.log(`Job added to queue: ${JSON.stringify(data)}`);
  }

  public async fireAndWaitForJobResult(data: RequestT): Promise<ResponseT> {
    return new Promise<ResponseT>((resolve, reject) => {
      const job = this.queue.add('job', data);
      job.then(j => {
        j.waitUntilFinished(this.queueEvents)
          .then(result => {
            console.log(`Job ${j.id} has been completed with result: ${JSON.stringify(result)}`);
            resolve(result);
          })
          .catch(err => {
            console.log(`Job ${j.id} has failed with error: ${err.message}`);
            reject(err);
          });
      }).catch(err => {
        console.log(`Failed to add job to queue with error: ${err.message}`);
        reject(err);
      });
    });
  }
}

type JobHandler<RequestT, ResponseT> = {
  queueName: string;
  redis: RedisOptions;
  handler: (job: Job<RequestT>) => Promise<ResponseT>;
};

export class JobManager {
  private handlers: { [key: string]: Handler<any, any> } = {};
  private baseQueueName: string;

  constructor(baseQueueName: string) {
    this.baseQueueName = baseQueueName;
  }

  public registerHandler<RequestT, ResponseT>(jobType: string, handler: JobHandler<RequestT, ResponseT>): void {
    const queueName = `${this.baseQueueName}-${jobType}`;
    this.handlers[jobType] = new Handler<RequestT, ResponseT>({
      queueName,
      redis: handler.redis,
      handler: handler.handler,
    });
  }

  public async fireJob<RequestT>(jobType: string, data: RequestT): Promise<void> {
    const handler = this.handlers[jobType];
    if (!handler) {
      throw new Error(`No handler registered for job type: ${jobType}`);
    }
    await handler.fireJob(data);
  }

  public async fireAndWaitForJobResult<RequestT, ResponseT>(jobType: string, data: RequestT): Promise<ResponseT> {
    const handler = this.handlers[jobType];
    if (!handler) {
      throw new Error(`No handler registered for job type: ${jobType}`);
    }
    return handler.fireAndWaitForJobResult(data);
  }
}

