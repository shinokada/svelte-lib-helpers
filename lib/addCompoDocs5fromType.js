#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { getDocumentationURL } from './getDocumentationURL.js';

// function splitPropsInterface (propsInterface) {
//   const interfaceProps = [];
//   for (const line of propsInterface.split("\n")) {
//     // Skip empty lines and comments
//     if (!line.trim() || line.startsWith("//")) continue;

//     const [name, typeStr] = line.trim().split(":");

//     interfaceProps.push({ name, type: typeStr.trim() });
//   }
//   return interfaceProps;
// }

function splitPropsInterface(propsInterface) {
  const interfaceProps = [];

  for (const line of propsInterface.split("\n").filter(Boolean)) {
    // Skip empty lines and comments
    if (!line.trim() || line.startsWith("//")) continue;

    // Check for missing colon and handle accordingly
    if (!line.includes(":")) {
      console.warn(`Warning: Line '${line}' does not contain a colon (':'). Skipping.`);
      continue;
    }

    const [name, typeStr] = line.trim().split(":");

    interfaceProps.push({ name, type: typeStr.trim() });
  }

  return interfaceProps;
}

export const addCompoDocs5fromType = (srcDir) => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const documentationURL = getDocumentationURL(packageJsonPath);

  if (!documentationURL) {
    throw new Error('"homepage" value is not specified in package.json');
  }
  const processFile = (filePath) => {
    const propComments = [];
    const combinedProps = [];
    // console.log('Processing file:', filePath);
    let content = fs.readFileSync(filePath, 'utf-8');
    // Remove previous @component comments and trailing empty lines
    content = content.replace(/<!--\s*@component[\s\S]*?-->\n*/, '').replace(/\s*$/, '');

    // Extract Props interface and destructured props
    const interfaceMatch = content.match(/interface\s+Props\s*{([^}]*)}/);
    const propLines = content.match(/let {[\s\S]*?} = \$props<\w+>\(\);/);

    if (propLines) {
      const propsExtract = propLines[0].match(/\{([\s\S]*?)\}/)[1].replace(/\/\/.*$/gm, ''); // extract content within curly braces and remove comments

      for (const line of propsExtract.split("\n")) {
        // Skip empty lines and comments
        if (!line.trim() || line.startsWith("//")) continue;

        if (line.includes('=')) {
          const [name, defaultStr] = line.trim().split('=');
          const trimmedName = name.trim();
          // Remove quotes, inner comma, and whitespace:
          const trimmedDefault = defaultStr
            .replace(/^['"]|['"]$/g, '') // Remove leading/trailing quotes
            .replace(/,\s*$/g, '') // Remove trailing comma and whitespace
            .trim(); // Remove extra whitespace

          propComments.push({ name: trimmedName, default: trimmedDefault });
        }
      }
      // console.log('propComments', propComments);
    }
    if (interfaceMatch) {
      const propsInterface = interfaceMatch[1].trim();
      // console.log('propsInterface', propsInterface)
      const interfaceProps = splitPropsInterface(propsInterface);
      // console.log('interfaceProps', interfaceProps)
      for (const prop of interfaceProps) {
        combinedProps.push(`${prop.name}: ${prop.type}`);
      }
    }
    // console.log('propComments', propComments);
    // console.log('combinedProps', combinedProps);
    const commentsMap = new Map(propComments.map(pc => [pc.name, pc.default]));
    // console.log('commentsMap', commentsMap);
    combinedProps.forEach((cp, idx) => {
      const [propName, type] = cp.split(':');
      const cleanPropName = propName.replace(/\?$/, ''); 
      const defaultValue = commentsMap.get(cleanPropName);
      // console.log('propName', cleanPropName);
      // console.log('defaultValue', defaultValue);
      // Check if a default value exists and update the combinedProp
      if (defaultValue) {
        const updatedProp = `${propName}: ${type} = ${defaultValue};`;
        combinedProps[idx] = updatedProp;
      }
    });

    // console.log('Updated combinedProps', combinedProps);
    const combinedPropsText = combinedProps.join("\n@props:");
      content = `${content}\n\n<!--\n@component\n[Go to docs](${documentationURL})\n## Props\n@props: ${combinedPropsText}\n-->\n`;
      fs.writeFileSync(filePath, content, 'utf-8');
  };


  const traverseDirectory = (dirPath) => {
    // console.log('traversing directory: ', dirPath);
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