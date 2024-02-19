import * as fs from 'fs';
import path from 'path';

// copy package.json to 
export function copyPackageToDist (outputDirectory = './dist') {
  console.log('Copying package.json to ./dist dir.');
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