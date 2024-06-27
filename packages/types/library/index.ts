const LIBRARY_JOB_NAMES = {
  indexLibrary: 'indexLibrary',
} as const;
type LibraryJobName = (typeof LIBRARY_JOB_NAMES)[keyof typeof LIBRARY_JOB_NAMES];
const LibraryJobNames = Object.values(LIBRARY_JOB_NAMES) 

type IndexLibraryJob = {
  directoryPath: string;
}

type IndexLibraryJobResult = {
  indexedFiles: number;
}

type LibraryJobTypes = {
  [LIBRARY_JOB_NAMES.indexLibrary]: {
    request: IndexLibraryJob;
    response: IndexLibraryJobResult;
  };
};

export type {
  IndexLibraryJob,
  IndexLibraryJobResult,
  LibraryJobTypes,
  LibraryJobName
};

export {
  LIBRARY_JOB_NAMES,
  LibraryJobNames,
}