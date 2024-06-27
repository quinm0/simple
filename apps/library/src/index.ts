import { env } from './env';
import { LIBRARY_QUEUE_NAME, type LibraryJobData, type LibraryJobResult } from 'types';
import { JobRuntimeManager } from 'jobruntime';
import { indexLibraryHandler } from './handler/indexLibrary';

export const runtime = new JobRuntimeManager<LibraryJobData, LibraryJobResult>(
  LIBRARY_QUEUE_NAME,
  env.REDIS_HOST,
  env.REDIS_PORT
);

runtime.registerHandler('index', indexLibraryHandler);

