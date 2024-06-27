import { LIBRARY_QUEUE_NAME, type IndexLibraryJob } from 'types';
import {queue} from './index'

export async function createIndexJob() {
  const jobData: IndexLibraryJob = {
    type: 'index',
    directoryPath: './',
  };

  try {
    const job = await queue.add(LIBRARY_QUEUE_NAME, jobData);
    console.log(`Job created with ID: ${job.id}`);
  } catch (error) {
    console.error('Error creating job:', error);
  }
}


createIndexJob();