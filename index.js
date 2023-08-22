#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';

const srcDir = './src/lib';
const distDir = './dist';
const packageJsonPath = './package.json';

const args = process.argv.slice(2);
const command = args[0];

// add component docs
const addCompoDocs = (srcDir) => {
  // const srcDir = path.join(__dirname, 'src', 'lib');
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const documentationURL = getDocumentationURL(packageJsonPath);

  if (!documentationURL) {
    throw new Error('"homepage" value is not specified in package.json');
  }

  const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove previous @component comments and trailing empty lines
    content = content.replace(/<!--\s*@component[\s\S]*?-->\n*/, '').replace(/\s*$/, '');

    // Find all lines starting with 'export let' and create @prop comments
    const propLines = content.match(/export let [\s\S]*?;/g);
    if (propLines) {
      const propComment = propLines.map(line => {
        return `@prop ${line.replace(/\/\/.*$/, '').trim()}`;
      }).join('\n');

      content = `${content}\n\n<!--\n@component\n[Go to docs](${documentationURL})\n## Props\n${propComment}\n-->\n`;

      fs.writeFileSync(filePath, content, 'utf-8');
    }
  };

  const traverseDirectory = (dirPath) => {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        traverseDirectory(itemPath); // Recurse into subdirectories
      } else if (stat.isFile() && item.endsWith('.svelte')) {
        processFile(itemPath); // Process files
      }
      console.log('Completed: ', item);
    }
  };
  console.log("Generating documentation...");
  traverseDirectory(srcDir, documentationURL);
  console.log("All done!");
};
// this will find the hompage value from package.json
const getDocumentationURL = (packageJsonPath) => {
  try {
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJsonData = JSON.parse(packageJsonContent);
    return packageJsonData.homepage || null;
  } catch (error) {
    return null; // Could not read or parse package.json
  }
};
// end of component docs

// add export to package.json
export const exportSvelteComponents = (distDir, packageJsonPath) => {
  console.log('Adding Svelte components to package.json');
  const componentNames = fs.readdirSync(distDir);
  const componentExports = {};

  for (const componentName of componentNames) {
    const componentDir = path.join(distDir, componentName);
    if (!fs.existsSync(componentDir) || !fs.lstatSync(componentDir).isDirectory()) {
      continue;
    }
    const componentFiles = fs.readdirSync(componentDir);

    const svelteFiles = componentFiles.filter((file) => file.endsWith('.svelte'));

    for (const svelteFile of svelteFiles) {
      const dtsFile = `${svelteFile}.d.ts`;
      const exportKey = `./${svelteFile}`;

      componentExports[exportKey] = {
        types: `./dist/${componentName}/${dtsFile}`,
        svelte: `./dist/${componentName}/${svelteFile}`,
      };
    }
  }

  const indexDtsPath = path.join(distDir, 'index.d.ts');
  if (fs.existsSync(indexDtsPath) && fs.lstatSync(indexDtsPath).isFile()) {
    componentExports['.'] = {
      types: './dist/index.d.ts',
      svelte: './dist/index.js',
    };
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  packageJson.exports = componentExports;

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};
// end export to package.json

// copy package.json to 
export function copyPackageToDist (outputDirectory = './dist') {
  console.log('Copying package.json to ./dist dir.');
  try {
    // read file into JSON
    const packageJson = fs.readFileSync('package.json', 'utf-8');
    const pkg = JSON.parse(packageJson);

    // write it to your output directory
    const newPackagePath = path.join(outputDirectory, 'package.json');
    fs.writeFileSync(newPackagePath, JSON.stringify(pkg, null, 2));

    console.log(`The package.json file has been updated and written to ${newPackagePath}.`);
  } catch (error) {
    console.error(`An error occurred while processing the package.json file: ${error.message}`);
  }
}

// create props
async function generateComponentData () {
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
    
  const getExports = (fileName, keyword) => {
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

  const extractProps = (arr) => {
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

        // console.log(`Name: ${name}, Type: ${type}, Value: ${value}`);
        // Add the extracted name, type, and value to the result array
        result.push([name, type, value]);
      }
    });

    // Set the 'props' key in the obj to the extracted result array
    obj.props = result;

    return obj;
  }

  // Function to extract slot names from a Svelte file
  const extractSlots = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /<slot name=["']([^"']+)["'][^>]*>/g;
    const slots = [];
    
    let match;
    while ((match = regex.exec(content))) {
      slots.push(match[1]);
    }
    
    return slots;
  }

  const extractEvents = (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const regex = /on:[a-zA-Z_]\w*/g;
    const matches = fileContent.match(regex) || [];
    return matches;
  };

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
    let slotsResult = []; 
    let eventsResult = []; 
    let propsResult = []; 

    // create a file name
    let name = path.parse(myfile).name;
    let outputfile = directory + name + '.json';
    // console.log('name: ', name)
    console.log('file name: ', myfile,)
    slotsResult = extractSlots(myfile);
    // console.log('slotsResult: ', slotsResult);
    // events
    eventsResult = extractEvents(myfile);
    // console.log('events: ', eventsResult);
    // props
    propsResult = extractProps(getExports(myfile, exportLet));
    // console.log('props: ', propsResult)

    const data = {
      slots: slotsResult,
      events: eventsResult,
      props: propsResult,
    }
    writeToFile(outputfile, JSON.stringify(data));
  });
}

if (command === "docs") {
  addCompoDocs(srcDir);
} else if (command === "exports") {
  exportSvelteComponents(distDir, packageJsonPath);
} else if (command === "package") {
  copyPackageToDist(distDir, packageJsonPath);
} else if (command === "compo-data") {
  generateComponentData();
} else {
  console.log("Unknown command. Available commands: docs, exports");
}

