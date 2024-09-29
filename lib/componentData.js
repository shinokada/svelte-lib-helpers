#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function componentData() {
  const defaultSrc = './src/lib';
  const defaultDest = './src/routes/component-data/';

  // Create the defaultDest directory if it doesn't exist
  try {
    await fs.promises.mkdir(defaultDest, { recursive: true });
    console.log('The src/routes/component-data/ directory created successfully!');
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

  const fileContains$$Props = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('$$Props');
  };

  const extractPropsFromInterface = (fileName) => {
    const file = fs.readFileSync(fileName, { encoding: 'utf-8' });
    const interfaceRegex = /interface\s+\$\$Props[^{]*{([^}]*)}/;
    const match = file.match(interfaceRegex);
    
    if (!match) return [];

    const interfaceContent = match[1];
    const propLines = interfaceContent.split('\n').map(line => line.trim()).filter(line => line);

    return propLines.map(line => {
      const [name, type] = line.split(':').map(part => part.trim());
      return [name, type.replace(';', '')];
    });
  };

  const extractPropsFromExports = (fileName) => {
    const file = fs.readFileSync(fileName, { encoding: 'utf-8' });
    const exportRegex = /export\s+let\s+(\w+):\s+\$\$Props\['(\w+)'\]\s*=\s*([^;]+);/g;
    const props = [];
    let match;

    while ((match = exportRegex.exec(file)) !== null) {
      props.push([match[1], match[2], match[3].trim()]);
    }

    return props;
  };

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
  };

  // extract all events that do not have = sign
  const extractEvents = (filePath) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const regex = /on:([a-zA-Z_]\w*)(?=(\s|$|>))(?![^{]*\})/g;
    const matches = fileContent.match(regex) || [];
    return matches.map(event => event.replace('on:', ''));
  };

  const writeToFile = (fileName, data) => {
    fs.writeFile(fileName, JSON.stringify(data, null, 2), (err) => {
      if (err) throw err;
      console.log('The file has been saved!', fileName);
    });
  };

  const processFile = async (filePath) => {
    if (!fileContains$$Props(filePath)) {
      console.log(`Skipping ${filePath} - does not contain $$Props`);
      return;
    }

    const name = path.parse(filePath).name;
    const outputFile = path.join(directory, `${name}.json`);

    const interfaceProps = extractPropsFromInterface(filePath);
    const exportedProps = extractPropsFromExports(filePath);
    const slots = extractSlots(filePath);
    const events = extractEvents(filePath);

    const props = interfaceProps.map(([propName, propType]) => {
      const exportedProp = exportedProps.find(([name]) => name === propName.replace('?', ''));
      return exportedProp ? [propName, propType, exportedProp[2]] : [propName, propType, ''];
    });

    const data = {
      name,
      slots,
      events,
      props,
    };

    writeToFile(outputFile, data);
    console.log(`Processed ${filePath}`);
  };

  const processDirectory = async (dirPath) => {
    const entries = await readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dirPath, entry.name);

      if (entry.isDirectory()) {
        await processDirectory(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.svelte')) {
        await processFile(fullPath);
      }
    }
  };

  await processDirectory(srcLib);
}
