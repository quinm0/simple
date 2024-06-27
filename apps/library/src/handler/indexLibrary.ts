import { Job } from 'bullmq';
import { type IndexLibraryJob } from 'types';
import { readdir } from 'fs/promises';
import { runtime } from '..';

export const indexLibraryHandler = async (job: Job<IndexLibraryJob>) => {
  console.log(`Indexing library at path: ${job.data.directoryPath}`);
  const files = await readdir(job.data.directoryPath);
  console.log(`Found ${files.length} files in the directory`);
};

export async function addIndexLibraryJob(directoryPath: string) {
  await runtime.fireJob({
    type: 'index',
    directoryPath,
  });
}
