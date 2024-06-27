
type IndexLibraryJob = {
  directoryPath: string;
}

type GetFileDetailsJob = {
  filePath: string;
}

type FileDetailsJobResult = {
  filePath: string;
  fileSize: number;
  fileType: string;
}

type IndexLibraryJobResult = {
  indexedFiles: number;
}

type LibraryJobData = IndexLibraryJob | GetFileDetailsJob;
type LibraryJobResult = FileDetailsJobResult | IndexLibraryJobResult;

export type {
  LibraryJobData,
  IndexLibraryJob,
  GetFileDetailsJob,
  FileDetailsJobResult,
  IndexLibraryJobResult,
  LibraryJobResult,
};