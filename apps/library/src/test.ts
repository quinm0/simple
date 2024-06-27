import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from './env';
import { LIBRARY_QUEUE_NAME, type IndexLibraryJob } from 'types';

// Redis connection configuration
const connection = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  maxRetriesPerRequest: null,
});

// Create a BullMQ queue with the job data type
const queue = new Queue<IndexLibraryJob>(LIBRARY_QUEUE_NAME, { connection });

async function addIndexJob() {
  const jobData: IndexLibraryJob = {
    type: 'index',
    directoryPath: './',
  };

  try {
    const job = await queue.add('index-job', jobData);
    console.log(`Job created with ID: ${job.id}`);
  } catch (error) {
    console.error('Error creating job:', error);
  } finally {
    await connection.quit();
  }
}

addIndexJob();