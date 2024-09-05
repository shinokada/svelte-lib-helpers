#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { addCompoDocs } from './lib/addCompoDocs.js';
import { generateComponentData } from './lib/generateComponentData.js';
import { generateRunesComponentData } from './lib/generateRunesComponentData.js';
import { copyPackageToDist } from './lib/copyPackageToDist.js';
import { exportSvelteComponents } from './lib/exportSvelteComponents.js';
import { addCompoDocs5 } from './lib/addCompoDocs5.js';
import { removeDocs } from './lib/removeDocs.js';
import { addCompoDocs5fromType } from './lib/addCompoDocs5fromType.js';

const srcDir = './src/lib';
const distDir = './dist';
const packageJsonPath = './package.json';

const args = process.argv.slice(2);
const command = args[0];


if (command === "docs") {
  addCompoDocs(srcDir);
} else if (command === "removeDocs") {
  removeDocs(srcDir);
} else if (command === "docs5") {
  addCompoDocs5(srcDir);
} else if (command === "docs5FromType") {
  addCompoDocs5fromType(srcDir);
} else if (command === "exports") {
  exportSvelteComponents(distDir, packageJsonPath);
} else if (command === "package") {
  copyPackageToDist(distDir, packageJsonPath);
} else if (command === "compo-data") {
  generateComponentData();
} else if (command === "runes-data") {
  generateRunesComponentData();
} else {
  console.log("Unknown command. Available commands: docs, exports");
}

