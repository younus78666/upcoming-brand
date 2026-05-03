import { readFile, readdir } from 'node:fs/promises';
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

const pages = await walk('src/pages');
const existingRoutes = new Set(['/']);
for (const p of pages) {
  let route = p.replace(/\\/g, '/').replace('src/pages/', '').replace(/index\.astro$/, '');
  route = '/' + route;
  if (!route.endsWith('/')) route += '/';
  existingRoutes.add(route);
}

async function walkAll(dir, files = []) {
  const ents = await readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walkAll(full, files);
    else if (e.name.endsWith('.astro')) files.push(full);
  }
  return files;
}

const allFiles = await walkAll('src');
const linkRegex = /(?:href=["']|href:\s*["'])(\/[^"'#?\s]+\/?)["']/g;
const dead = new Map();
const seen = new Map();

for (const f of allFiles) {
  const src = await readFile(f, 'utf8');
  let m;
  while ((m = linkRegex.exec(src)) !== null) {
    let url = m[1];
    if (!url.endsWith('/')) url += '/';
    if (url.startsWith('/wp-')) continue;
    if (url.startsWith('//')) continue;
    seen.set(url, (seen.get(url) || 0) + 1);
    if (!existingRoutes.has(url)) {
      if (!dead.has(url)) dead.set(url, []);
      dead.get(url).push(f.replace(/\\/g, '/'));
    }
  }
}

console.log('Existing routes:', existingRoutes.size);
console.log('Total internal routes referenced:', seen.size);
console.log('Dead links:', dead.size);
console.log('---');
const sorted = [...dead.entries()].sort();
for (const [url, files] of sorted) {
  const uniqueFiles = [...new Set(files)];
  console.log(`${url}  (${files.length} refs in ${uniqueFiles.length} files)`);
}
