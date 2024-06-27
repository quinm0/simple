import { env } from '../../library/src/env';
import { LIBRARY_QUEUE_NAME, LibraryJobNames, type LibraryJobTypes } from 'types';
import { JobManager } from 'jobmanager';

export const libraryJM = new JobManager<LibraryJobTypes>({
  baseQueueName: LIBRARY_QUEUE_NAME,
  redisOptions: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
  jobTypes: LibraryJobNames,
});
