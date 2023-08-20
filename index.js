#!/usr/bin/env node

import fs from 'fs';
import path from 'path';


const addCompoDocs = () => {
  const srcDir = path.join(__dirname, 'src', 'lib');

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


const exportSvelteComponents = (distDir, packageJsonPath) => {
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


const updatePackageJsonExports = (distDir, packageJsonPath) => {
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


const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

if (command === "docs") {
  addCompoDocs();
} else if (command === "exports") {
  const distDir = './dist';
  const packageJsonPath = './package.json';
  updatePackageJsonExports();
} else if (command === "package") {
  const distDir = './dist';
  const packageJsonPath = './package.json';
  exportSvelteComponents();
} else {
  console.log("Unknown command. Available commands: docs, exports");
}

