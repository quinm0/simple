const LIBRARY_JOB_NAMES = {
  indexLibrary: 'indexLibrary',
  addMediaDirectory: 'addMediaDirectory',
} as const;
type LibraryJobName = (typeof LIBRARY_JOB_NAMES)[keyof typeof LIBRARY_JOB_NAMES];
const LibraryJobNames = Object.values(LIBRARY_JOB_NAMES) 

type IndexLibraryJob = {
  directoryPath: string;
}
type IndexLibraryJobResult = {
  indexedFiles: number;
  files: {
    path: string;
    size: number;
    isDirectory: boolean;
  }[];
}

type AddMediaDirectoryJob = {
  path: string;
}
type AddMediaDirectoryJobResult = {
  success: true;
  directoryId: number;
} | {
  success: false;
  error: string;
};

type LibraryJobTypes = {
  [LIBRARY_JOB_NAMES.indexLibrary]: {
    request: IndexLibraryJob;
    response: IndexLibraryJobResult;
  };
  [LIBRARY_JOB_NAMES.addMediaDirectory]: {
    request: AddMediaDirectoryJob;
    response: AddMediaDirectoryJobResult;
  };
};

export type {
  IndexLibraryJob,
  IndexLibraryJobResult,
  LibraryJobTypes,
  LibraryJobName,
  AddMediaDirectoryJob,
  AddMediaDirectoryJobResult,
};

export {
  LIBRARY_JOB_NAMES,
  LibraryJobNames,
}