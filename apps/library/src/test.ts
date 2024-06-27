import { env } from './env';
import { LIBRARY_QUEUE_NAME, type LibraryJobData, type LibraryJobResult } from 'types';
import { JobRuntimeManager } from 'jobruntime';

export const runtime = new JobRuntimeManager<LibraryJobData, LibraryJobResult>(
  LIBRARY_QUEUE_NAME,
  env.REDIS_HOST,
  env.REDIS_PORT
);

const result = await runtime.fireAndAwaitJobCompletion({
  type: 'index',
  directoryPath: './',
});

console.log(result);
await runtime.shutdown();
process.exit(0);