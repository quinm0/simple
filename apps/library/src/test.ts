import { env } from './env';
import { LIBRARY_QUEUE_NAME, type IndexLibraryJob, type IndexLibraryJobResult, type LibraryJobData, type LibraryJobResult } from 'types';
import { Handler } from 'jobruntime';

export const jm = new Handler<IndexLibraryJob, IndexLibraryJobResult>({
  queueName: `${LIBRARY_QUEUE_NAME}-index`,
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

const jobPromises = [];

for (let i = 0; i < 5; i++) {
  const startTime = Date.now();
  jobPromises.push(jm.fireAndWaitForJobResult({
    directoryPath: './',
  }).then(result => {
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`Job ${i + 1} completed in ${timeTaken}ms at ${new Date(endTime).toISOString()}`);
    console.log(result);
  }).catch(error => {
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.error(`Error processing job ${i + 1} in ${timeTaken}ms at ${new Date(endTime).toISOString()}:`, error);
  }));
}

await Promise.all(jobPromises);

process.exit(0);

