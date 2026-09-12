const fs = require('node:fs');
const path = require('node:path');

const datasetDir = path.join(__dirname, 'dataset');
const files = fs.readdirSync(datasetDir).filter((name) => name.endsWith('.txt') || name.endsWith('.md') || name.endsWith('.json'));
const phonePattern = /(\+?\d{1,3}[-.\s]?)?(\(?\d{3}\)?[-.\s]?)\d{3}[-.\s]?\d{4}/;
const emailPattern = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

let badFile = null;
for (const file of files) {
  const fullPath = path.join(datasetDir, file);
  const content = fs.readFileSync(fullPath, 'utf8');
  if (phonePattern.test(content) || emailPattern.test(content)) {
    badFile = file;
    break;
  }
}

if (badFile) {
  console.error(`Synthetic dataset guard failed: ${badFile} contains a phone number or email pattern.`);
  process.exit(1);
}

console.log('Synthetic dataset guard passed. No real identifiers detected.');
