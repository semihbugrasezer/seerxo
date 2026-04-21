import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '..');
const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : null;

if (!targetDir) {
  console.error('Usage: node scripts/prepare-github-package.mjs <target-dir>');
  process.exit(1);
}

const packageJsonPath = path.join(repoRoot, 'package.json');
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
const packageFiles = [...new Set([...(packageJson.files || []), 'package.json'])];

const githubPackageJson = {
  ...packageJson,
  name: '@semihbugrasezer/seerxo',
  publishConfig: {
    ...(packageJson.publishConfig || {}),
    registry: 'https://npm.pkg.github.com',
  },
};

await fs.rm(targetDir, { recursive: true, force: true });
await fs.mkdir(targetDir, { recursive: true });

for (const relativePath of packageFiles) {
  const sourcePath = path.join(repoRoot, relativePath);
  const destinationPath = path.join(targetDir, relativePath);

  await fs.mkdir(path.dirname(destinationPath), { recursive: true });
  await fs.cp(sourcePath, destinationPath, { recursive: true });
}

await fs.writeFile(
  path.join(targetDir, 'package.json'),
  `${JSON.stringify(githubPackageJson, null, 2)}\n`
);

await fs.writeFile(
  path.join(targetDir, '.npmrc'),
  '@semihbugrasezer:registry=https://npm.pkg.github.com\n'
);

console.log(`Prepared GitHub Packages bundle in ${targetDir}`);
