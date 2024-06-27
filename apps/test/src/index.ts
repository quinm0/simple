import { libraryJM } from './shared';

const result = await libraryJM.fireAndWaitForJobResult('indexLibrary', {
  directoryPath: './',
});

// log how many are directories and how many are files
const numDirectories = result.files.filter(file => file.isDirectory).length;
const numFiles = result.files.filter(file => !file.isDirectory).length;
console.log(`Number of directories: ${numDirectories}`);
console.log(`Number of files: ${numFiles}`);
process.exit(0);