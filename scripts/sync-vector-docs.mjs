// Pulls the maintained contracts from the vector-lab repo into docs/contracts.
// vector-lab/docs stays the single source of truth; never edit docs/contracts by hand.
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const repoRoot = process.cwd();
const sourceRoot = path.resolve(process.env.VECTOR_LAB_DIR ?? path.join(repoRoot, '..', 'vector-lab'), 'docs');
const targetRoot = path.join(repoRoot, 'docs', 'contracts');
const sourceRepoUrl = 'https://github.com/SrivatsaRv/vector-engagements-labs/blob/main';

if (!fs.existsSync(sourceRoot)) {
  throw new Error(`Missing vector-lab docs directory: ${sourceRoot} (set VECTOR_LAB_DIR)`);
}

// Links that leave docs/ (governance JSON, source files) point at GitHub instead.
function rewriteLinks(markdown) {
  return markdown.replace(/\]\((\.\.\/[^)\s#]+)(#[^)\s]*)?\)/g, (_match, target, hash = '') => {
    const repoPath = path.posix.normalize(path.posix.join('docs', target));
    return `](${sourceRepoUrl}/${repoPath}${hash})`;
  });
}

fs.rmSync(targetRoot, {recursive: true, force: true});
fs.mkdirSync(targetRoot, {recursive: true});

const files = fs.readdirSync(sourceRoot).filter((name) => name.endsWith('.md'));
for (const name of files) {
  const source = fs.readFileSync(path.join(sourceRoot, name), 'utf8');
  fs.writeFileSync(path.join(targetRoot, name), rewriteLinks(source));
}

fs.writeFileSync(
  path.join(targetRoot, '_category_.json'),
  JSON.stringify({label: 'Contracts', position: 3, link: {type: 'doc', id: 'contracts/README'}}, null, 2) + '\n',
);

console.log(`synced_vector_docs=${files.length} from ${sourceRoot}`);
