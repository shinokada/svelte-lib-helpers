#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { getDocumentationURL } from './getDocumentationURL.js';

export const addCompoDocs5 = (srcDir) => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const documentationURL = getDocumentationURL(packageJsonPath);

  if (!documentationURL) {
    throw new Error('"homepage" value is not specified in package.json');
  }

  const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove previous @component comments and trailing empty lines
    content = content.replace(/<!--\s*@component[\s\S]*?-->\n*/, '').replace(/\s*$/, '');

    // Find all lines starting with 'let {' and create @prop comments
    const propLines = content.match(/let {[\s\S]*?} = \$props<\w+>\(\);/);
    if (propLines) {
      const propsExtract = propLines[0].match(/\{([\s\S]*?)\}/)[1].replace(/\/\/.*$/gm, ''); // extract content within curly braces and remove comments
      const propComment = propsExtract.split(',').map(prop => {
        return `@prop ${prop.trim()}`;
      }).join(',\n');

      content = `${content}\n\n<!--\n@component\n[Go to docs](${documentationURL})\n## Props\n${propComment}\n-->\n`;

      fs.writeFileSync(filePath, content, 'utf-8');
    }
  };


  const traverseDirectory = (dirPath) => {
    console.log('traversing directory: ', dirPath);
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

  console.log("Generating documentation for svelte 5 ...");
  traverseDirectory(srcDir);
  console.log("All done!");
};

