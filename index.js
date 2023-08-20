#!/usr/bin/env node

import { addCompoDocs } from './docs.js';
import { updatePackageJsonExports } from './updatePackage.js'
import { exportSvelteComponents } from './updateComponentExports.js'

const args = process.argv.slice(2);
const command = args[0];

if (command === "docs") {
  addCompoDocs();
} else if (command === "exports") {
  const distDir = './dist';
  const packageJsonPath = './package.json';
  updatePackageJsonExports();
} else if (command === "") {
  const distDir = './dist';
  const packageJsonPath = './package.json';
  exportSvelteComponents();
} else {
  console.log("Unknown command. Available commands: docs, exports");
}
