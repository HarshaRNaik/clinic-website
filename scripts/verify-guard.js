const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const filesToCheck = [
  path.join(root, '..', 'README.md'),
  path.join(root, '..', 'COMPLIANCE.md'),
  path.join(root, '..', 'INCIDENT_RESPONSE.md'),
  path.join(root, '..', 'THREAT_MODEL.md')
];

for (const file of filesToCheck) {
  if (!fs.existsSync(file)) {
    console.error(`Missing required docs: ${path.relative(process.cwd(), file)}`);
    process.exit(1);
  }
}

console.log('Required governance docs present.');
