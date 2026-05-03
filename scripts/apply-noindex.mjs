// Add `noindex` prop to BaseLayout invocation in target pages.
import fs from 'node:fs';

const targets = [
  'd:/Github/Upcoming Brand/src/pages/privacy-policy/index.astro',
  'd:/Github/Upcoming Brand/src/pages/terms-and-conditions/index.astro',
  'd:/Github/Upcoming Brand/src/pages/accessibility/index.astro',
  'd:/Github/Upcoming Brand/src/pages/careers/index.astro',
  'd:/Github/Upcoming Brand/src/pages/values/index.astro',
  'd:/Github/Upcoming Brand/src/pages/team/index.astro',
  'd:/Github/Upcoming Brand/src/pages/book-a-discovery-call/index.astro',
  'd:/Github/Upcoming Brand/src/pages/tools/index.astro',
];

let touched = 0;
for (const f of targets) {
  let src = fs.readFileSync(f, 'utf8');
  if (/canonicalUrl=\{canonical\}\s*\n\s*noindex/.test(src)) {
    console.log('skip (already has noindex):', f);
    continue;
  }
  // insert `noindex` after canonicalUrl line
  const updated = src.replace(/(canonicalUrl=\{canonical\})(\s*\n)/, '$1$2  noindex$2');
  if (updated !== src) {
    fs.writeFileSync(f, updated);
    touched++;
    console.log('updated:', f);
  } else {
    console.warn('no canonicalUrl line found:', f);
  }
}
console.log(`\nDone. ${touched} files updated.`);
