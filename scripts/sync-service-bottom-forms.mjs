import { readFile, writeFile } from 'node:fs/promises';

const targets = [
  'src/pages/services/wordpress-seo-services/index.astro',
  'src/pages/services/wordpress-web-design/index.astro',
  'src/pages/services/wordpress-care-plans/index.astro',
  'src/pages/services/woocommerce-development/index.astro',
  'src/pages/services/wordpress-migration/index.astro',
  'src/pages/services/seo-audit/index.astro',
  'src/pages/wordpress-agency/index.astro',
  'src/pages/hire-wordpress-designer/index.astro',
];

// Extract the formSteps={[...]} array literal — bracket-counted to handle nested arrays
function extractFormSteps(src) {
  const startMarker = 'formSteps={[';
  const startIdx = src.indexOf(startMarker);
  if (startIdx === -1) return null;
  // walk forward counting brackets to find matching ]}
  let i = startIdx + startMarker.length - 1; // points to the [
  let depth = 0;
  for (; i < src.length; i++) {
    const ch = src[i];
    if (ch === '[') depth++;
    else if (ch === ']') {
      depth--;
      if (depth === 0) {
        // expect '}' right after
        if (src[i + 1] === '}') {
          // capture from formSteps={ to ]}
          return {
            text: src.slice(startIdx, i + 2),
            arrayLiteral: src.slice(startIdx + 'formSteps={'.length, i + 1), // [...]
          };
        }
      }
    }
  }
  return null;
}

let updated = 0;
for (const file of targets) {
  let src = await readFile(file, 'utf8');

  const ext = extractFormSteps(src);
  if (!ext) {
    console.log(`!! ${file}: no formSteps found`);
    continue;
  }

  // Find the BottomFormCTA call and inject formSteps if not present
  const bctaRe = /<BottomFormCTA([^/]*?)\/>/;
  const m = src.match(bctaRe);
  if (!m) {
    console.log(`!! ${file}: no BottomFormCTA found`);
    continue;
  }
  const existing = m[0];
  if (existing.includes('formSteps=')) {
    console.log(`-- ${file}: already has formSteps`);
    continue;
  }

  // Inject formSteps as a new attribute
  const injected = existing.replace('/>', `\n    formSteps={${ext.arrayLiteral}}\n  />`);
  src = src.replace(existing, injected);

  await writeFile(file, src, 'utf8');
  console.log(`ok ${file}`);
  updated++;
}

console.log(`\n${updated} files updated.`);
