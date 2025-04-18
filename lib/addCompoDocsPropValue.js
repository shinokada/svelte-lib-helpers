#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { getDocumentationURL } from './getDocumentationURL.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const addCompoDocsPropValue = (srcDir, githubLink) => {
  // Validate required arguments
  if (!githubLink) {
    throw new Error('GitHub organization name is required. Usage: addCompoDocs5(srcDir, "organizationName")');
  }

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const documentationURL = getDocumentationURL(packageJsonPath);

  if (!documentationURL) {
    throw new Error('"homepage" value is not specified in package.json');
  }

  // Read types.ts file and cache it
  const typesPath = path.join(srcDir, 'types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  const typesLines = typesContent.split('\n');
  
  // Get repository name from package.json
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  
  // Build GitHub URL base with provided organization name
  const githubBaseUrl = `https://github.com/${githubLink}`;
  
  // Function to find line number of a type in types.ts
  const findTypeLineNumber = (typeName) => {
    // Look for type/interface definition patterns
    const patterns = [
      new RegExp(`^\\s*export\\s+(?:type|interface)\\s+${typeName}\\b`),
      new RegExp(`^\\s*export\\s+(?:type|interface)\\s+${typeName}\\s*=`),
      new RegExp(`^\\s*(?:type|interface)\\s+${typeName}\\b`)
    ];
    
    for (let i = 0; i < typesLines.length; i++) {
      const line = typesLines[i];
      if (patterns.some(pattern => pattern.test(line))) {
        return i + 1; // Line numbers are 1-based
      }
    }
    return null; // Type not found
  };

  const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove previous @component comments and trailing empty lines
    content = content.replace(/<!--\s*@component[\s\S]*?-->\n*/, '').replace(/\s*$/, '');

    // Match the props declaration line with improved regex
    const propMatch = content.match(/let\s+\{([^}]*)\}:\s+(\w+(?:Props(?:Type)?)?(?:\s*\|\s*\w+(?:Props(?:Type)?)?)*)?\s*=\s*\$props\(\)/);
    
    if (propMatch) {
      // Extract props content and type name
      const propsExtract = propMatch[1].replace(/\/\/.*$/gm, '');
      const typeName = propMatch[2]; // Extract the full type name directly
      
      // Find the line number in types.ts
      const typeLineNumber = findTypeLineNumber(typeName);
      
      // Parse props carefully to extract name and default value
      const propEntries = [];
      
      // Split by commas but respect equals signs in default values
      const propsParts = [];
      let currentPart = '';
      let inString = false;
      let stringChar = '';
      let braceCount = 0;
      
      for (let i = 0; i < propsExtract.length; i++) {
        const char = propsExtract[i];
        
        // Track string boundaries
        if ((char === '"' || char === "'" || char === '`') && propsExtract[i-1] !== '\\') {
          if (!inString) {
            inString = true;
            stringChar = char;
          } else if (char === stringChar) {
            inString = false;
          }
        }
        
        // Track object/array boundaries
        if (char === '{' || char === '[') braceCount++;
        if (char === '}' || char === ']') braceCount--;
        
        // Split by comma only when not in a string or nested structure
        if (char === ',' && !inString && braceCount === 0) {
          propsParts.push(currentPart.trim());
          currentPart = '';
        } else {
          currentPart += char;
        }
      }
      
      // Don't forget the last part
      if (currentPart.trim()) {
        propsParts.push(currentPart.trim());
      }
      
      // Process each prop part
      propsParts.forEach(part => {
        const trimmedPart = part.trim();
        if (!trimmedPart) return;
        
        // Check if the prop has a default value
        if (trimmedPart.includes('=')) {
          const [name, defaultValue] = trimmedPart.split(/\s*=\s*/, 2);
          propEntries.push({
            name: name.trim(),
            defaultValue: defaultValue.trim()
          });
        } else {
          // Handles destructured props without default values
          propEntries.push({
            name: trimmedPart.trim(),
            defaultValue: ''
          });
        }
      });
      
      // Format the prop comments
      const propComment = propEntries.map(({ name, defaultValue }) => {
        if (defaultValue) {
          return `@prop ${name} = ${defaultValue}`;
        }
        return `@prop ${name}`;
      }).join('\n');

      // Generate the type information section with link if line number was found
      let typeSection = '';
      if (typeName) {
        typeSection = `\n## Type\n${typeName}`;
        if (typeLineNumber) {
          // Use the GitHub URL format with the provided organization
          const githubTypeUrl = `${githubBaseUrl}/blob/main/src/lib/types.ts#L${typeLineNumber}`;
          typeSection = `\n## Type\n[${typeName}](${githubTypeUrl})`;
        }
      }

      content = `${content}\n\n<!--\n@component\n[Go to docs](${documentationURL})${typeSection}\n## Props\n${propComment}\n-->\n`;

      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Processed: ${filePath}`);
    }
  };

  const traverseDirectory = (dirPath) => {
    console.log('traversing directory: ', dirPath);
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        traverseDirectory(itemPath); // Recurse into subdirectories
      } else if (stat.isFile() && item.endsWith('.svelte')) {
        processFile(itemPath); // Process files
      }
    }
    console.log(`Completed directory: ${dirPath}`);
  };

  console.log("Generating documentation for svelte 5 ...");
  traverseDirectory(srcDir);
  console.log("All done!");
};

// ES modules pattern to check if file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error('Error: Missing required arguments');
    console.error('Usage: node script.js <sourceDirectory> <githubOrganization>');
    console.error('Example: node script.js src/lib themesberg');
    process.exit(1);
  }
  
  const srcDir = args[0];
  const githubLink = args[1];
  
  try {
    addCompoDocsPropValue(srcDir, githubLink);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}