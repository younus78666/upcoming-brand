import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

async function walkAll(dir, files = []) {
  const ents = await readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walkAll(full, files);
    else if (e.name.endsWith('.astro')) files.push(full);
  }
  return files;
}

// Pattern: <a ... href="/dead/" ...>...</a> -> remove entire anchor
// We'll collapse case-study link cards or list items to plain content
const deadPaths = [
  '/work/arden-interiors/',
  '/work/chesapeake-dental/',
  '/work/meridian-law-group/',
  '/work/tidewater-realty/',
  '/tools/discovery-questionnaire/',
  '/tools/schema-validator/',
  '/tools/seo-audit/',
  '/tools/speed-checker/',
  '/tools/website-cost-calculator/',
];

const files = await walkAll('src');
let touched = 0;
const log = [];

for (const f of files) {
  let src = await readFile(f, 'utf8');
  let changed = false;

  for (const dead of deadPaths) {
    // Strip whole entries inside arrays of objects when the href is dead
    // Pattern: { ... href: "/dead/" ... },\n -> remove the line
    const objRe = new RegExp(`\\s*\\{[^}]*href:\\s*["']${dead.replace(/[/]/g, '\\/')}["'][^}]*\\},?\\n`, 'g');
    if (objRe.test(src)) {
      src = src.replace(objRe, '\n');
      changed = true;
      log.push(`${f.replace(/\\/g, '/')}: removed object entry for ${dead}`);
    }

    // Strip <a href="dead">...</a> tags entirely
    const anchorRe = new RegExp(`\\s*<a[^>]*href=["']${dead.replace(/[/]/g, '\\/')}["'][^>]*>[\\s\\S]*?<\\/a>\\s*`, 'g');
    if (anchorRe.test(src)) {
      src = src.replace(anchorRe, '\n');
      changed = true;
      log.push(`${f.replace(/\\/g, '/')}: removed <a> for ${dead}`);
    }
  }

  if (changed) {
    await writeFile(f, src, 'utf8');
    touched++;
  }
}

console.log(`${touched} files updated.`);
log.forEach((l) => console.log('  ' + l));
