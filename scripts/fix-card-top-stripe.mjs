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

const files = await walkAll('src');
let totalChanged = 0;
const log = [];

for (const f of files) {
  let src = await readFile(f, 'utf8');
  let changed = false;

  // PATTERN A: ::before with top:0 that draws a top stripe with border-radius
  // Remove the border-radius declarations on these stripes since the parent
  // will have overflow:hidden and the stripe should sit flush.
  // Match: .X::before { content: ""; ... border-radius: ...; }
  // Specifically the ones with top: 0 AND border-radius having "0 0" or "var(--radius-lg) var(--radius-lg) 0 0"
  const stripeRe = /(\.[\w-]+::before\s*\{\s*content:\s*""[^}]*?top:\s*0[^}]*?)border-radius:\s*var\(--radius-lg\)\s*var\(--radius-lg\)\s*0\s*0;\s*/g;
  if (stripeRe.test(src)) {
    src = src.replace(stripeRe, '$1');
    changed = true;
    log.push(`${f}: removed border-radius from ::before stripe`);
  }

  // PATTERN B: ensure the parent card has overflow: hidden
  // Look for cards that have a ::before stripe paired with them. Each *-define-card,
  // *-notice, *-tier-highlight needs overflow:hidden on the parent.
  // We extract the selector base from any matched ::before and ensure parent has overflow:hidden
  const beforeMatches = [...src.matchAll(/(\.[\w-]+)::before\s*\{\s*content:\s*""[^}]*?top:\s*0[^}]*?height:\s*3px[^}]*?background:[^}]*?(?:var\(--amber\)|linear-gradient)/g)];
  const parentSelectors = [...new Set(beforeMatches.map((m) => m[1]))];

  for (const sel of parentSelectors) {
    // find the parent rule: `.X { ... }` (not `::before`)
    // we need to insert overflow: hidden if not already present
    const parentRuleRe = new RegExp(`(${sel.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&')}\\s*\\{[^}]*?)(\\})`, 's');
    const m = src.match(parentRuleRe);
    if (m && !m[1].includes('overflow:')) {
      // add `overflow: hidden;` before the closing brace
      src = src.replace(parentRuleRe, (_full, body, close) => `${body.trimEnd()} overflow: hidden; ${close}`);
      changed = true;
      log.push(`${f}: added overflow:hidden to ${sel}`);
    }
  }

  if (changed) {
    await writeFile(f, src, 'utf8');
    totalChanged++;
  }
}

console.log(`${totalChanged} files updated.`);
log.forEach((l) => console.log('  ' + l.replace(/\\/g, '/')));
