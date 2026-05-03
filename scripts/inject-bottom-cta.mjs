import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import { readdir } from 'node:fs/promises';

async function walk(dir, files = []) {
  const ents = await readdir(dir, { withFileTypes: true });
  for (const e of ents) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, files);
    else if (e.name === 'index.astro') files.push(full);
  }
  return files;
}

const SKIP = new Set([
  'src/pages/contact/index.astro',
  'src/pages/book-a-discovery-call/index.astro',
]);

// Derive a unique form-name slug from the file path
function deriveFormName(filePath) {
  const rel = filePath.replace(/\\/g, '/');
  if (rel === 'src/pages/index.astro') return 'home-cta';
  // Take the last directory segment as the slug
  const parts = rel.split('/');
  const slug = parts[parts.length - 2];
  // Strip generic suffixes for cleaner names
  const cleaned = slug
    .replace(/-web-design$/, '')
    .replace(/-website-design$/, '');
  return `${cleaned}-cta`;
}

// Compute relative import path from page file to BottomFormCTA
function relativeImportPath(filePath) {
  const rel = filePath.replace(/\\/g, '/');
  const parts = rel.split('/');
  const depth = parts.length - 2;
  const back = '../'.repeat(depth - 1);
  return `${back}components/BottomFormCTA.astro`;
}

const files = await walk('src/pages');

let updated = 0;
let skipped = 0;
const errors = [];

for (const file of files) {
  const rel = file.replace(/\\/g, '/');
  if (SKIP.has(rel)) { skipped++; continue; }

  let src = await readFile(file, 'utf8');

  if (src.includes('BottomFormCTA')) { skipped++; continue; }

  // Find </BaseLayout> position
  const closeIdx = src.lastIndexOf('</BaseLayout>');
  if (closeIdx === -1) {
    errors.push(`${rel}: no </BaseLayout>`);
    continue;
  }

  // Find <Footer /> right before it (preferred insert point)
  const footerIdx = src.lastIndexOf('<Footer />', closeIdx);
  let insertIdx;
  let insertContent;

  const formName = deriveFormName(file);
  const importPath = relativeImportPath(file);

  if (footerIdx !== -1) {
    insertIdx = footerIdx;
    insertContent = `  <BottomFormCTA formName="${formName}" />\n\n  `;
  } else {
    insertIdx = closeIdx;
    insertContent = `  <BottomFormCTA formName="${formName}" />\n`;
  }

  // Add import line
  // Find the last existing import in the frontmatter
  const fmEnd = src.indexOf('---', 3);
  if (fmEnd === -1) { errors.push(`${rel}: no frontmatter close`); continue; }
  const frontmatter = src.slice(0, fmEnd);
  const importMatch = frontmatter.match(/import [^\n]+\.astro['"];?\s*\n/g);
  let updatedFm;
  if (importMatch) {
    const lastImport = importMatch[importMatch.length - 1];
    const lastImportIdx = frontmatter.lastIndexOf(lastImport);
    const insertAt = lastImportIdx + lastImport.length;
    updatedFm = frontmatter.slice(0, insertAt) + `import BottomFormCTA from '${importPath}';\n` + frontmatter.slice(insertAt);
  } else {
    // Inject right after opening ---
    updatedFm = frontmatter.replace(/^---\n/, `---\nimport BottomFormCTA from '${importPath}';\n`);
  }

  // Compose new file
  const body = src.slice(fmEnd);
  let out = updatedFm + body;

  // Re-find insertIdx in `out` (offsets shifted)
  const newCloseIdx = out.lastIndexOf('</BaseLayout>');
  const newFooterIdx = out.lastIndexOf('<Footer />', newCloseIdx);
  if (newFooterIdx !== -1) {
    out = out.slice(0, newFooterIdx) + `<BottomFormCTA formName="${formName}" />\n\n  ` + out.slice(newFooterIdx);
  } else {
    out = out.slice(0, newCloseIdx) + `<BottomFormCTA formName="${formName}" />\n` + out.slice(newCloseIdx);
  }

  await writeFile(file, out, 'utf8');
  console.log(`ok ${rel} → ${formName} (import: ${importPath})`);
  updated++;
}

console.log(`\nDone. ${updated} updated, ${skipped} skipped.`);
if (errors.length) { console.log('Errors:'); errors.forEach((e) => console.log('  ' + e)); }
