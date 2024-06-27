import { env } from './env';
import { LIBRARY_QUEUE_NAME, type LibraryJobTypes } from 'types';
import { JobManager } from 'jobmanager';
import { indexLibraryHandler } from './handler/indexLibrary';
import { addMediaDirectoryHandler } from './handler/addMediaDirectory';


export const jm = new JobManager<LibraryJobTypes>({
  baseQueueName: LIBRARY_QUEUE_NAME,
  redisOptions: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});

jm.registerHandler('indexLibrary', indexLibraryHandler);
jm.registerHandler('addMediaDirectory', addMediaDirectoryHandler);

console.log('Library job manager initialized');

// on ctrl+c, shutdown the job manager
process.on('SIGINT', async () => {
  await jm.shutdown();
  process.exit(0);
});
