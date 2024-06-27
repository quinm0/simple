import { Job } from 'bullmq';
import { jobRuntime, queue } from './index';
import { type IndexLibraryJob } from 'types';
import { readdir } from 'fs/promises';

const indexLibraryHandler = async (job: Job<IndexLibraryJob>) => {
  console.log(`Indexing library at path: ${job.data.directoryPath}`);
  const files = await readdir(job.data.directoryPath);
  console.log(`Found ${files.length} files in the directory`);
};

export function registerIndexLibraryHandler() {
  jobRuntime.registerHandler('index', indexLibraryHandler);
}

export async function addIndexLibraryJob(directoryPath: string) {
  const jobData: IndexLibraryJob = {
    type: 'index',
    directoryPath,
  };

  try {
    const job = await queue.add('index-job', jobData);
    console.log(`Index library job created with ID: ${job.id}`);
  } catch (error) {
    console.error('Error creating index library job:', error);
  }
}
