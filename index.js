#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const srcDir = './src/lib'
const distDir = './dist';
const packageJsonPath = './package.json';

const args = process.argv.slice(2);
const command = args[0];

// add component docs
const addCompoDocs = (srcDir) => {
  // const srcDir = path.join(__dirname, 'src', 'lib');

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

      content = `${content}\n\n<!--\n@component\n[Go to Popover](https://flowbite-svelte.com/)\n## Props\n${propComment}\n-->\n`;

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
      console.log('Completed: ',item)
    }
  };
  console.log("Generating documentation...");
  traverseDirectory(srcDir);
  console.log("All done!");
};
// end of component docs

// add export to package.json
export const exportSvelteComponents = (distDir, packageJsonPath) => {
  console.log('Adding Svelte components to package.json')
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
}
// end export to package.json

// copy package.json to 
export function copyPackageToDist (outputDirectory = './dist') {
  console.log('Copying package.json to ./dist dir.')
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

if (command === "docs") {
  addCompoDocs(srcDir);
} else if (command === "exports") {
  exportSvelteComponents(distDir, packageJsonPath);
} else if (command === "package") {
  copyPackageToDist(distDir, packageJsonPath);
} else {
  console.log("Unknown command. Available commands: docs, exports");
}

