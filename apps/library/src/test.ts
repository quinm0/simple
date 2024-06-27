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

async function addIndexJobs(n: number) {
  const jobData: IndexLibraryJob = {
    type: 'index',
    directoryPath: './',
  };

  try {
    for (let i = 0; i < n; i++) {
      const job = await queue.add(`index-job-${i}`, jobData);
      console.log(`Job created with ID: ${job.id}`);
    }
  } catch (error) {
    console.error('Error creating jobs:', error);
  } finally {
    await connection.quit();
  }
}

const numberOfJobs = 5; // specify the number of jobs to fire
await addIndexJobs(numberOfJobs);
connection.quit();
// exit process
process.exit(0);
