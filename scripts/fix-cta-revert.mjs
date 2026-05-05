// Files where BottomFormCTA was multi-line with formSteps config — restore import,
// remove the auto-injected FinalCTA usage, since BottomFormCTA is already multi-step + dark.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(__dirname, '..', 'src');

const targets = [
  'pages/hire-wordpress-designer/index.astro',
  'pages/wordpress-agency/index.astro',
  'pages/services/seo-audit/index.astro',
  'pages/services/local-seo-maryland/index.astro',
  'pages/services/wordpress-care-plans/index.astro',
  'pages/services/wordpress-migration/index.astro',
  'pages/services/wordpress-hosting/index.astro',
  'pages/services/wordpress-seo-services/index.astro',
  'pages/services/wordpress-web-design/index.astro',
  'pages/services/woocommerce-development/index.astro',
  'pages/services/wordpress-speed-optimization/index.astro',
  'pages/services/wordpress-security/index.astro',
  'pages/services/wordpress-redesign/index.astro',
  'pages/services/wordpress-support/index.astro',
];

let changed = 0;
for (const rel of targets) {
  const full = path.join(SRC, rel.replace(/\//g, path.sep));
  if (!fs.existsSync(full)) { console.warn('skip (missing):', rel); continue; }
  let src = fs.readFileSync(full, 'utf8');
  let updated = src;

  // Restore BottomFormCTA import if we have FinalCTA pointing at the same dir
  if (!/^import BottomFormCTA from/m.test(updated)) {
    const m = updated.match(/^(import )FinalCTA( from ['"])([^'"]+)\/FinalCTA(\.astro['"];?)/m);
    if (m) {
      // Insert BottomFormCTA import on the same path
      updated = updated.replace(m[0], `${m[0]}\nimport BottomFormCTA from ${m[2]}${m[3]}/BottomFormCTA${m[4]}`);
    }
  }

  // Drop the auto-injected single-line FinalCTA right before <Footer />
  updated = updated.replace(/^[\t ]*<FinalCTA\s*\/>\s*\n/gm, '');

  // If FinalCTA import is now unused, drop it
  if (!/<FinalCTA\b/.test(updated)) {
    updated = updated.replace(/^import FinalCTA from ['"][^'"]+['"];\s*\n?/gm, '');
  }

  if (updated !== src) {
    fs.writeFileSync(full, updated);
    changed++;
    console.log('fixed:', rel);
  }
}
console.log(`\nDone. ${changed} files restored.`);
