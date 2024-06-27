import { env } from './env';
import { LIBRARY_QUEUE_NAME, type IndexLibraryJob, type IndexLibraryJobResult, type LibraryJobData, type LibraryJobResult } from 'types';
import { JobHandler } from 'jobruntime';
import { indexLibraryHandler } from './handler/indexLibrary';

export const jm = new JobHandler<IndexLibraryJob, IndexLibraryJobResult>({
  queueName: `${LIBRARY_QUEUE_NAME}-index`,
  redis: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  handler: indexLibraryHandler,
});


