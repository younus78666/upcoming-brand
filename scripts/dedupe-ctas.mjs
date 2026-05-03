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

const files = await walk('src/pages');
let touched = 0;
const log = [];

for (const file of files) {
  let src = await readFile(file, 'utf8');
  const rel = file.replace(/\\/g, '/');
  const isLocation = rel.includes('/locations/') && !rel.endsWith('/locations/index.astro');
  let changed = false;

  if (isLocation) {
    // Locations: remove BottomFormCTA + its import (keep lp-cta)
    const importRe = /\s*import BottomFormCTA from '[^']+';\s*\n/;
    if (importRe.test(src)) {
      src = src.replace(importRe, '\n');
      changed = true;
    }
    // Remove the <BottomFormCTA ... /> tag (single line or multi-line)
    const tagRe = /\s*<BottomFormCTA[^/]*\/>\s*\n/;
    if (tagRe.test(src)) {
      src = src.replace(tagRe, '\n');
      changed = true;
      log.push(`${rel}: removed BottomFormCTA (kept lp-cta)`);
    }
  } else {
    // Other pages: remove page-cta section if BottomFormCTA exists
    if (!src.includes('BottomFormCTA')) continue;

    // Match <section class="page-cta">...</section>
    // Need to handle nested divs/sections inside. Use bracket-aware approach.
    const sectionStart = src.search(/<section class="page-cta"[^>]*>/);
    if (sectionStart === -1) continue;

    // Find matching </section> by counting <section> nesting
    const startTag = src.slice(sectionStart).match(/<section class="page-cta"[^>]*>/)[0];
    let i = sectionStart + startTag.length;
    let depth = 1;
    while (i < src.length && depth > 0) {
      const nextOpen = src.indexOf('<section', i);
      const nextClose = src.indexOf('</section>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 8;
      } else {
        depth--;
        i = nextClose + 10;
      }
    }
    if (depth === 0) {
      // i is now end of closing </section>
      // Also strip trailing newline
      let endIdx = i;
      while (src[endIdx] === '\n' || src[endIdx] === ' ') endIdx++;
      // Strip leading newline of the section too
      let startIdx = sectionStart;
      // walk backward through preceding whitespace + comment line
      while (startIdx > 0 && (src[startIdx - 1] === ' ' || src[startIdx - 1] === '\t')) startIdx--;
      if (src[startIdx - 1] === '\n') startIdx--;
      src = src.slice(0, startIdx) + '\n' + src.slice(endIdx);
      changed = true;
      log.push(`${rel}: removed <section class="page-cta">`);
    }
  }

  if (changed) {
    await writeFile(file, src, 'utf8');
    touched++;
  }
}

console.log(`${touched} files updated.`);
log.forEach((l) => console.log('  ' + l));
