
type IndexLibraryJob = {
  directoryPath: string;
}

type IndexLibraryJobResult = {
  indexedFiles: number;
}

type LibraryJobTypes = {
  indexLibrary: {
    request: IndexLibraryJob;
    response: IndexLibraryJobResult;
  };
};

export type {
  IndexLibraryJob,
  IndexLibraryJobResult,
  LibraryJobTypes,
};