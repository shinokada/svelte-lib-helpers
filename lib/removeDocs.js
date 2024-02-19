import * as fs from 'fs';
import path from 'path';
import { getDocumentationURL } from './getDocumentationURL.js';

export const removeDocs = (srcDir) => {
  const removeDocsFromContent = (content) => {
    // Create a regular expression that matches the desired comment pattern
    const commentRegex = /<!--\s*@component[\s\S]*?-->\n*/;

    // Replace matched comments with an empty string
    return content.replace(commentRegex, '');
  };

  const processFile = (filePath) => {
    console.log('Removing docs from:', filePath);

    try {
      // Read the file content and apply the removal logic
      let content = fs.readFileSync(filePath, 'utf-8');
      content = removeDocsFromContent(content);

      // Write the updated content back to the file
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log('Docs removed from:', filePath);
    } catch (error) {
      console.error('Error processing file:', filePath, error);
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
        processFile(itemPath); // Process Svelte files
      }
    }
  };

  console.log('Removing documentation...');
  traverseDirectory(srcDir);
  console.log('All done!');
};
