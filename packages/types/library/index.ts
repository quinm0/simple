
type IndexLibraryJob = {
  type: 'index';
}

type RandomLibraryJob = {
  type: 'random';
}

type LibraryJobData = IndexLibraryJob | RandomLibraryJob;



export type {
  LibraryJobData,
  IndexLibraryJob,
  RandomLibraryJob,
};