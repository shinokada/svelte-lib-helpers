#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

// create props
export async function generateRunesComponentData () {
  /*
  The default value for destination is ./src/routes/component-data/ and
  for src is ./src/lib. Use --dest destination-dir and --src source-dir to change the destination and src directories.
  */
  const defaultSrc = './src/lib';
  const defaultDest = './src/routes/component-data/';
  const exportLet = 'export let';

  // Create the defaultDest directory if it doesn't exist
  // await fs.mkdir(defaultDest, { recursive: true });
  try {
    await fs.promises.mkdir(defaultDest, { recursive: true });
    console.log('The src/prop directory created successfully!');
  } catch (err) {
    console.error(err);
  }
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

  /**
   * Extracts props from a file content and returns an array of parsed props.
   *
   * @param {string} filePath - The path to the file containing the props.
   * @return {Array<Array<string|string>>} An array of parsed props, where each prop is an array with two elements: the name and the default value.
   */
  const getProps = (filePath) => {
    console.log(`Processing file: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf-8');
    console.log('File content:', content);
  
    const propLines = content.match(/let\s*{[\s\S]*?}(?:\s*:\s*(?:\w+(?:PropsType)?|Props))?\s*=\s*\$props\(\);/);
    console.log('Matched prop lines:', propLines);
  
    if (propLines) {
      const propsExtract = propLines[0].match(/\{([\s\S]*?)\}/)[1];
      console.log('Extracted props:', propsExtract);
      
      // Split props by commas, but not within nested structures
      const props = [];
      let depth = 0;
      let currentProp = '';
      let inString = false;
      
      for (let i = 0; i < propsExtract.length; i++) {
        const char = propsExtract[i];
        if (char === '{' && !inString) depth++;
        if (char === '}' && !inString) depth--;
        if (char === '"' || char === "'") inString = !inString;
        
        currentProp += char;
        
        if ((char === ',' && depth === 0 && !inString) || i === propsExtract.length - 1) {
          props.push(currentProp.trim());
          currentProp = '';
        }
      }
  
      console.log('Split props:', props);
  
      const parsedProps = props.map(prop => {
        console.log('Processing prop:', prop);
        let [name, ...defaultValueParts] = prop.split('=').map(p => p.trim());
        let defaultValue = defaultValueParts.join('=').trim();
        
        // Remove trailing comma if present
        name = name.replace(/,$/, '');
        
        console.log('Name:', name, 'Default value:', defaultValue);
  
        // Handle spread operator
        if (name.startsWith('...')) {
          console.log('Spread operator detected');
          return [name, ''];
        }
  
        // Handle class: className case
        if (name.includes(':')) {
          console.log('Class alias detected');
          const [propName, propAlias] = name.split(':').map(s => s.trim());
          return [`${propName}:${propAlias}`, ''];
        }
  
        // Process default value
        if (defaultValue) {
          console.log('Processing default value');
          // Remove comments
          defaultValue = defaultValue.replace(/\/\/.*$/g, '').trim();
          // Handle object literals
          if (defaultValue.startsWith('{')) {
            // Keep the curly braces for object literals
            defaultValue = defaultValue.trim();
            // Ensure the closing brace is included
            if (!defaultValue.endsWith('}')) {
              defaultValue += '}';
            }
          } else {
            // Remove quotes for string values
            defaultValue = defaultValue.replace(/^['"]|['"]$/g, '');
          }
          // Remove trailing comma if present
          defaultValue = defaultValue.replace(/,$/, '');
        } else {
          defaultValue = '';
        }
  
        console.log('Final prop:', [name, defaultValue]);
        return [name, defaultValue];
      });
  
      console.log('Final props array:', parsedProps);
      return parsedProps;
    }
  
    console.log('No props found');
    return [];
  };

  /**
   * Asynchronously creates an array of filenames by recursively reading all files in a directory.
   *
   * @return {Promise<string[]>} A promise that resolves to an array of filenames.
   */
  async function createFilenames () {
    const deepReadDir = async (dirPath) =>
      await Promise.all(
        (
          await readdir(dirPath)
        ).map(async (entity) => {
          const path = join(dirPath, entity);
          // return (await lstat(path)).isDirectory() ? await deepReadDir(path) : path;
          const stats = await lstat(path);

          if (stats.isDirectory()) {
            return await deepReadDir(path);
          } else {
            // Filter out unwanted files here (e.g., .DS_Store)
            if (entity !== '.DS_Store') {
              return path;
            } else {
              return null;
            }
          }
        })
      );
    const files = await deepReadDir(srcLib);
    const all = files.flat(Number.POSITIVE_INFINITY).filter(Boolean);
    return all;
  }


  /**
   * Writes the given data to a file with the specified filename.
   *
   * @param {string} fileName - The name of the file to write to.
   * @param {string} data - The data to write to the file.
   * @return {void} This function does not return anything.
   * @throws {Error} If there is an error while writing the file.
   */
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
  console.log('All files:', allFiles);

  allFiles.forEach((myfile) => {
    console.log(`Processing file: ${myfile}`);
    let eventsResult = [];
    let propsResult = [];

    // create a file name
    let name = path.parse(myfile).name;
    console.log('File name:', name);
    let outputfile = directory + name + '.json';

    // props
    propsResult = getProps(myfile);
    console.log('Props result:', propsResult);

    const data = {
      name,
      props: propsResult,
    };
    console.log('Data to be written:', data);
    writeToFile(outputfile, JSON.stringify(data));
  });
}