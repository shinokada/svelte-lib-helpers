import fs from 'fs';
import path from 'path';

const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

export const addCompoDocs = () => {
  const srcDir = path.join(__dirname, 'src', 'lib');
  
  const processFile = (filePath) => {
    let content = fs.readFileSync(filePath, 'utf-8');

    // Remove previous @component comments and trailing empty lines
    content = content.replace(/<!--\s*@component[\s\S]*?-->\n*/, '').replace(/\s*$/, '');

    // Find all lines starting with 'export let' and create @prop comments
    const propLines = content.match(/export let [\s\S]*?;/g);
    if (propLines) {
      const propComment = propLines.map(line => {
        return `@prop ${line.replace(/\/\/.*$/, '').trim()}`;
      }).join('\n');

      content = `${content}\n\n<!--\n@component\n[Go to Popover](https://flowbite-svelte.com/)\n## Props\n${propComment}\n-->\n`;

      fs.writeFileSync(filePath, content, 'utf-8');
    }
  };

  const traverseDirectory = (dirPath) => {
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
  };

  traverseDirectory(srcDir);

  console.log("Generating documentation...");
};
