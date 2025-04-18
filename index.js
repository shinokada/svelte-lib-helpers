#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { lstat, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { addCompoDocs } from './lib/addCompoDocs.js';
import { generateComponentData } from './lib/generateComponentData.js';
import { generateRunesComponentData } from './lib/generateRunesComponentData.js';
import { copyPackageToDist } from './lib/copyPackageToDist.js';
import { copyTsconfigToDist } from './lib/copyTsconfigToDist.js';
import { exportSvelteComponents } from './lib/exportSvelteComponents.js';
import { addCompoDocs5 } from './lib/addCompoDocs5.js';
import { removeDocs } from './lib/removeDocs.js';
import { addCompoDocs5fromType } from './lib/compoDocs5fromType.js';
import { addCompoDocs5fromType2 } from './lib/compoDocs5fromType2.js';
import { addCompoDocsPropValue } from './lib/addCompoDocsPropValue.js'
import { componentData } from './lib/componentData.js';
import { componentData5FromType } from './lib/componentData5FromType.js';
import { componentDataRunes } from './lib/componentDataRunes.js';
import { compoDocsFromProp } from './lib/compoDocsFromProp.js';
import { componentDataPropValue } from './lib/componentDataPropValue.js';

const srcDir = './src/lib';
const distDir = './dist';
const packageJsonPath = './package.json';
const tsconfigPath = './tsconfig.json'

const args = process.argv.slice(2);
const command = args[0];


if (command === "docs") {
  addCompoDocs(srcDir);
} else if (command === "docsFromProps") {
  compoDocsFromProp(srcDir);
} else if (command === "removeDocs") {
  removeDocs(srcDir);
} else if (command === "docs5") {
  addCompoDocs5(srcDir);
} else if (command === "docspropvalue") {
  const githubLink = args[1]; // Get the second argument
  addCompoDocsPropValue(srcDir, githubLink)
} else if (command === "docs5FromType") {
  addCompoDocs5fromType(srcDir);
} else if (command === "exports") {
  exportSvelteComponents(distDir, packageJsonPath);
} else if (command === "package") {
  copyPackageToDist(distDir, packageJsonPath);
} else if (command === "ts") {
  copyTsconfigToDist(distDir, tsconfigPath);
} else if (command === "compo-data") {
  generateComponentData();
} else if (command === "component-data") {
  componentData();
} else if (command === "component-data-prop-value") {
  const githubLink = args[1]; // Get the second argument
  componentDataPropValue(srcDir, githubLink);
} else if (command === "component-data-from-type") {
  componentData5FromType(srcDir);
} else if (command === "addCompoDocs5fromType2") {
  addCompoDocs5fromType2(srcDir);
} else if (command === "runes-data") {
  generateRunesComponentData();
} else if (command === "generate-runes-data") {
  generateRunesComponentData()
} else if (command === "component-data-runes") {
  componentDataRunes();
} else {
  console.log("Unknown command. Available commands: docs, exports");
}

