import { libraryJM } from './shared';

await libraryJM.fireAndWaitForJobResult('indexLibrary', {
  directoryPath: './',
});

process.exit(0);