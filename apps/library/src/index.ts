import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';
import { LIBRARY_QUEUE_NAME, type LibraryJobData } from 'types';
import { JobRuntime } from 'jobruntime';
import { registerIndexLibraryHandler } from './indexLibrary';

// Redis connection configuration
const connection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});


export const jobRuntime = new JobRuntime<LibraryJobData>();

// Create a BullMQ queue with the job data type
export const queue = new Queue<LibraryJobData>(LIBRARY_QUEUE_NAME, { connection });

// Consumer: Processing jobs from the queue
const worker = new Worker<LibraryJobData>(LIBRARY_QUEUE_NAME, async (job: Job<LibraryJobData>) => {
  const handler = jobRuntime.getHandler(job.data.type);
  if (handler) {
    await handler(job);
  } else {
    console.error(`No handler found for job type: ${job.data.type}`);
  }
}, { connection });

let interval: Timer;

// Keep the app running without a HTTP server
const keepAppRunning = () => {
  registerIndexLibraryHandler();
  console.log('App is running');
  interval = setInterval(() => {
    console.log('App is running');
  }, 10000);
};

keepAppRunning();

process.on('SIGINT', async () => {
  console.log('Server is closing');
  await worker.close();
  await connection.quit();
  clearInterval(interval);
  console.log('Server is closed');
  process.exit(0);
});
