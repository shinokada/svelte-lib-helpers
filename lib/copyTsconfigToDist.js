import * as fs from 'fs';
import path from 'path';
import * as jsoncParser from 'jsonc-parser'; // You'll need to install this package

// copy tsconfig.json to dist
export function copyTsconfigToDist(outputDirectory = './dist') {
  console.log('Copying tsconfig.json to ./dist dir.');
  try {
    // read file
    const tsconfigJsonc = fs.readFileSync('tsconfig.json', 'utf-8');
    
    // Parse with jsonc-parser to handle comments
    const tsconfig = jsoncParser.parse(tsconfigJsonc);

    // write it to your output directory
    const newTsconfigPath = path.join(outputDirectory, 'tsconfig.json');
    fs.writeFileSync(newTsconfigPath, JSON.stringify(tsconfig, null, 2));

    console.log(`The tsconfig.json file has been updated and written to ${newTsconfigPath}.`);
  } catch (error) {
    console.error(`An error occurred while processing the tsconfig.json file: ${error.message}`);
  }
}