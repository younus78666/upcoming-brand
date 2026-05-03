import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const LOC_DIR = 'src/pages/locations';

const dirs = (await readdir(LOC_DIR, { withFileTypes: true }))
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

let okCount = 0;
let skipCount = 0;
const skipped = [];

for (const dir of dirs) {
  const file = path.join(LOC_DIR, dir, 'index.astro');
  let src;
  try {
    src = await readFile(file, 'utf8');
  } catch {
    continue;
  }

  // Extract city + stateAbbr
  const cityMatch = src.match(/const\s+city\s*=\s*"([^"]+)"/);
  const stateMatch = src.match(/const\s+stateAbbr\s*=\s*"([^"]+)"/);
  if (!cityMatch || !stateMatch) {
    skipped.push(`${dir}: no city/state const`);
    skipCount++;
    continue;
  }
  const city = cityMatch[1];
  const stateAbbr = stateMatch[1];

  // Extract form name
  const formNameMatch = src.match(/<form[^>]*\sname="([\w-]+-inquiry)"/);
  if (!formNameMatch) {
    skipped.push(`${dir}: no form name`);
    skipCount++;
    continue;
  }
  const formName = formNameMatch[1];

  // Extract lede HTML
  const ledeMatch = src.match(/<p class="lp-hero-lede">([\s\S]*?)<\/p>/);
  if (!ledeMatch) {
    skipped.push(`${dir}: no lede`);
    skipCount++;
    continue;
  }
  // Collapse whitespace, strip leading/trailing
  let lede = ledeMatch[1].replace(/\s+/g, ' ').trim();
  // Convert HTML entities used in source
  lede = lede.replace(/&middot;/g, '·');

  // Find hero section bounds
  const heroStart = src.indexOf('<section class="lp-hero"');
  if (heroStart === -1) {
    skipped.push(`${dir}: no hero section`);
    skipCount++;
    continue;
  }
  // Find matching closing </section> by scanning forward
  // Use the comment fence after hero — look for "  </section>" followed by blank then comment fence
  const closePattern = /\n\s*<\/section>\s*\n\s*<!--/;
  const tail = src.slice(heroStart);
  const closeMatch = tail.match(closePattern);
  if (!closeMatch) {
    skipped.push(`${dir}: no section close found`);
    skipCount++;
    continue;
  }
  const heroEnd = heroStart + closeMatch.index + closeMatch[0].indexOf('</section>') + '</section>'.length;

  // H1: try to extract three lines from lp-h1
  // Default fallback if extraction fails
  let h1Block = `[
      { text: '${city}' },
      { text: 'web design that ranks,', type: 'accent' },
      { text: 'converts & keeps working.', type: 'italic' },
    ]`;

  const newHero = `<ServiceHero
    eyebrow='A studio, not a factory'
    pillText='WordPress Specialists · ${city}, ${stateAbbr}'
    h1Lines={${h1Block}}
    lead={\`${lede.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`}
    formName='${formName}'
    trustLines={['Top Rated · Upwork', '400+ projects · 12 countries', 'Remote-first · Zoom · Async']}
    hiddenFields={{ location: '${city}, ${stateAbbr}' }}
    formSteps={[
      {
        title: 'Tell us who you are',
        subtitle: 'Just your name and email. 30 seconds.',
        fields: [
          { type: 'text',  name: 'name',  label: 'Your name',     placeholder: 'Jane Smith',       required: true, autocomplete: 'name' },
          { type: 'email', name: 'email', label: 'Email address', placeholder: 'jane@company.com', required: true, autocomplete: 'email' },
        ],
      },
      {
        title: 'About your business',
        subtitle: 'Company and what you do.',
        fields: [
          { type: 'text', name: 'company', label: 'Company or brand', placeholder: 'Smith & Co.', autocomplete: 'organization' },
          { type: 'select', name: 'business_type', label: 'Business type', required: true,
            options: ['Law Firm / Attorney', 'Dental / Medical', 'Real Estate', 'Restaurant / Hospitality', 'Contractor / Trades', 'Nonprofit / Church', 'Ecommerce / Retail', 'Small Business / Startup', 'Other'] },
        ],
      },
      {
        title: 'What you need',
        subtitle: 'Which service and your budget.',
        fields: [
          { type: 'select', name: 'service_interest', label: 'Service interested in', required: true,
            options: ['New WordPress site build', 'Redesign existing site', 'WooCommerce store', 'WordPress SEO services', 'Migration to WordPress', 'Care plan / maintenance', 'SEO audit', 'Not sure yet'] },
          { type: 'select', name: 'budget', label: 'Budget range', required: true,
            options: ['Under $1,500', '$1,500 to $3,500', '$3,500 to $6,000', '$6,000 to $15,000', '$15,000+', 'Not sure yet'] },
        ],
      },
      {
        title: 'Timeline + goal',
        subtitle: 'When you need it and what success looks like.',
        fields: [
          { type: 'select', name: 'timeline', label: 'Timeline', required: true,
            options: ['ASAP, within 4 weeks', 'Standard, 6 to 10 weeks', 'Flexible, 3+ months', 'Just exploring'] },
          { type: 'textarea', name: 'message', label: 'Project goal', placeholder: 'Three sentences. We will ask the rest in the reply.', required: true, rows: 2 },
        ],
      },
    ]}
  />`;

  let out = src.slice(0, heroStart) + newHero + src.slice(heroEnd);

  // Add ServiceHero import if missing
  if (!out.includes("import ServiceHero from")) {
    out = out.replace(
      /import Footer from '\.\.\/\.\.\/\.\.\/components\/Footer\.astro';/,
      `import Footer from '../../../components/Footer.astro';\nimport ServiceHero from '../../../components/ServiceHero.astro';`
    );
  }

  await writeFile(file, out, 'utf8');
  console.log(`ok ${dir} (${city}, ${stateAbbr}) form=${formName}`);
  okCount++;
}

console.log(`\nDone. ${okCount} updated, ${skipCount} skipped.`);
if (skipped.length) console.log('Skipped:', skipped);
