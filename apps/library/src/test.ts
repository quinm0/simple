import { env } from './env';
import { LIBRARY_QUEUE_NAME, type IndexLibraryJob, type LibraryJobData, type LibraryJobResult } from 'types';
import { JobManager, JobRuntimeManager } from 'jobruntime';

export const jm = new JobManager({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  queueName: LIBRARY_QUEUE_NAME,
})

const job = await jm.fireAndAwaitJobCompletion<IndexLibraryJob>({
  type: 'index',
  directoryPath: './',
});
  
console.log(job);
// await jm.shutdown();
// process.exit(0);