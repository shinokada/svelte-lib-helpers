#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { getDocumentationURL } from './getDocumentationURL.js';

export const compoDocsFromProp = (srcDir) => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const documentationURL = getDocumentationURL(packageJsonPath);

  if (!documentationURL) {
    throw new Error('"homepage" value is not specified in package.json');
  }

  const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove previous @component comments and trailing empty lines
    content = content.replace(/<!--\s*@component[\s\S]*?-->\n*/, '').replace(/\s*$/, '');

    // Find the $$Props interface
    const propsInterfaceMatch = content.match(/interface\s+\$\$Props[^{]*{([^}]*)}/);
    let propsMap = {};

    if (propsInterfaceMatch) {
      const propsContent = propsInterfaceMatch[1];
      const propLines = propsContent.split('\n');

      propLines.forEach(line => {
        const match = line.match(/(\w+)\??:\s*([^;]+)/);
        if (match) {
          propsMap[match[1]] = match[2].trim();
        }
      });
    }

    // Find all lines starting with 'export let' and create @prop comments
    const propLines = content.match(/export let [\s\S]*?;/g);
    if (propLines) {
      const propComment = propLines.map(line => {
        const match = line.match(/export let (\w+):\s*([^=]+)(?:=\s*(.+))?/);
        if (match) {
          const propName = match[1];
          let propType = match[2].trim();
          let defaultValue = match[3] ? match[3].trim().replace(/;$/, '') : undefined;

          // If the type is $$Props['propname'], replace it with the actual type from propsMap
          if (propType.startsWith("$$Props[")) {
            propType = propsMap[propName] || propType;
          }

          // Handle NonNullable case
          if (propType.startsWith("NonNullable<$$Props[")) {
            propType = propsMap[propName] || propType;
            // Special case for 'size' prop
            if (propName === 'size') {
              propType = "'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'none'";
            }
          }

          // Construct the prop string with type and default value
          let propString = `@prop export let ${propName}: ${propType}`;
          if (defaultValue !== undefined) {
            propString += ` = ${defaultValue}`;
          }

          return propString;
        }
        return line.trim();
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
  traverseDirectory(srcDir);
  console.log("All done!");
};