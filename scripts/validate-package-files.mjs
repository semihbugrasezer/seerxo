import { access, readFile } from 'node:fs/promises';

const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'));
const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'files', 'license'];

for (const field of requiredFields) {
  if (!packageJson[field]) {
    throw new Error(`package.json is missing required field: ${field}`);
  }
}

for (const file of packageJson.files || []) {
  await access(new URL(`../${file}`, import.meta.url));
}

for (const [command, target] of Object.entries(packageJson.bin || {})) {
  await access(new URL(`../${target}`, import.meta.url));
  if (!command || !target) {
    throw new Error('package.json contains an invalid bin entry');
  }
}

console.log(`Package validation passed for ${packageJson.name}@${packageJson.version}`);
