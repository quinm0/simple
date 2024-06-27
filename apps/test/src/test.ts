import { env } from '../../library/src/env';
import { LIBRARY_QUEUE_NAME, LibraryJobNames, type LibraryJobTypes } from 'types';
import { JobManager } from 'jobmanager';
import Redis from 'ioredis';

// Flush Redis database to ensure a clean state
const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
});
await redis.flushdb();
console.log('Redis database flushed');

export const jm = new JobManager<LibraryJobTypes>({
  baseQueueName: LIBRARY_QUEUE_NAME,
  redisOptions: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  jobTypes: LibraryJobNames,
});

const jobPromises = [];
let successCount = 0;
let failCount = 0;

for (let i = 0; i < 10000; i++) {
  const startTime = Date.now();
  jobPromises.push(
    jm.fireAndWaitForJobResult('indexLibrary', {
      directoryPath: './',
    })
    .then(result => {
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      console.log(`Job ${i + 1} completed in ${timeTaken}ms at ${new Date(endTime).toISOString()}`);
      console.log(result);
      successCount++;
    })
    .catch(error => {
      const endTime = Date.now();
      const timeTaken = endTime - startTime;
      console.error(`Error processing job ${i + 1} in ${timeTaken}ms at ${new Date(endTime).toISOString()}:`, error);
      failCount++;
    })
  );
  await new Promise(resolve => setTimeout(resolve, 0.0001)); // Delay of 1 second between job submissions
}

try {
  await Promise.all(jobPromises);
} catch (error) {
  console.error('Error waiting for all job promises:', error);
}

console.log(`Total successful jobs: ${successCount}`);
console.log(`Total failed jobs: ${failCount}`);

process.exit(0);
