#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Updated to handle srcDir parameter as shown in your index.js example
export async function componentDataPropValue(srcDir, githubLink) {
  // Validate required argument
  if (!githubLink) {
    throw new Error('GitHub link is required. Usage: componentDataPropValue(srcDir, "organization/repo")');
  }

  const defaultSrc = srcDir || './src/lib';
  const defaultDest = './src/routes/component-data/';
  // Ensure correct GitHub base URL format
  const githubBaseUrl = `https://github.com/${githubLink}`;

  // Create the defaultDest directory if it doesn't exist
  try {
    await fs.promises.mkdir(defaultDest, { recursive: true });
    console.log('The src/routes/component-data/ directory created successfully!');
  } catch (err) {
    console.error(err);
  }

  // Checks for --dest (destination) and if it has a value
  const destIndex = process.argv.indexOf('--dest');
  let destValue;

  if (destIndex > -1) {
    // Retrieve the value after --dest
    destValue = process.argv[destIndex + 1];
  }

  // set destination directory
  const directory = destValue || defaultDest;

  // Checks for --src and if it has a value
  const srcIndex = process.argv.indexOf('--src');
  let srcValue;

  if (srcIndex > -1) {
    // Retrieve the value after --src
    srcValue = process.argv[srcIndex + 1];
  }

  // set lib directory value
  const srcLib = srcValue || defaultSrc;

  // Read types.ts file and cache it - safely handle the case when types.ts doesn't exist
  const typesPath = path.join(srcLib, 'types.ts');
  const typesContent = fs.existsSync(typesPath) ? fs.readFileSync(typesPath, 'utf-8') : '';
  const typesLines = typesContent.split('\n');
  
  // Function to find line number of a type in types.ts
  const findTypeLineNumber = (typeName) => {
    if (!typeName || !typesContent) return null;
    
    // Extract base type name (before any generics)
    const baseTypeName = typeName.split('<')[0];
    
    // Look for type/interface definition patterns
    const patterns = [
      new RegExp(`^\\s*export\\s+(?:type|interface)\\s+${baseTypeName}\\b`),
      new RegExp(`^\\s*export\\s+(?:type|interface)\\s+${baseTypeName}\\s*=`),
      new RegExp(`^\\s*(?:type|interface)\\s+${baseTypeName}\\b`)
    ];
    
    for (let i = 0; i < typesLines.length; i++) {
      const line = typesLines[i];
      if (patterns.some(pattern => pattern.test(line))) {
        return i + 1; // Line numbers are 1-based
      }
    }
    return null; // Type not found
  };

  // Extract imports from the file content
  const extractImports = (content) => {
    const imports = {};
    // Improved regex to handle different import formats
    const importRegex = /import\s+(?:type\s+)?(?:{([^}]+)}|([^\s;]+))\s+from\s+["']([^"']+)["'];?/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const namedImports = match[1]?.trim();
      const defaultImport = match[2]?.trim();
      const sourcePath = match[3];
      
      if (namedImports) {
        // Handle named imports like: import { HTMLAttributes } from 'svelte/elements'
        namedImports.split(',').forEach(item => {
          const parts = item.trim().split(/\s+as\s+/);
          const originalName = parts[0].trim();
          const alias = parts.length > 1 ? parts[1].trim() : originalName;
          imports[alias] = { name: originalName, source: sourcePath };
        });
      }
      
      if (defaultImport) {
        // Handle default imports
        imports[defaultImport] = { name: 'default', source: sourcePath };
      }
    }
    
    return imports;
  };

  // Function to check if file uses Svelte 5 props syntax
  const fileContainsProps = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    return content.includes('$props()') || content.includes('$props<');
  };

  // Extract props from Svelte 5 syntax with handling for both internal and external types
  const extractProps = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract import information first
    const imports = extractImports(content);
    
    // Enhanced regex to handle different props formats
    const propPatterns = [
      // Match standard format: let { props }: Type = $props()
      /let\s+\{([^}]*)\}\s*:\s*([^=]+?)(?:\s*=\s*\$props\(\)|\s*=\s*\$props<([^>]+)>\(\))/,
      // Match alternative formats with more whitespace or different arrangements
      /let\s+\{([^}]*)\}\s*:\s*([^=;]+)[\s\n]*=[\s\n]*\$props\(\)/,
      // Try to specifically match the HTMLAttributes pattern
      /let\s+\{([^}]*)\}\s*:\s*([^=<]+)<([^>]+)>\s*=\s*\$props\(\)/
    ];
    
    let propMatch = null;
    let matchedPattern = null;
    
    for (let i = 0; i < propPatterns.length; i++) {
      propMatch = content.match(propPatterns[i]);
      if (propMatch) {
        matchedPattern = i + 1;
        break;
      }
    }
    
    if (!propMatch) {
      return { typeName: null, props: [], isExternalType: false, sourceModule: null };
    }
    
    // Extract props content and type name
    const propsExtract = propMatch[1].replace(/\/\/.*$/gm, '');
    let typeName = propMatch[2]?.trim(); // Extract the full type name
    
    // Handle generic syntax like HTMLAttributes<HTMLDivElement>
    if (typeName) {
      typeName = typeName.replace(/\s+/g, ''); // Remove whitespace
    }
    
    // Check if there's a type parameter in $props<Type>() or as third capture group
    const genericType = propMatch[3]?.trim();
    if (genericType && matchedPattern === 3) {
      // If we matched pattern 3, reconstruct the full generic type
      typeName = `${typeName}<${genericType}>`;
    } else if (genericType && matchedPattern === 1) {
      // If a generic type is present in $props<Type>(), use that
      typeName = genericType;
    }
    
    // Determine if the type is external by checking imports
    let isExternalType = false;
    let sourceModule = null;
    
    if (typeName) {
      // Extract base type name (before any generics)
      const baseTypeName = typeName.split('<')[0];
      
      // Check if this type is imported
      if (imports[baseTypeName]) {
        isExternalType = true;
        sourceModule = imports[baseTypeName].source;
      }
    }
    
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
      
      // Handle ...restProps pattern
      if (trimmedPart.startsWith('...')) {
        // Skip rest props
        return;
      }
      
      // Check if the prop has a default value
      if (trimmedPart.includes('=')) {
        const [name, defaultValue] = trimmedPart.split(/\s*=\s*/, 2);
        propEntries.push([name.trim(), defaultValue.trim()]);
      } else {
        // Handles props without default values
        propEntries.push([trimmedPart.trim(), ""]);
      }
    });
    
    return { typeName, props: propEntries, isExternalType, sourceModule };
  };

  const writeToFile = (fileName, data) => {
    fs.writeFile(fileName, JSON.stringify(data, null, 2), (err) => {
      if (err) throw err;
      console.log('The file has been saved!', fileName);
    });
  };

  // Function to check if a module is a project internal type
  const isInternalTypeImport = (moduleSource) => {
    // Handle both relative paths and aliased paths
    return (
      moduleSource.startsWith('./') || 
      moduleSource.startsWith('../') || 
      moduleSource === 'types' ||
      moduleSource === '$lib/types'
    );
  };

  const processFile = async (filePath) => {
    if (!fileContainsProps(filePath)) {
      console.log(`Skipping ${filePath} - does not use $props()`);
      return;
    }

    const name = path.parse(filePath).name;
    const outputFile = path.join(directory, `${name}.json`);

    const { typeName, props, isExternalType, sourceModule } = extractProps(filePath);
    
    let typeInfo = null;
    if (typeName) {
      // Get the base type name (without generics)
      const baseTypeName = typeName.split('<')[0];
      
      // Handle both internal and external types
      if (isExternalType) {
        if (isInternalTypeImport(sourceModule)) {
          // This is an internal type (from types.ts or similar)
          const typeLineNumber = findTypeLineNumber(baseTypeName);
          typeInfo = {
            name: typeName,
            link: typeLineNumber ? `${githubBaseUrl}/blob/main/src/lib/types.ts#L${typeLineNumber}` : null
          };
        } else if (sourceModule === 'svelte/elements') {
          // Svelte elements type
          typeInfo = {
            name: typeName,
            link: `https://github.com/sveltejs/svelte/blob/main/packages/svelte/elements.d.ts`
          };
        } else if (sourceModule?.startsWith('svelte')) {
          // Other Svelte types
          typeInfo = {
            name: typeName,
            link: `https://github.com/sveltejs/svelte/tree/main/packages/${sourceModule}`
          };
        } else {
          // Other external types
          typeInfo = {
            name: typeName,
            link: null
          };
        }
      } else {
        // Direct internal type (not imported)
        const typeLineNumber = findTypeLineNumber(typeName);
        typeInfo = {
          name: typeName,
          link: typeLineNumber ? `${githubBaseUrl}/blob/main/src/lib/types.ts#L${typeLineNumber}` : null
        };
      }
    }

    const data = {
      name,
      type: typeInfo,
      props
    };

    writeToFile(outputFile, data);
    console.log(`Processed ${filePath}`);
  };

  const processDirectory = async (dirPath) => {
    try {
      const entries = await readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await processDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('.svelte')) {
          await processFile(fullPath);
        }
      }
    } catch (err) {
      console.error(`Error reading directory ${dirPath}:`, err);
    }
  };

  console.log(`Starting to process Svelte components in ${srcLib}...`);
  await processDirectory(srcLib);
  console.log(`All done! Component data saved to ${directory}`);
}

// ES modules pattern to check if file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Error: Missing required arguments');
    console.error('Usage: node componentDataPropValue.js <githubLink>');
    console.error('Example: node componentDataPropValue.js themesberg/flowbite-svelte-next');
    process.exit(1);
  }
  
  const githubLink = args[0];
  
  try {
    componentDataPropValue(null, githubLink); // Pass null for srcDir when running directly
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}