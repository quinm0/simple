import { Job } from 'bullmq';
import { type IndexLibraryJob, type IndexLibraryJobResult } from 'types';
import { readdir } from 'fs/promises';
import { jm } from '..';
import type { HandlerFunction } from 'jobruntime';

export const indexLibraryHandler: HandlerFunction<IndexLibraryJob, IndexLibraryJobResult> = async (job: Job<IndexLibraryJob>) => {
  console.log(`Indexing library at path: ${job.data.directoryPath}`);
  
  // // Introduce a random failure 1/5 times
  // if (Math.random() < 0.2) {
  //   throw new Error('Random failure occurred while indexing the library');
  // }

  const files = await readdir(job.data.directoryPath);
  console.log(`Found ${files.length} files in the directory`);
  
  return {
    indexedFiles: files.length,
  };
};
