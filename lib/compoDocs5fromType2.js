import * as fs from 'fs';
import path from 'path';
import { getDocumentationURL } from './getDocumentationURL.js';

function splitPropsInterface(propsInterface) {
  const interfaceProps = [];
  const lines = propsInterface.split("\n");

  for (const line of lines) {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith("//")) {
      const [name, type] = trimmedLine.split(":").map(s => s.trim());
      if (name && type) {
        interfaceProps.push({ name: name.replace("?", ""), type: type.replace(";", "") });
      }
    }
  }

  console.log("Parsed interface props:", interfaceProps);
  return interfaceProps;
}

function extractTypes(content, componentName) {
  console.log(`Extracting types for component: ${componentName}`);
  const targetInterface = `${componentName}Props`;
  console.log(`Target interface: ${targetInterface}`);

  // Regular expression to match interface definitions, including those that extend other interfaces
  const interfaceRegex = new RegExp(`(?:export\\s+)?interface\\s+(${targetInterface})\\s*(?:extends\\s+[\\w\\s,<>]+)?\\s*{([\\s\\S]*?)}`, 'm');
  const interfaceMatch = content.match(interfaceRegex);

  if (interfaceMatch) {
    const interfaceName = interfaceMatch[1];
    console.log(`Found target interface: ${interfaceName}`);

    const props = splitPropsInterface(interfaceMatch[2]);
    console.log("Extracted props:", props);
    return {
      name: interfaceName,
      props: props
    };
  } else {
    console.log(`No match found for target interface: ${targetInterface}`);
    
    // If interface is not found, look for type alias
    const typeAliasRegex = new RegExp(`type\\s+${targetInterface}\\s*=\\s*([^;]+)`, 'm');
    const typeAliasMatch = content.match(typeAliasRegex);
    
    if (typeAliasMatch) {
      console.log(`Found type alias for ${targetInterface}: ${typeAliasMatch[1]}`);
      return {
        name: targetInterface,
        props: [{ name: targetInterface, type: typeAliasMatch[1] }]
      };
    }
  }
  
  return { name: '', props: [] };
}

function extractImportedTypes(content) {
  const typeMatches = content.match(/(?:export\s+)?(?:type|interface)\s+(\w+)(?:\s*=\s*[^;]+|[^{]*{[^}]*})/g) || [];
  const importedTypes = {};

  for (const match of typeMatches) {
    const nameMatch = match.match(/(?:type|interface)\s+(\w+)/);
    if (nameMatch) {
      const name = nameMatch[1];
      importedTypes[name] = match;
    }
  }

  console.log("Extracted imported types:", importedTypes);
  return importedTypes;
}

export const addCompoDocs5fromType2 = (srcDir) => {
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const documentationURL = getDocumentationURL(packageJsonPath);

  if (!documentationURL) {
    throw new Error('"homepage" value is not specified in package.json');
  }

  function processFile(filePath) {
    console.log(`Processing file: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(/<!--\s*@component[\s\S]*?-->\n*/, '').replace(/\s*$/, '');
  
    let tsTypes = { props: [] };
    let importedTypes = {};
    
    // Extract the component name from the Svelte file name
    const componentName = path.basename(filePath, '.svelte');
    console.log(`Component name: ${componentName}`);
  
    // Always look for the index.ts file in the same directory
    const tsFilePath = path.join(path.dirname(filePath), 'index.ts');
    console.log(`Looking for TS file: ${tsFilePath}`);
  
    if (fs.existsSync(tsFilePath)) {
      const tsContent = fs.readFileSync(tsFilePath, 'utf-8');
      
      tsTypes = extractTypes(tsContent, componentName);
      importedTypes = extractImportedTypes(tsContent);
    } else {
      console.log(`TS file not found: ${tsFilePath}`);
    }
  
    console.log(`Extracted types:`, tsTypes);
    console.log(`Imported types:`, importedTypes);
  
    const propLines = content.match(/let\s*{([^}]*)}\s*(?::\s*(\w+))?\s*=\s*\$props\(\);/);
    const combinedProps = [];
  
    if (propLines) {
      console.log(`Found prop lines: ${propLines[0]}`);
      const propsExtract = propLines[1].replace(/\/\/.*$/gm, '');
  
      // Get props type name from either the explicit type or the component name
      const propsTypeName = propLines[2] || `${componentName}Props`;
      console.log(`Props type name: ${propsTypeName}`);
  
      const interfaceContent = importedTypes[propsTypeName];
      console.log(`Interface content for ${propsTypeName}:`, interfaceContent);
  
      for (const line of propsExtract.split(",")) {
        const [namePart, defaultValue] = line.split("=").map(s => s.trim());
        let name = namePart.split(":")[0].trim();
        if (name && !name.includes('...')) {
          let type = 'any';  // Default to 'any'
  
          // Special case for 'class' prop
          if (name === 'class' || name === 'className') {
            type = 'string';
          } else {
            // Find the type in the extracted props
            const tsType = tsTypes.props.find(t => t.name === name);
            if (tsType) {
              type = tsType.type;
            } else if (interfaceContent) {
              // If the prop is not found in tsTypes, check if it's defined in the interface
              const propRegex = new RegExp(`${name}\\s*:\\s*([^;\\n]+)`);
              const propMatch = interfaceContent.match(propRegex);
              if (propMatch) {
                type = propMatch[1].trim();
              }
            }
  
            // Replace imported types if applicable
            Object.entries(importedTypes).forEach(([typeName, typeValue]) => {
              if (type.includes(typeName)) {
                type = type.replace(typeName, typeValue);
                console.log(`Replaced ${typeName} with ${typeValue}`);
              }
            });
          }
  
          console.log(`Final prop: ${name}, Type: ${type}, Default: ${defaultValue}`);
          combinedProps.push(`${name}: ${type}${defaultValue ? ` = ${defaultValue}` : ''};`);
        }
      }
    } else {
      console.log('No prop lines found');
    }
  
    const combinedPropsText = combinedProps.join("\n@props:");
    content = `${content}\n\n<!--\n@component\n[Go to docs](${documentationURL})\n## Props\n@props: ${combinedPropsText}\n-->\n`;
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  const traverseDirectory = (dirPath) => {
    const items = fs.readdirSync(dirPath);
    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);

      if (stat.isDirectory()) {
        traverseDirectory(itemPath);
      } else if (stat.isFile() && item.endsWith('.svelte')) {
        processFile(itemPath);
      }
      console.log('Completed: ', item);
    }
  };

  console.log("Generating documentation for Svelte 5 components using component name convention...");
  traverseDirectory(srcDir);
  console.log("All done!");
};