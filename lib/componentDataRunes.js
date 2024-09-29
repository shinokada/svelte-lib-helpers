#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function componentDataRunes() {
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
  let destValue = destIndex > -1 ? process.argv[destIndex + 1] : defaultDest;

  // Checks for --src and if it has a value
  const srcIndex = process.argv.indexOf('--src');
  let srcValue = srcIndex > -1 ? process.argv[srcIndex + 1] : defaultSrc;

  const extractPropsFromSvelte = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const propsRegex = /let\s*{([^}]+)}\s*:\s*Props\s*=\s*\$props\(\);/;
    const match = content.match(propsRegex);
    
    if (!match) return [];

    const propsContent = match[1];
    const propLines = propsContent.split(',').map(line => line.trim());

    return propLines.map(line => {
      if (line.includes(':')) {
        // Handle renamed props like 'class: className'
        const [fullName, defaultValue] = line.split('=').map(part => part.trim());
        const [originalName, newName] = fullName.split(':').map(part => part.trim());
        return [newName || originalName, defaultValue || ''];
      } else if (line.startsWith('...')) {
        // Ignore rest props
        return null;
      } else {
        const [name, defaultValue] = line.split('=').map(part => part.trim());
        return [name, defaultValue || ''];
      }
    }).filter(prop => prop !== null);
  };

  const extractPropsFromInterface = (filePath) => {
    const dir = path.dirname(filePath);
    const indexPath = path.join(dir, 'index.ts');
    
    if (!fs.existsSync(indexPath)) {
      console.log(`Index file not found for ${filePath}`);
      return {};
    }

    const content = fs.readFileSync(indexPath, 'utf8');
    const interfaceRegex = /interface\s+\w+Props[^{]*{([^}]*)}/s;
    const match = content.match(interfaceRegex);
    
    if (!match) return {};

    const interfaceContent = match[1];
    const propLines = interfaceContent.split('\n').map(line => line.trim()).filter(line => line);

    const propTypes = {};
    propLines.forEach(line => {
      const [name, type] = line.split(':').map(part => part.trim());
      propTypes[name.replace('?', '')] = type.replace(';', '');
    });

    return propTypes;
  };

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

  const extractEvents = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const regex = /on:([a-zA-Z_]\w*)(?=(\s|$|>))(?![^{]*\})/g;
    const matches = content.match(regex) || [];
    return matches.map(event => event.replace('on:', ''));
  };

  const writeToFile = (fileName, data) => {
    fs.writeFile(fileName, JSON.stringify(data, null, 2), (err) => {
      if (err) throw err;
      console.log('The file has been saved!', fileName);
    });
  };

  const processFile = async (filePath) => {
    const name = path.parse(filePath).name;
    const outputFile = path.join(destValue, `${name}.json`);

    const svelteProps = extractPropsFromSvelte(filePath);
    const interfaceProps = extractPropsFromInterface(filePath);
    const slots = extractSlots(filePath);
    const events = extractEvents(filePath);

    const props = svelteProps.map(([propName, defaultValue]) => {
      let type = interfaceProps[propName] || '';
      
      // Handle complex types
      if (type.includes('{')) {
        type = 'object';
      } else if (type.includes('[]')) {
        type = 'array';
      }
      
      return [propName, type, defaultValue];
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

  await processDirectory(srcValue);
}