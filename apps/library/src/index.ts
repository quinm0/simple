import { env } from './env';
import { LIBRARY_QUEUE_NAME, type LibraryJobData, type LibraryJobResult } from 'types';
import { JobRuntimeManager } from 'jobruntime';
import { indexLibraryHandler } from './handler/indexLibrary';

export const runtime = new JobRuntimeManager<LibraryJobData, LibraryJobResult>({
  queueName: LIBRARY_QUEUE_NAME,
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  debugAfterRequest: true,
  debugInterval: 3000
});

runtime.registerHandler('index', indexLibraryHandler);

