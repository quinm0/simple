
type IndexLibraryJob = {
  type: 'index';
  directoryPath: string;
}

type GetFileDetailsJob = {
  type: 'get-file-details';
  filePath: string;
}

type FileDetailsJobResult = {
  type: 'file-details-result';
  filePath: string;
  fileSize: number;
  fileType: string;
}

type LibraryJobData = IndexLibraryJob | GetFileDetailsJob;
type LibraryJobResult = FileDetailsJobResult;

export type {
  LibraryJobData,
  IndexLibraryJob,
  GetFileDetailsJob,
  FileDetailsJobResult,
  LibraryJobResult,
};