import { env } from './env';
import { LIBRARY_QUEUE_NAME, type LibraryJobTypes } from 'types';
import { JobManager } from 'jobruntime';

export const jm = new JobManager<LibraryJobTypes>(LIBRARY_QUEUE_NAME, {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
});

const jobPromises = [];
let successCount = 0;
let failCount = 0;

for (let i = 0; i < 10; i++) {
  const startTime = Date.now();
  jobPromises.push(jm.fireAndWaitForJobResult('indexLibrary', {
    directoryPath: './',
  }).then(result => {
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.log(`Job ${i + 1} completed in ${timeTaken}ms at ${new Date(endTime).toISOString()}`);
    console.log(result);
    successCount++;
  }).catch(error => {
    const endTime = Date.now();
    const timeTaken = endTime - startTime;
    console.error(`Error processing job ${i + 1} in ${timeTaken}ms at ${new Date(endTime).toISOString()}:`, error);
    failCount++;
  }));
}

await Promise.all(jobPromises);

console.log(`Total successful jobs: ${successCount}`);
console.log(`Total failed jobs: ${failCount}`);

process.exit(0);

