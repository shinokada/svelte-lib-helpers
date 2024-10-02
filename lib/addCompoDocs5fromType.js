#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { getDocumentationURL } from './getDocumentationURL.js';

// Helper function to split props interface
function splitPropsInterface(propsInterface) {
  const interfaceProps = [];
  const lines = propsInterface.split("\n");
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("//")) {
      const [name, type] = trimmedLine.split(":").map(s => s.trim());
      if (name && type) {
        interfaceProps.push({ name: name.replace("?", ""), type: type.replace(";", "") });
      }
    }
  }
  
  return interfaceProps;
}

// Helper function to extract types from TypeScript file or Svelte file content
function extractTypes(content) {
  console.log(`Extracting types from content`);
  const interfaceMatch = content.match(/interface\s+(?:Props|CheckboxProps)[^{]*{([\s\S]*?)}/);
  if (interfaceMatch) {
    console.log(`Found interface: ${interfaceMatch[0]}`);
    return splitPropsInterface(interfaceMatch[1]);
  } else {
    console.log('No interface match found');
  }
  return [];
}

/**
 * Generates documentation comments for Svelte 5 component props based on extracted information.
 * @param {string} srcDir - The source directory to traverse for Svelte components.
 */
export const addCompoDocs5fromType = (srcDir) => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const documentationURL = getDocumentationURL(packageJsonPath);

  if (!documentationURL) {
    throw new Error('"homepage" value is not specified in package.json');
  }

  const processFile = (filePath) => {
    console.log(`Processing file: ${filePath}`);
    const propComments = [];
    const combinedProps = [];
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Remove previous @component comments and trailing empty lines
    content = content.replace(/<!--\s*@component[\s\S]*?-->\n*/, '').replace(/\s*$/, '');
    
    let tsTypes = [];
    
    // First, try to extract types from the Svelte file itself
    tsTypes = extractTypes(content);
    
    // If no types found in Svelte file, look for a separate TypeScript file
    if (tsTypes.length === 0) {
      const importMatch = content.match(/import\s*{[^}]*}\s*from\s*['"](.*)['"];/);
      if (importMatch) {
        console.log(`Found import: ${importMatch[0]}`);
        let tsFilePath;
        if (importMatch[1] === '.') {
          tsFilePath = path.join(path.dirname(filePath), 'index.ts');
        } else {
          tsFilePath = path.resolve(path.dirname(filePath), importMatch[1] + '.ts');
        }
        console.log(`Looking for TS file: ${tsFilePath}`);
        if (fs.existsSync(tsFilePath)) {
          const tsContent = fs.readFileSync(tsFilePath, 'utf-8');
          tsTypes = extractTypes(tsContent);
        } else {
          console.log('TS file not found');
        }
      } else {
        console.log('No import match found');
      }
    }
    
    console.log(`Extracted types: ${JSON.stringify(tsTypes)}`);
    
    // Extract destructured props
    const propLines = content.match(/let\s*{([^}]*)}\s*:\s*Props\s*=\s*\$props\(\);/);
    
    if (propLines) {
      console.log(`Found prop lines: ${propLines[0]}`);
      const propsExtract = propLines[1].replace(/\/\/.*$/gm, '');
      
      for (const line of propsExtract.split(",")) {
        const [namePart, defaultValue] = line.split("=").map(s => s.trim());
        const name = namePart.split(":")[0].trim(); // Handle cases like "class: className"
        if (name && !name.includes('...')) {  // Ignore spread operator
          const tsType = tsTypes.find(t => t.name === name);
          const type = tsType ? tsType.type : 'any';
          console.log(`Prop: ${name}, Type: ${type}, Default: ${defaultValue}`);
          combinedProps.push(`${name}: ${type}${defaultValue ? ` = ${defaultValue}` : ''};`);
        }
      }
    } else {
      console.log('No prop lines found');
    }
  
    const combinedPropsText = combinedProps.join("\n@props:");
    content = `${content}\n\n<!--\n@component\n[Go to docs](${documentationURL})\n## Props\n@props: ${combinedPropsText}\n-->\n`;
    fs.writeFileSync(filePath, content, 'utf-8');
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

  console.log("Generating documentation for svelte 5 interface Prop ...");
  traverseDirectory(srcDir);
  console.log("All done!");
};