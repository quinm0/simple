const LIBRARY_JOB_NAMES = {
  indexLibrary: 'indexLibrary',
  addMediaDirectory: 'addMediaDirectory',
  listMediaDirectories: 'listMediaDirectories',
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

type ListMediaDirectoriesJob = {
  directoryId: number;
}
type ListMediaDirectoriesJobResult = {
  directories: {
    id: number;
    path: string;
  }[];
}

type LibraryJobTypes = {
  [LIBRARY_JOB_NAMES.indexLibrary]: {
    request: IndexLibraryJob;
    response: IndexLibraryJobResult;
  };
  [LIBRARY_JOB_NAMES.addMediaDirectory]: {
    request: AddMediaDirectoryJob;
    response: AddMediaDirectoryJobResult;
  };
  [LIBRARY_JOB_NAMES.listMediaDirectories]: {
    request: ListMediaDirectoriesJob;
    response: ListMediaDirectoriesJobResult;
  };
};

export type {
  IndexLibraryJob,
  IndexLibraryJobResult,
  LibraryJobTypes,
  LibraryJobName,
  AddMediaDirectoryJob,
  AddMediaDirectoryJobResult,
  ListMediaDirectoriesJob,
  ListMediaDirectoriesJobResult,
};

export {
  LIBRARY_JOB_NAMES,
  LibraryJobNames,
}