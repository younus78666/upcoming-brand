// Replace BottomFormCTA with FinalCTA across the site.
// - Pages with their own inline contact form (industry pages): just REMOVE BottomFormCTA
// - All other pages: REPLACE BottomFormCTA with FinalCTA
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..', 'src');

// Paths (relative to src) where BottomFormCTA should be REMOVED only (existing dark CTA stays)
const REMOVE_ONLY = new Set([
  'pages/industries/accountant-website-design/index.astro',
  'pages/industries/church-website-design/index.astro',
  'pages/industries/contractor-website-design/index.astro',
  'pages/industries/dental-website-design/index.astro',
  'pages/industries/ecommerce-website-design/index.astro',
  'pages/industries/gym-website-design/index.astro',
  'pages/industries/law-firm-website-design/index.astro',
  'pages/industries/medical-website-design/index.astro',
  'pages/industries/nonprofit-website-design/index.astro',
  'pages/industries/real-estate-website-design/index.astro',
  'pages/industries/restaurant-website-design/index.astro',
  'pages/industries/small-business-website-design/index.astro',
].map(p => p.replace(/\//g, path.sep)));

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (full.endsWith('.astro')) out.push(full);
  }
  return out;
}

let removed = 0, replaced = 0;
for (const file of walk(SRC)) {
  let src = fs.readFileSync(file, 'utf8');
  if (!/BottomFormCTA/.test(src)) continue;

  const rel = path.relative(SRC, file);
  const isRemoveOnly = REMOVE_ONLY.has(rel);

  let updated = src;

  // Strip <BottomFormCTA ... /> usage (anywhere in template)
  updated = updated.replace(/^[\t ]*<BottomFormCTA\b[^/>]*\/>\s*\n?/gm, '');

  if (isRemoveOnly) {
    // Drop the import line too
    updated = updated.replace(/^import BottomFormCTA from ['"][^'"]+['"];\s*\n?/gm, '');
  } else {
    // Swap import to FinalCTA (preserve relative depth)
    updated = updated.replace(
      /^(import )BottomFormCTA( from ['"])([^'"]+)\/BottomFormCTA(\.astro['"];?\s*)$/gm,
      (_m, p1, p2, p3, p4) => `${p1}FinalCTA${p2}${p3}/FinalCTA${p4}`
    );
    // If FinalCTA already imported AND BottomFormCTA still imported (rare), drop the BFCTA line
    updated = updated.replace(/^import BottomFormCTA from ['"][^'"]+['"];\s*\n?/gm, '');

    // Inject <FinalCTA /> right before <Footer /> if not already present
    if (!/<FinalCTA\b/.test(updated)) {
      // Insert before the LAST <Footer /> occurrence
      const idx = updated.lastIndexOf('<Footer');
      if (idx !== -1) {
        // Find the start of that line
        const lineStart = updated.lastIndexOf('\n', idx) + 1;
        const indent = updated.slice(lineStart, idx);
        updated = updated.slice(0, lineStart) + `${indent}<FinalCTA />\n` + updated.slice(lineStart);
      }
    }
  }

  if (updated !== src) {
    fs.writeFileSync(file, updated);
    if (isRemoveOnly) { removed++; console.log('removed BFCTA:', rel); }
    else { replaced++; console.log('replaced w/ FinalCTA:', rel); }
  }
}
console.log(`\nDone. ${removed} files cleaned (industry), ${replaced} files swapped to FinalCTA.`);
