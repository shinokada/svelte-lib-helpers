/**
 * This script will create a json file for each component. First it will remove all files in the src/props directory. Then it will read each file in the lib directory and extract the props from the file and write in the `src/props` directory.
 *
 * Run this script from the root of the project.
 * node createProps.js
 * You can pass arguments to the script.
 * node createProps.js --src=src/lib --dest=src/props
 */

import * as fs from 'fs';
import path from 'path';
import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

export default async function createprops() {
  const defaultSrc = './src/lib';
  const defaultDest = './src/routes/props/';
  const exportLet = 'export let';

  // Checks for --dest (destination) and if it has a value
  const destIndex = process.argv.indexOf('--dest');
  let destValue;

  if (destIndex > -1) {
    // Retrieve the value after --dest
    destValue = process.argv[destIndex + 1];
  }

  // set destination directory
  const directory = destValue || defaultDest;

  // Checks for --src and if it has a value
  const srcIndex = process.argv.indexOf('--src');
  let srcValue;

  if (srcIndex > -1) {
    // Retrieve the value after --src
    srcValue = process.argv[srcIndex + 1];
  }

  // set lib directory value
  const srcLib = srcValue || defaultSrc;

  const getLines = (fileName, keyword) => {
    let outputs = [];
    const file = fs.readFileSync(fileName, { encoding: 'utf-8' });

    // Split by newline, remove comments, and filter out script tags
    let arr = file
      .split('\n')
      .filter((line) => !line.trim().startsWith('//'))
      .filter((line) => !line.trim().startsWith('<script'))
      .filter((line) => !line.includes(': {'))
      .filter((line) => !line.includes('export type'))
      .filter((line) => !line.includes('export interface'));

    // Iterate over the array and check for the exportLet keyword
    for (let i = 0; i < arr.length; i++) {
      let line = arr[i];

      if (line.includes(keyword)) {
        // If the line ends with '=', it means it's a multiline export statement
        if (line.trim().endsWith('=')) {
          // Concatenate the next line to the current line
          line += ' ' + arr[++i].trim();
        }
        outputs.push(line);
      }
    }

    return outputs;
  };

  async function createFilenames() {
    const deepReadDir = async (dirPath) =>
      await Promise.all(
        (
          await readdir(dirPath)
        ).map(async (entity) => {
          const path = join(dirPath, entity);
          return (await lstat(path)).isDirectory() ? await deepReadDir(path) : path;
        })
      );
    const files = await deepReadDir(srcLib);
    const all = files.flat(Number.POSITIVE_INFINITY);
    return all;
  }

  function extractProps(arr) {
    let obj = {};
    let result = [];

    arr.forEach((line, index) => {
      // Remove line breaks and extra spaces from the line
      let newline = line.replace(/[\r\n]+/gm, '').trim();

      // Check if the line starts with 'export let'
      if (newline.startsWith('export let')) {
        let name, type, value;

        // Remove 'export let' from the line
        newline = newline.replace('export let ', '');

        let colonPosition = newline.indexOf(':');
        let equalsPosition = newline.indexOf('=');

        // If there's a colon and equals sign, and the colon appears before the equals sign
        if (colonPosition > -1 && colonPosition < equalsPosition) {
          // Extract the name from the line
          name = newline.slice(0, colonPosition).trim();
          // Extract the remaining part of the line after the colon
          let remaining = newline.slice(colonPosition + 1).trim();

          // Split the remaining part by the equals sign
          let typeAndValue = remaining.split('=');

          // If there are two parts after splitting by the equals sign
          if (typeAndValue.length === 2) {
            // Extract the type and value from the parts
            type = typeAndValue[0].trim();
            value = typeAndValue[1].trim();
          } else {
            // If there's only one part, set the type and leave the value empty
            type = remaining.trim();
            value = '';
          }
        } else {
          // If there's no colon or if the equals sign appears before the colon
          let nameAndValue = newline.split('=');

          // If there are two parts after splitting by the equals sign
          if (nameAndValue.length === 2) {
            // Extract the name and value from the parts
            name = nameAndValue[0].trim();
            value = nameAndValue[1].trim();
          } else {
            // If there's only one part, set the name and leave the value empty
            name = newline.trim();
            const nameParts = name.split(':');
            if (nameParts.length === 2) {
              name = nameParts[0].trim();
              type = nameParts[1].replace(';', '').trim();
            }
            value = '';
          }

          // Default the type to 'string'
          if (!type) {
            type = 'string';
          }
        }

        // If the value is empty or ends with an equals sign, check the next lines for the value
        if (value === '' || value.endsWith('=')) {
          let valueLines = [];
          let i = index + 1;
          while (i < arr.length) {
            const nextLine = arr[i].trim();
            if (!nextLine.startsWith('export let')) {
              valueLines.push(nextLine);
              if (nextLine.endsWith(';')) {
                break;
              }
            } else {
              break;
            }
            i++;
          }
          // Join the value lines into a single string
          value = valueLines.join(' ').trim();
        }

        // Remove the semicolon at the end of the value, if present
        if (value.endsWith(';')) {
          value = value.slice(0, -1).trim();
        }

        console.log(`Name: ${name}, Type: ${type}, Value: ${value}`);
        // Add the extracted name, type, and value to the result array
        result.push([name, type, value]);
      }
    });

    // Set the 'props' key in the obj to the extracted result array
    obj.props = result;

    return obj;
  }

  const writeToFile = (fileName, data) => {
    fs.writeFile(fileName, data, (err) => {
      if (err) throw err;
      console.log('The file has been saved!', fileName);
    });
  };

  // remove all files in the folder
  fs.readdir(directory, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) throw err;
      });
      console.log('file deleted: ', file);
    }
  });

  const allFiles = await createFilenames();
  // console.log( allFiles)
  allFiles.forEach((myfile) => {
    // create a file name
    let name = path.parse(myfile).name;
    let outputfile = directory + name + '.json';
    // console.log('name: ', name)
    let result = getLines(myfile, exportLet);
    // console.log('result: ', result)
    if (result.length > 0) {
      // console.log('result: ', result)
      let resultItem = extractProps(result);
      // console.log('resultItem: ', resultItem)
      writeToFile(outputfile, JSON.stringify(resultItem));
    }
  });
}
