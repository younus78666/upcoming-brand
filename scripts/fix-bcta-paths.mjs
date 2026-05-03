import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

async function walk(dir, files = []) {
  const ents = await readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, files);
    else if (e.name === 'index.astro') files.push(full);
  }
  return files;
}

function correctImportPath(filePath) {
  const rel = filePath.replace(/\\/g, '/');
  // depth from src/ — count directories between src and the file
  const parts = rel.split('/');
  // remove 'src' (parts[0]) and filename (last). What remains is 'pages/...':
  // For src/pages/index.astro → remaining = ['pages']
  // For src/pages/about/index.astro → remaining = ['pages','about']
  // For src/pages/industries/dental-website-design/index.astro → remaining = ['pages','industries','dental-website-design']
  // The number of '../' needed is `remaining.length` to escape back to src/
  const remaining = parts.slice(1, -1);
  const back = '../'.repeat(remaining.length);
  return `${back}components/BottomFormCTA.astro`;
}

const files = await walk('src/pages');
let fixed = 0;
for (const f of files) {
  const src = await readFile(f, 'utf8');
  const correct = correctImportPath(f);
  // Replace any existing BottomFormCTA import line with the correct path
  const re = /import BottomFormCTA from '[^']+BottomFormCTA\.astro';/;
  if (!re.test(src)) continue;
  const out = src.replace(re, `import BottomFormCTA from '${correct}';`);
  if (out !== src) {
    await writeFile(f, out, 'utf8');
    console.log(`fixed ${f.replace(/\\/g, '/')} → ${correct}`);
    fixed++;
  }
}
console.log(`\nFixed ${fixed} import paths.`);
