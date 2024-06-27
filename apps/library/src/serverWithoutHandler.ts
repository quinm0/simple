import { env } from './env';
import { LIBRARY_QUEUE_NAME, type LibraryJobData, type LibraryJobResult } from 'types';
import { JobRuntimeManager } from 'jobruntime';

export const runtime = new JobRuntimeManager<LibraryJobData, LibraryJobResult>({
  queueName: LIBRARY_QUEUE_NAME,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  debugInterval: 3000
});
