#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';

const srcDir = './src/lib';
export const exportSvelteComponents = (dir, packageJsonPath) => {
  console.log('Adding Svelte components to package.json');

  const customEntry = {
    '.': {
      types: './dist/index.d.ts',
      svelte: './dist/index.js',
    },
  };
  
  // Add types export if the source file exists
  const typesExport = {};
  const srcTypesPath = './src/lib/types.ts';
  
  if (fs.existsSync(srcTypesPath)) {
    typesExport['./types'] = {
      types: './dist/types.d.ts',
      import: './dist/types.js',
      default: './dist/types.js'
    };
  }
  
  const appendCustomEntry = {
    "./package.json": "./package.json"
  }
  const componentExports = {};

  const processDirectory = (srcDir, relativePath = '') => {
    const componentNames = fs.readdirSync(srcDir);

    for (const componentName of componentNames) {
      const componentPath = path.join(srcDir, componentName);
      const stat = fs.lstatSync(componentPath);

      if (stat.isDirectory()) {
        const componentRelativePath = path.join(relativePath, componentName);
        processDirectory(componentPath, componentRelativePath);
      } else if (stat.isFile() && componentName.endsWith('.svelte')) {
        const dtsFile = `${componentName}.d.ts`;
        const exportKey = `./${path.basename(componentName)}`;

        componentExports[exportKey] = {
          types: `./dist/${path.join(relativePath, dtsFile)}`,
          svelte: `./dist/${path.join(relativePath, componentName)}`,
        };
      }
    }
  };

  processDirectory(srcDir);

  // Read the existing package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

  // Remove the old "exports" field if it exists
  delete packageJson.exports;

  // Merge all exports in the desired order
  packageJson.exports = { 
    ...customEntry, 
    ...typesExport, 
    ...componentExports, 
    ...appendCustomEntry 
  };

  // Write the updated package.json back to the file
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
};