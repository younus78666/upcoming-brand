import { readFile, writeFile } from 'node:fs/promises';

const targets = [
  'src/pages/pricing/index.astro',
  'src/pages/services/seo-audit/index.astro',
  'src/pages/services/wordpress-migration/index.astro',
  'src/pages/services/wordpress-seo-services/index.astro',
  'src/pages/services/wordpress-web-design/index.astro',
  'src/pages/services/wordpress-care-plans/index.astro',
  'src/pages/services/woocommerce-development/index.astro',
];

const newBlock = (cls) => `.${cls} { position: absolute; top: 14px; right: 14px; display: inline-flex; align-items: center; gap: 6px; padding: 5px 11px 5px 11px; background: var(--amber); color: var(--ink); border-radius: var(--radius-pill); font-family: var(--f-mono); font-size: 9px; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 700; white-space: nowrap; box-shadow: 0 2px 10px rgba(212, 147, 46, 0.4); z-index: 3; }`;

// Match: .X-tier-flag { ... } across newlines (non-greedy, balanced one level deep)
const re = /\.([\w-]+-tier-flag)\s*\{[^}]*\}/g;

for (const rel of targets) {
  const path = rel;
  const src = await readFile(path, 'utf8');
  let count = 0;
  const out = src.replace(re, (_m, cls) => {
    count++;
    return newBlock(cls);
  });
  if (count === 0) {
    console.log(`!! no match: ${rel}`);
  } else {
    await writeFile(path, out, 'utf8');
    console.log(`ok ${rel} (${count})`);
  }
}
