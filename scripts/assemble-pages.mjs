// Docusaurus builds with baseUrl /docs/, but Cloudflare Pages serves the upload root.
// This places the build under dist/docs and redirects the root to it.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const buildDir = path.join(repoRoot, 'build');
const distDir = path.join(repoRoot, 'dist');

if (!fs.existsSync(path.join(buildDir, 'index.html'))) {
  throw new Error('Missing build/index.html. Run npm run build first.');
}

fs.rmSync(distDir, {recursive: true, force: true});
fs.mkdirSync(distDir, {recursive: true});
fs.cpSync(buildDir, path.join(distDir, 'docs'), {recursive: true});
fs.writeFileSync(path.join(distDir, '_redirects'), '/ /docs/ 302\n');

console.log(`assembled_pages=${distDir}`);
