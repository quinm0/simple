import { libraryJM } from './shared';

// // Index directory
// const result = await libraryJM.fireAndWaitForJobResult('indexLibrary', {
//   directoryPath: './',
// });

// // log how many are directories and how many are files
// const numDirectories = result.files.filter(file => file.isDirectory).length;
// const numFiles = result.files.filter(file => !file.isDirectory).length;
// console.log(`Number of directories: ${numDirectories}`);
// console.log(`Number of files: ${numFiles}`);

// // add a directory
// const result = await libraryJM.fireAndWaitForJobResult('addMediaDirectory', {
//   path: '/home/qmoran/simple/testMedia',
// });
// console.log('Created directory:', result);

// list media directories
const result = await libraryJM.fireAndWaitForJobResult('listMediaDirectories', {
  directoryId: 1,
});
console.log('List media directories:', result);


// quit
process.exit(0);