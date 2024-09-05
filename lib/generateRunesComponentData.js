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

  const getProps = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');
  
    const propLines = content.match(/let {([^}]*)}: (?:\w+(?:PropsType)?|Props) = \$props\(\)/g);
  
    if (propLines) {
      // Extract content within curly braces and remove comments
      const propsExtract = propLines[0].match(/\{([\s\S]*?)\}/)[1].replace(/\/\/.*$/gm, '');
      
      // Split the props and process each one
      return propsExtract.split(',').map(prop => {
        const [name, defaultValue] = prop.split('=').map(part => part.trim());
        
        // Handle spread operator case
        if (name.startsWith('...')) {
          return [name, ''];
        }
        
        // Handle class: divClass case
        if (name.includes(':')) {
          return [name, ''];
        }
        
        // For props with default values
        if (defaultValue !== undefined) {
          return [name, defaultValue.replace(/'/g, '')];
        }
        
        // For props without default values
        return [name, ''];
      });
    }
  
    return [];
  };

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

  // extract all events that do not have = sign
  // const extractEvents = (filePath) => {
  //   const fileContent = fs.readFileSync(filePath, 'utf8');
  //   const regex = /on:([a-zA-Z_]\w*)(?=(\s|$|>))(?![^{]*\})/g;
  //   const matches = fileContent.match(regex) || [];
  //   return matches;
  // };

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
    // let slotsResult = [];
    let eventsResult = [];
    let propsResult = [];

    // create a file name
    let name = path.parse(myfile).name;
    // console.log('file name: ', name)
    let outputfile = directory + name + '.json';

    // events
    // eventsResult = extractEvents(myfile);

    // props
    propsResult = getProps(myfile);
  

    const data = {
      name,
      // events: eventsResult,
      props: propsResult,
    };
    writeToFile(outputfile, JSON.stringify(data));
  });
}