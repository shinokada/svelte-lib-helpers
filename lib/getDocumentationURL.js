import * as fs from 'fs';

export const getDocumentationURL = (packageJsonPath) => {
  try {
    const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8');
    const packageJsonData = JSON.parse(packageJsonContent);
    return packageJsonData.homepage || null;
  } catch (error) {
    return null; // Could not read or parse package.json
  }
};