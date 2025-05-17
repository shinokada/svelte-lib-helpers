#!/usr/bin/env node

import * as fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Debug function to log detailed information
const debug = (message, data = null) => {
  if (process.env.DEBUG) {
    console.log(`DEBUG: ${message}`);
    if (data !== null) {
      console.log(data);
    }
  }
};

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
    const baseTypeName = typeName.split('<')[0].trim();
    
    // Look for type/interface definition patterns with more comprehensive patterns
    const patterns = [
      // Standard export type/interface definitions
      new RegExp(`^\\s*export\\s+(?:type|interface)\\s+${baseTypeName}\\b`),
      new RegExp(`^\\s*export\\s+(?:type|interface)\\s+${baseTypeName}\\s*=`),
      // Non-export type/interface definitions
      new RegExp(`^\\s*(?:type|interface)\\s+${baseTypeName}\\b`),
      // Handle extended types like "export interface TooltipProps extends PopperProps"
      new RegExp(`^\\s*export\\s+interface\\s+${baseTypeName}\\s+extends\\s+`),
      // Handle more complex type definitions with generics
      new RegExp(`^\\s*export\\s+type\\s+${baseTypeName}(?:<[^>]*>)?\\s*=`),
      // Handle specifically the problematic types in your examples
      new RegExp(`\\binterface\\s+${baseTypeName}\\b`),
      new RegExp(`\\btype\\s+${baseTypeName}\\b`)
    ];
    
    // Search for the type definition
    for (let i = 0; i < typesLines.length; i++) {
      const line = typesLines[i];
      if (patterns.some(pattern => pattern.test(line))) {
        return i + 1; // Line numbers are 1-based
      }
    }
    
    // Additional debug logging to help diagnose issues
    if (process.env.DEBUG) {
      console.log(`DEBUG: Could not find type definition for "${baseTypeName}" in types.ts`);
      console.log(`DEBUG: First 10 lines of types.ts for reference:`);
      typesLines.slice(0, 10).forEach((line, i) => {
        console.log(`${i+1}: ${line}`);
      });
    }
    
    return null; // Type not found
  }

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

  // Extract the raw props declaration from a Svelte component
  const extractRawPropsDeclaration = (content) => {
    // Look for the complete props declaration pattern
    const propsDeclarationRegex = /let\s+\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}\s*:\s*[^;=]*\s*=\s*\$props\(\);?/s;
    const match = content.match(propsDeclarationRegex);
    
    if (match) {
      return match[0];
    }
    
    // If the above regex fails, try a more permissive approach
    const simplifiedRegex = /let\s+\{[^;]*\}\s*:[^;]*=\s*\$props\(\);?/s;
    const simpleMatch = content.match(simplifiedRegex);
    
    return simpleMatch ? simpleMatch[0] : null;
  };

  // Improved manual parsing function for props to handle complex cases
  const parsePropsManually = (propDeclaration) => {
    debug("Attempting manual props parsing", propDeclaration);
    
    // Extract the type name - looking for the pattern }: TypeName =
    const typeRegex = /}\s*:\s*([A-Za-z0-9_]+(?:<[^>]*>)?)\s*=/;
    const typeMatch = propDeclaration.match(typeRegex);
    
    let typeName = null;
    if (typeMatch && typeMatch[1]) {
      typeName = typeMatch[1].trim();
      debug("Extracted type name", typeName);
    } else {
      debug("Failed to extract type name using regex");
      // Try using old method to extract content between colon and equals
      const colonIndex = propDeclaration.indexOf(':');
      const equalsIndex = propDeclaration.indexOf('=', colonIndex);
      
      if (colonIndex !== -1 && equalsIndex !== -1) {
        // Find the last "}" before the colon
        const lastBraceBeforeColon = propDeclaration.lastIndexOf('}', colonIndex);
        if (lastBraceBeforeColon !== -1) {
          typeName = propDeclaration.substring(colonIndex + 1, equalsIndex).trim();
          // If we found a type name with spaces, try to extract just the actual type
          if (typeName.includes(' ')) {
            const potentialType = typeName.split(/\s+/).pop();
            if (potentialType && /^[A-Za-z0-9_]+(?:<[^>]*>)?$/.test(potentialType)) {
              typeName = potentialType;
              debug("Extracted type name using fallback method", typeName);
            }
          }
        }
      }
    }
    
    // Extract the content between the curly braces
    const openBraceIndex = propDeclaration.indexOf('{');
    const closeBraceIndex = propDeclaration.indexOf('}', openBraceIndex);
    
    if (openBraceIndex === -1 || closeBraceIndex === -1) {
      debug("Failed to find proper curly braces in props declaration");
      return { typeName, props: [] };
    }
    
    const propsContent = propDeclaration.substring(openBraceIndex + 1, closeBraceIndex).trim();
    debug("Extracted props content", propsContent);
    
    // Parse the props content using a custom tokenizer
    const props = tokenizeAndParseProps(propsContent);
    debug("Parsed props", props);
    
    return { typeName, props };
  };

  // Custom tokenizer for props that can handle complex syntax
  const tokenizeAndParseProps = (propsContent) => {
    const props = [];
    let currentToken = '';
    let inString = false;
    let stringChar = '';
    let braceLevel = 0;
    let bracketLevel = 0;
    let parenLevel = 0;
    
    for (let i = 0; i < propsContent.length; i++) {
      const char = propsContent[i];
      
      // Handle string boundaries
      if ((char === '"' || char === "'" || char === '`') && 
          (i === 0 || propsContent[i-1] !== '\\')) {
        if (!inString) {
          inString = true;
          stringChar = char;
        } else if (char === stringChar) {
          inString = false;
        }
      }
      
      // Track nested structures
      if (!inString) {
        if (char === '{') braceLevel++;
        else if (char === '}') braceLevel--;
        else if (char === '[') bracketLevel++;
        else if (char === ']') bracketLevel--;
        else if (char === '(') parenLevel++;
        else if (char === ')') parenLevel--;
      }
      
      // Add character to current token
      currentToken += char;
      
      // If we hit a comma at the top level, process the token
      if (char === ',' && !inString && braceLevel === 0 && bracketLevel === 0 && parenLevel === 0) {
        processToken(currentToken.slice(0, -1).trim(), props); // Remove the comma
        currentToken = '';
      }
    }
    
    // Don't forget the last token
    if (currentToken.trim()) {
      processToken(currentToken.trim(), props);
    }
    
    return props;
  };

  // Process an individual token into a prop entry
  const processToken = (token, props) => {
    // Skip rest operator
    if (token.startsWith('...')) {
      return;
    }
    
    const equalsIndex = token.indexOf('=');
    
    if (equalsIndex !== -1) {
      const name = token.substring(0, equalsIndex).trim();
      const defaultValue = token.substring(equalsIndex + 1).trim();
      props.push([name, defaultValue]);
    } else {
      props.push([token.trim(), ""]);
    }
  };

  // Extract props from Svelte 5 syntax
  const extractProps = (filePath) => {
    const content = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath);
    debug(`Processing file: ${fileName}`);
    
    // Extract imports for type resolution
    const imports = extractImports(content);
    debug("Imports extracted", imports);
    
    // Get the raw props declaration
    const propsDeclaration = extractRawPropsDeclaration(content);
    
    if (!propsDeclaration) {
      debug("No props declaration found");
      return { typeName: null, props: [], isExternalType: false, sourceModule: null };
    }
    
    debug("Raw props declaration:", propsDeclaration);
    
    // Use manual parsing for the props
    const { typeName, props } = parsePropsManually(propsDeclaration);
    
    // Determine if the type is external
    let isExternalType = false;
    let sourceModule = null;
    
    if (typeName) {
      // Extract base type name (before any generics)
      const baseTypeName = typeName.split('<')[0].trim();
      
      // Check if this type is imported
      if (imports[baseTypeName]) {
        isExternalType = true;
        sourceModule = imports[baseTypeName].source;
      }
    }
    
    return { typeName, props, isExternalType, sourceModule };
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

  // Add this improved type resolution logic to the processFile function

const processFile = async (filePath) => {
  if (!fileContainsProps(filePath)) {
    console.log(`Skipping ${filePath} - does not use $props()`);
    return;
  }

  const name = path.parse(filePath).name;
  const outputFile = path.join(directory, `${name}.json`);
  
  console.log(`Processing ${name} component...`);

  const { typeName, props, isExternalType, sourceModule } = extractProps(filePath);
  
  // Debug logging for problematic components
  if (['Tooltip', 'Table', 'StepIndicator'].includes(name)) {
    debug(`Special handling for known problematic component: ${name}`);
    debug(`Type name: ${typeName}, Source: ${sourceModule}`);
  }
  
  let typeInfo = null;
  if (typeName) {
    // Get the base type name (without generics)
    const baseTypeName = typeName.split('<')[0].trim();
    
    // Enhanced handling for imports from $lib
    if (isExternalType) {
      // Special handling for $lib imports - these are actually internal types
      if (sourceModule === '$lib' || sourceModule === '$lib/types') {
        debug(`Type ${baseTypeName} is imported from $lib - treating as internal type`);
        
        // Do a comprehensive search in the types file
        let typeLineNumber = null;
        
        // Try direct pattern matching first
        for (let i = 0; i < typesLines.length; i++) {
          const line = typesLines[i].trim();
          const typePatterns = [
            `export interface ${baseTypeName}`,
            `export type ${baseTypeName}`,
            `interface ${baseTypeName}`,
            `type ${baseTypeName}`
          ];
          
          if (typePatterns.some(pattern => line.startsWith(pattern))) {
            typeLineNumber = i + 1;
            debug(`Found ${baseTypeName} at line ${typeLineNumber} using direct pattern matching`);
            break;
          }
        }
        
        // If direct matching fails, try less strict contains approach
        if (!typeLineNumber) {
          for (let i = 0; i < typesLines.length; i++) {
            const line = typesLines[i];
            if (line.includes(`interface ${baseTypeName}`) || line.includes(`type ${baseTypeName}`)) {
              typeLineNumber = i + 1;
              debug(`Found ${baseTypeName} at line ${typeLineNumber} using contains approach`);
              break;
            }
          }
        }
        
        typeInfo = {
          name: typeName,
          link: typeLineNumber ? `${githubBaseUrl}/blob/main/src/lib/types.ts#L${typeLineNumber}` : null
        };
      } else if (isInternalTypeImport(sourceModule)) {
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

  // For problematic components, add a fallback direct search if link is still null
  if (['Tooltip', 'Table', 'StepIndicator'].includes(name) && typeInfo && !typeInfo.link) {
    debug(`Using fallback direct search for ${name} component's type`);
    
    // Map known problematic types to their line numbers
    // This is a hardcoded fallback solution for the specific mentioned components
    const knownTypeLines = {
      'TooltipProps': findExactTypeLineByBruteForce('TooltipProps'),
      'TableProps': findExactTypeLineByBruteForce('TableProps'),
      'StepIndicatorProps': findExactTypeLineByBruteForce('StepIndicatorProps')
    };
    
    const baseTypeName = typeName.split('<')[0].trim();
    if (knownTypeLines[baseTypeName]) {
      typeInfo.link = `${githubBaseUrl}/blob/main/src/lib/types.ts#L${knownTypeLines[baseTypeName]}`;
      debug(`Set hardcoded fallback link for ${baseTypeName} at line ${knownTypeLines[baseTypeName]}`);
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

// Helper function to find a type declaration by brute force
function findExactTypeLineByBruteForce(typeName) {
  debug(`Performing brute force search for ${typeName} in types.ts`);
  
  for (let i = 0; i < typesLines.length; i++) {
    const line = typesLines[i].trim();
    
    // Specific patterns for problematic types
    if (line.startsWith(`export interface ${typeName}`) || 
        line.startsWith(`export type ${typeName}`) ||
        line.includes(`interface ${typeName} extends`) || 
        line.includes(`type ${typeName} =`)) {
      debug(`Found ${typeName} at line ${i+1}: ${line}`);
      return i + 1;
    }
  }
  
  debug(`Could not find ${typeName} by brute force search`);
  return null;
}

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

// Enable debug mode for direct runs if needed
if (process.argv.includes('--debug')) {
  process.env.DEBUG = 'true';
}

// ES modules pattern to check if file is being run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.error('Error: Missing required arguments');
    console.error('Usage: node componentDataPropValue.js <githubLink> [--debug]');
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