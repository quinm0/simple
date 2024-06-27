import Redis, { type RedisOptions } from 'ioredis';
import { Queue, Worker, Job, QueueEvents } from 'bullmq';

export type HandlerFunction<RequestT, ResponseT = void> = (job: Job<RequestT>) => Promise<ResponseT>;

type JobHandlerOptions<RequestT, ResponseT> = {
  queueName: string;
  handler: HandlerFunction<RequestT, ResponseT>;
  redis: Redis;
};

type JobHandler<RequestT, ResponseT> = {
  queueName: string;
  handler: (job: Job<RequestT>) => Promise<ResponseT>;
};

export class JobManager<JobTypes extends { [key: string]: { request: any; response: any } }> {
  private redis: Redis;
  private baseQueueName: string;
  private workers: { [K in keyof JobTypes]?: Worker<JobTypes[K]['request'], JobTypes[K]['response']> } = {};
  private queueEvents: { [K in keyof JobTypes]?: QueueEvents } = {};
  private queues: { [K in keyof JobTypes]?: Queue<JobTypes[K]['request'], JobTypes[K]['response']> } = {};

  constructor(params: { 
    baseQueueName: string; 
    redisOptions: RedisOptions;
    jobTypes?: (keyof JobTypes)[];
  }) {
    const { baseQueueName, redisOptions, jobTypes = [] } = params;
    this.baseQueueName = baseQueueName;
    this.redis = new Redis({
      ...redisOptions,
      maxRetriesPerRequest: redisOptions.maxRetriesPerRequest ?? null,
    });

    if (jobTypes.length) {
      console.log(`Initializing queues for ${jobTypes.length} job types`);
      this.initializeQueues(jobTypes);
    }
  }

  private initializeQueues(jobTypes: (keyof JobTypes)[]): void {
    for (const jobType of jobTypes) {
      const queueName = this.getQueueName(jobType);
      this.queues[jobType] = new Queue<JobTypes[typeof jobType]['request'], JobTypes[typeof jobType]['response']>(queueName, { connection: this.redis });
    }
  }

  private getQueueName<K extends keyof JobTypes>(jobType: K): string {
    return `${this.baseQueueName}-${String(jobType)}`;
  }

  public async registerHandler<K extends keyof JobTypes>(jobType: K, handler: JobHandler<JobTypes[K]['request'], JobTypes[K]['response']>['handler']): Promise<void> {
    const queueName = this.getQueueName(jobType);
    const queueOptions = { connection: this.redis };

    const worker = new Worker<JobTypes[K]['request'], JobTypes[K]['response']>(queueName, handler, queueOptions);
    const queueEvents = new QueueEvents(queueName, queueOptions);
    const queue = new Queue<JobTypes[K]['request'], JobTypes[K]['response']>(queueName, queueOptions);
    await queueEvents.waitUntilReady();

    this.setupWorkerEvents(worker);

    this.workers[jobType] = worker;
    this.queueEvents[jobType] = queueEvents;
    this.queues[jobType] = queue;
  }

  private setupWorkerEvents<K extends keyof JobTypes>(worker: Worker<JobTypes[K]['request'], JobTypes[K]['response']>): void {
    worker.on('completed', job => {
      console.log(`Job ${job.id} has been completed`);
    });

    worker.on('failed', (job, err) => {
      console.log(`Job ${job?.id} has failed with error ${err.message}`);
    });

    worker.on('error', err => {
      console.log(`Worker encountered an error: ${err.message}`);
    });
  }

  public async fireJob<K extends keyof JobTypes>(jobType: K, data: JobTypes[K]['request']): Promise<void> {
    const queue = this.getQueue(jobType);
    await queue.add('job', data);
    console.log(`Job added to queue: ${JSON.stringify(data)}`);
  }

  public async fireAndWaitForJobResult<K extends keyof JobTypes>(jobType: K, data: JobTypes[K]['request']): Promise<JobTypes[K]['response']> {
    const queue = this.getQueue(jobType);
    const queueEvents = await this.getQueueEvents(jobType);

    return new Promise<JobTypes[K]['response']>((resolve, reject) => {
      queue.add('job', data).then(job => {
        console.log(`Job ${job.id} added to queue`);
        job.waitUntilFinished(queueEvents)
          .then(result => {
            console.log(`Job ${job.id} has been completed with result: ${JSON.stringify(result)}`);
            resolve(result);
          })
          .catch(err => {
            console.log(`Job ${job.id} has failed with error: ${err.message}`);
            reject(err);
          });
      }).catch(err => {
        console.log(`Failed to add job to queue with error: ${err.message}`);
        reject(err);
      });
    });
  }

  private getQueue<K extends keyof JobTypes>(jobType: K): Queue<JobTypes[K]['request'], JobTypes[K]['response']> {
    const queue = this.queues[jobType];
    if (!queue) {
      throw new Error(`Queue not initialized for jobType: ${String(jobType)}`);
    }
    return queue;
  }

  private async getQueueEvents<K extends keyof JobTypes>(jobType: K): Promise<QueueEvents> {
    if (!this.queueEvents[jobType]) {
      const queueName = this.getQueueName(jobType);
      const newQueueEvents = new QueueEvents(queueName, { connection: this.redis });
      await newQueueEvents.waitUntilReady();
      this.queueEvents[jobType] = newQueueEvents;
    }
    return this.queueEvents[jobType]!;
  }
}
