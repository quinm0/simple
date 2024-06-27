import Redis, { type RedisOptions } from 'ioredis';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';

export type HandlerFunction<RequestT, ResponseT = void> = (job: Job<RequestT>) => Promise<ResponseT>;

type JobHandlerOptions<RequestT, ResponseT> = {
  queueName: string;
  handler?: HandlerFunction<RequestT, ResponseT>;
  redis: Redis;
};

export class Handler<RequestT, ResponseT = void> {
  public queue: Queue<RequestT, ResponseT>;
  public worker?: Worker<RequestT, ResponseT>;
  private queueEvents: QueueEvents;

  constructor(options: JobHandlerOptions<RequestT, ResponseT>) {
    const { queueName, handler, redis } = options;
    console.log(`Listening to BullMQ queue: ${queueName}`);

    const queueOptions = { connection: redis };

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
  handler: (job: Job<RequestT>) => Promise<ResponseT>;
};

export class JobManager<JobTypes extends { [key: string]: { request: any; response: any } }> {
  private handlers: { [K in keyof JobTypes]?: Handler<JobTypes[K]['request'], JobTypes[K]['response']> } = {};
  private baseQueueName: string;
  private redis: Redis;

  constructor(baseQueueName: string, redisOptions: RedisOptions) {
    this.baseQueueName = baseQueueName;
    this.redis = new Redis({
      ...redisOptions,
      maxRetriesPerRequest: redisOptions.maxRetriesPerRequest ?? null,
    });
  }

  public registerHandler<K extends keyof JobTypes>(jobType: K, handler: JobHandler<JobTypes[K]['request'], JobTypes[K]['response']>['handler']): void {
    const queueName = `${this.baseQueueName}-${String(jobType)}`;
    this.handlers[jobType] = new Handler<JobTypes[K]['request'], JobTypes[K]['response']>({
      queueName,
      redis: this.redis,
      handler: handler,
    });
  }

  public async fireJob<K extends keyof JobTypes>(jobType: K, data: JobTypes[K]['request']): Promise<void> {
    const queueName = `${this.baseQueueName}-${String(jobType)}`;
    let handler = this.handlers[jobType];
    if (!handler) {
      handler = new Handler<JobTypes[K]['request'], JobTypes[K]['response']>({
        queueName,
        redis: this.redis,
      });
      this.handlers[jobType] = handler;
    }
    await handler.fireJob(data);
  }

  public async fireAndWaitForJobResult<K extends keyof JobTypes>(jobType: K, data: JobTypes[K]['request']): Promise<JobTypes[K]['response']> {
    const queueName = `${this.baseQueueName}-${String(jobType)}`;
    let handler = this.handlers[jobType];
    if (!handler) {
      handler = new Handler<JobTypes[K]['request'], JobTypes[K]['response']>({
        queueName,
        redis: this.redis,
      });
      this.handlers[jobType] = handler;
    }
    return handler.fireAndWaitForJobResult(data);
  }
}
