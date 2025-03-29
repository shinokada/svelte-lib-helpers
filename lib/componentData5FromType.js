import * as fs from 'fs';
import path from 'path';
import { getDocumentationURL } from './getDocumentationURL.js';

function splitPropsInterface (propsInterface) {
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

function extractTypes (content, aliasMap = {}, targetInterface = '') {
  console.log("Extracting types from content");
  console.log(`Target interface: ${targetInterface}`);

  // Simplified regex to match interface or type
  const typeRegex = new RegExp(
    `(interface|type)\\s+(${targetInterface})\\s*(?:<[^>]*>)?\\s*(?:extends[^{]+)?\\s*{([\\s\\S]*?)}`,
    'im'
  );

  console.log("Regex pattern:", typeRegex.source);

  const typeMatch = content.match(typeRegex);

  if (typeMatch) {
    console.log("Match found:", typeMatch[0]);
    const interfaceType = typeMatch[1];
    const interfaceName = typeMatch[2];
    const interfaceBody = typeMatch[3];
    console.log(`Found ${interfaceType} named: ${interfaceName}`);
    console.log("Interface body:", interfaceBody);

    const props = splitPropsInterface(interfaceBody);
    console.log("Extracted props:", props);
    return {
      name: interfaceName,
      props: props
    };
  } else {
    console.log(`No match found for target interface: ${targetInterface}`);
    console.log("Attempting to match each part separately:");

    // Try to match parts of the pattern separately
    const interfaceKeyword = content.match(/(interface|type)\s+${targetInterface}/im);
    console.log("Interface/Type keyword match:", interfaceKeyword ? interfaceKeyword[0] : "No match");

    const genericMatch = content.match(new RegExp(`${targetInterface}\\s*<[^>]*>`, 'im'));
    console.log("Generic type match:", genericMatch ? genericMatch[0] : "No match");

    const extendsMatch = content.match(new RegExp(`${targetInterface}[^{]*extends[^{]+`, 'im'));
    console.log("Extends clause match:", extendsMatch ? extendsMatch[0] : "No match");

    const bodyMatch = content.match(new RegExp(`${targetInterface}[^{]*{([\\s\\S]*?)}`, 'im'));
    console.log("Interface body match:", bodyMatch ? bodyMatch[0] : "No match");

    // If interface is not found, look for type alias
    const typeAliasRegex = new RegExp(`type\\s+${targetInterface}\\s*=\\s*([^;]+)`, 'im');
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

function extractExtendedTypes (content, targetInterface) {
  console.log(`Extracting types for ${targetInterface}`);

  // First, try to match a simple interface or type alias
  const simpleRegex = new RegExp(`(?:export\\s+)?(?:interface|type)\\s+(${targetInterface})\\s*=?\\s*{([\\s\\S]*?)}`, 'm');
  const simpleMatch = content.match(simpleRegex);

  if (simpleMatch) {
    console.log(`Found simple interface/type: ${targetInterface}`);
    const [, interfaceName, propsContent] = simpleMatch;
    const props = splitPropsInterface(propsContent);
    return {
      name: interfaceName,
      props: props
    };
  }

  // If no simple match, try to match extended interface or intersection type
  const complexRegex = new RegExp(`(?:export\\s+)?(?:interface|type)\\s+(${targetInterface})\\s*(?:extends\\s+([\\w\\s,<>]+))?\\s*(?:=\\s*([\\w\\s&]+)\\s*&)?\\s*{([\\s\\S]*?)}`, 'm');
  const complexMatch = content.match(complexRegex);

  if (!complexMatch) {
    console.log(`No match found for ${targetInterface}`);
    return null;
  }

  const [, interfaceName, extendedInterfaces, intersectionTypes, ownProps] = complexMatch;
  console.log(`Found complex interface: ${interfaceName}`);

  const props = splitPropsInterface(ownProps);

  let allProps = [...props];

  if (extendedInterfaces) {
    const extendedInterfaceNames = extendedInterfaces.split(',').map(s => s.trim());
    for (const extendedInterface of extendedInterfaceNames) {
      const extendedProps = extractExtendedTypes(content, extendedInterface);
      if (extendedProps) {
        allProps = [...allProps, ...extendedProps.props];
      }
    }
  }

  if (intersectionTypes) {
    const intersectionTypeNames = intersectionTypes.split('&').map(s => s.trim());
    for (const typeName of intersectionTypeNames) {
      const intersectionProps = extractExtendedTypes(content, typeName);
      if (intersectionProps) {
        allProps = [...allProps, ...intersectionProps.props];
      }
    }
  }

  return {
    name: interfaceName,
    props: allProps
  };
}

function extractImportedTypes (content) {
  const typeMatches = content.match(/(?:export\s+)?(?:type|interface)\s+(\w+)(?:\s*=\s*[^;]+|[^{]*{[^}]*})/g) || [];
  const importedTypes = {};

  for (const match of typeMatches) {
    const [, name, value] = match.match(/(?:type|interface)\s+(\w+)(?:\s*=\s*([^;]+)|[^{]*({[^}]*}))/);
    importedTypes[name] = value || match;
  }

  console.log("Extracted imported types:", importedTypes);
  return importedTypes;
}


const componentData5FromType = (srcDir) => {
  console.log("Starting componentData5FromType...");

  if (!srcDir) {
    throw new Error('Source directory (srcDir) must be provided');
  }

  console.log(`Received srcDir: ${srcDir}`);

  // Resolve the path to ensure it's absolute
  const resolvedSrcDir = path.resolve(srcDir);
  console.log(`Resolved srcDir: ${resolvedSrcDir}`);

  if (!fs.existsSync(resolvedSrcDir)) {
    throw new Error(`The provided source directory does not exist: ${resolvedSrcDir}`);
  }

  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const documentationURL = getDocumentationURL(packageJsonPath);

  if (!documentationURL) {
    throw new Error('"homepage" value is not specified in package.json');
  }

  function writeJsonFile (componentName, props) {
    // console.log('props: ', props)
    // console.log('componentName: ', componentName)
    const outputDir = path.join(process.cwd(), 'src', 'routes', 'component-data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const jsonContent = {
      name: componentName,
      props: props.map(prop => [prop.name, prop.type, prop.defaultValue || ''])
    };
    console.log('jsonContent: ', jsonContent);
    console.log('jsonContent with JSON.stingify: ', JSON.stringify(jsonContent, null, 2));

    const outputPath = path.join(outputDir, `${componentName}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(jsonContent, null, 2));
    console.log(`JSON file written: ${outputPath}`);
  }

  function extractInterfaceName (filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Updated regular expression to match both formats
    const importRegex = /import\s*{[^}]*type\s+(\w+)\s+as\s+Props[^}]*}/;

    const match = content.match(importRegex);
    console.log('match: ', match);

    if (match && match[1]) {
      return match[1];
    }

    return null;
  }

  function processFile (filePath) {
    console.log(`Processing file: ${filePath}`);
    let content = fs.readFileSync(filePath, 'utf-8');
    content = content.replace(/<!--\s*@component[\s\S]*?-->\n*/, '').replace(/\s*$/, '');

    let tsTypes = { props: [] };
    let importedTypes = {};
    let aliasMap = {};
    let targetInterface = '';

    const tsFilePath = path.join(path.dirname(filePath), 'index.ts');
    console.log(`Looking for TS file: ${tsFilePath}`);

    if (fs.existsSync(tsFilePath)) {
      const tsContent = fs.readFileSync(tsFilePath, 'utf-8');

      // const componentName = path.basename(filePath, '.svelte');
      // targetInterface = `${componentName}Props`;
      // console.log(`Target interface: ${targetInterface}`);
      const targetInterface = extractInterfaceName(filePath);
      console.log(`Target interface: ${targetInterface}`);

      tsTypes = extractTypes(tsContent, aliasMap, targetInterface);
      importedTypes = extractImportedTypes(tsContent);

      const importMatch = content.match(/import\s*{[^}]*}\s*from\s*['"]\.['"];/);
      if (importMatch) {
        console.log(`Found import: ${importMatch[0]}`);
        const aliasMatch = importMatch[0].match(/type\s+(\w+Props)\s+as\s+(\w+)/);
        if (aliasMatch) {
          aliasMap[aliasMatch[2]] = aliasMatch[1];
          console.log(`Mapped alias: ${aliasMatch[2]} -> ${aliasMatch[1]}`);
        }
      }
    } else {
      console.log(`TS file not found: ${tsFilePath}`);
    }

    console.log(`Extracted types:`, tsTypes);
    console.log(`Imported types:`, importedTypes);
    console.log(`Alias map:`, aliasMap);
    const propLines = content.match(/let\s*{([^}]*(?:{[^}]*}[^}]*)*?)}\s*:\s*(\w+)\s*=\s*\$props\(\);/);
    // const propLines = content.match(/let\s*{([^}]*)}\s*:\s*(\w+)(?:<[^>]*>)?\s*=\s*\$props\(\);/);
    console.log('propLines: ', propLines);
    const combinedProps = [];

    if (propLines) {
      console.log(`Found prop lines: ${propLines[0]}`);
      const propsExtract = propLines[1].replace(/\/\/.*$/gm, '');

      let propsTypeName = propLines[2];
      if (aliasMap[propsTypeName]) {
        propsTypeName = aliasMap[propsTypeName];
        console.log(`Resolved alias ${propLines[2]} -> ${propsTypeName}`);
      }

      const interfaceContent = importedTypes[propsTypeName];
      console.log(`Interface content for ${propsTypeName}:`, interfaceContent);

      for (const line of propsExtract.split(",")) {
        const [namePart, defaultValue] = line.split("=").map(s => s.trim());
        let name = namePart.split(":")[0].trim();
        if (name && !name.includes('...')) {
          let type = 'any';

          if (name === 'class' || name === 'className') {
            type = 'string';
          } else {
            const tsType = tsTypes.props.find(t => t.name === name);
            if (tsType) {
              type = tsType.type;
            } else if (interfaceContent) {
              const propRegex = new RegExp(`${name}\\s*:\\s*([^;\\n]+)`);
              const propMatch = interfaceContent.match(propRegex);
              if (propMatch) {
                type = propMatch[1].trim();
              }
            }

            Object.entries(importedTypes).forEach(([typeName, typeValue]) => {
              if (type.includes(typeName)) {
                type = type.replace(typeName, typeValue);
                console.log(`Replaced ${typeName} with ${typeValue}`);
              }
            });
          }

          console.log(`Final prop: ${name}, Type: ${type}, Default: ${defaultValue}`);
          combinedProps.push({ name, type, defaultValue });
        }
      }
    } else {
      console.log('No prop lines found');
    }

    const componentName = path.basename(filePath, '.svelte');

    writeJsonFile(componentName, combinedProps);

    const combinedPropsText = combinedProps.map(prop => `${prop.name}: ${prop.type}${prop.defaultValue ? ` = ${prop.defaultValue}` : ''};`).join("\n@props:");
    content = `${content}\n\n<!--\n@component\n[Go to docs](${documentationURL})\n## Props\n@props: ${combinedPropsText}\n-->\n`;
    fs.writeFileSync(filePath, content, 'utf-8');
  }

  const traverseDirectory = (dirPath) => {
    console.log(`Traversing directory: ${dirPath}`);
    if (!dirPath) {
      console.error('Directory path is undefined');
      return;
    }
    if (!fs.existsSync(dirPath)) {
      console.error(`Directory does not exist: ${dirPath}`);
      return;
    }
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

  console.log("Generating documentation for svelte 5 interface Prop ...");
  traverseDirectory(resolvedSrcDir);
  console.log("All done!");
};

export { componentData5FromType };