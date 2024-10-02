import * as fs from 'fs';
import path from 'path';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

export async function componentDataRunes2() {
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

  const splitPropsInterface = (propsInterface) => {
    const interfaceProps = {};
    const lines = propsInterface.split("\n");
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith("//")) {
        const [name, type] = trimmedLine.split(":").map(s => s.trim());
        if (name && type) {
          interfaceProps[name.replace("?", "")] = type.replace(";", "");
        }
      }
    }
    
    return interfaceProps;
  };

  const extractPropsFromFile = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const combinedProps = {};

    // Extract Props interface, including extends
    const interfaceMatch = content.match(/interface\s+Props(?:\s+extends\s+[^{]+)?\s*{([\s\S]*?)}/);
    
    if (interfaceMatch) {
      const propsInterface = interfaceMatch[1].trim();
      Object.assign(combinedProps, splitPropsInterface(propsInterface));
    }

    // Extract destructured props
    const propLines = content.match(/let\s*{([^}]*)}\s*:\s*Props\s*=\s*\$props\(\);/);
    
    if (propLines) {
      const propsExtract = propLines[1].replace(/\/\/.*$/gm, '');
      
      for (const line of propsExtract.split(",")) {
        const [name, defaultValue] = line.split("=").map(s => s.trim());
        if (name && !name.includes('...')) {  // Ignore spread operator
          const propName = name.split(':')[0].trim();  // Handle renamed props
          if (!(propName in combinedProps)) {
            combinedProps[propName] = 'any';
          }
          if (defaultValue) {
            combinedProps[propName] += ` = ${defaultValue}`;
          }
        }
      }
    }

    return combinedProps;
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

    const propsWithTypes = extractPropsFromFile(filePath);
    const slots = extractSlots(filePath);
    const events = extractEvents(filePath);

    const props = Object.entries(propsWithTypes).map(([propName, typeAndDefault]) => {
      const [type, defaultValue] = typeAndDefault.split('=').map(s => s.trim());
      return [propName, type, defaultValue || ''];
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