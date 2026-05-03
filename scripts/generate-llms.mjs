// Post-build: generate /llms.txt (index) and /llms-full.txt (full content dump)
// from the static HTML in dist/. Excludes noindex pages.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// Vercel adapter writes static HTML to .vercel/output/static during astro build.
// During plain `astro build` it goes to dist/. Try both.
const CANDIDATES = [
  path.join(ROOT, '.vercel', 'output', 'static'),
  path.join(ROOT, 'dist'),
];
let DIST = null;
for (const c of CANDIDATES) {
  if (fs.existsSync(c) && fs.existsSync(path.join(c, 'index.html'))) {
    DIST = c;
    break;
  }
}
if (!DIST) {
  console.error('No build output found. Run `astro build` first.');
  process.exit(1);
}

const SITE = 'https://upcomingbrand.com';

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.name === 'index.html') out.push(full);
  }
  return out;
}

function urlFromFile(file) {
  const rel = path.relative(DIST, file).replace(/\\/g, '/');
  let u = '/' + rel.replace(/index\.html$/, '');
  if (u !== '/' && !u.endsWith('/')) u += '/';
  return SITE + u;
}

function parseHtml(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]+)"/i);
  const robotsMatch = html.match(/<meta\s+name="robots"\s+content="([^"]+)"/i);
  const isNoindex = robotsMatch && /noindex/i.test(robotsMatch[1]);

  // strip script + style
  let body = html.replace(/<script[\s\S]*?<\/script>/gi, '');
  body = body.replace(/<style[\s\S]*?<\/style>/gi, '');
  body = body.replace(/<!--[\s\S]*?-->/g, '');

  // try to grab <main>...</main> if it exists
  const mainMatch = body.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i);
  if (mainMatch) body = mainMatch[1];

  // remove nav, footer, header tags content
  body = body.replace(/<nav\b[\s\S]*?<\/nav>/gi, '');
  body = body.replace(/<footer\b[\s\S]*?<\/footer>/gi, '');
  body = body.replace(/<header\b[\s\S]*?<\/header>/gi, '');

  // headings (h1-h3) for outline
  const headings = [];
  body.replace(/<h([1-3])\b[^>]*>([\s\S]*?)<\/h\1>/gi, (_m, level, text) => {
    const t = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    if (t) headings.push({ level: Number(level), text: t });
    return '';
  });

  // plain text body
  const text = body
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return {
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim() : '',
    isNoindex: !!isNoindex,
    headings,
    text,
  };
}

// ---- collect pages ----
const files = walk(DIST);
const pages = [];
for (const f of files) {
  const url = urlFromFile(f);
  if (url.includes('/api/')) continue;
  const html = fs.readFileSync(f, 'utf8');
  const p = parseHtml(html);
  if (p.isNoindex) continue;
  pages.push({ url, ...p });
}

// stable order: home first, then by url
pages.sort((a, b) => {
  if (a.url === SITE + '/') return -1;
  if (b.url === SITE + '/') return 1;
  return a.url.localeCompare(b.url);
});

// ---- group helpers ----
function group(pages, prefix) {
  return pages.filter(p => p.url.startsWith(SITE + prefix));
}

// ---- llms.txt (index) ----
const home = pages.find(p => p.url === SITE + '/');
const services = group(pages, '/services/');
const industries = group(pages, '/industries/');
const locations = group(pages, '/locations/');
const work = group(pages, '/work/');
const tools = group(pages, '/tools/');
const others = pages.filter(p =>
  !p.url.startsWith(SITE + '/services/') &&
  !p.url.startsWith(SITE + '/industries/') &&
  !p.url.startsWith(SITE + '/locations/') &&
  !p.url.startsWith(SITE + '/work/') &&
  !p.url.startsWith(SITE + '/tools/') &&
  p.url !== SITE + '/'
);

let llms = '';
llms += `# Upcoming Brand\n\n`;
llms += `> WordPress web design studio based in Maryland. Fixed-scope builds, schema-first SEO, 90+ PageSpeed delivery, 6-10 week launch timelines. Serving Baltimore, Annapolis, Frederick, Rockville, Bethesda, Silver Spring, and the wider DMV metro. Remote-only operation: discovery via Zoom/Google Meet, async staging links, weekly written status updates. Specialties include LocalBusiness schema, dental/legal/medical/restaurant industry sites, location-specific Maryland SEO, and WordPress care plans with monthly Core Web Vitals reporting.\n\n`;
llms += `## Important context\n\n`;
llms += `- Founder-led studio. Every inquiry is read by the founder personally before a discovery call is booked.\n`;
llms += `- Pricing is fixed-scope, agreed before code is written. No hourly billing.\n`;
llms += `- Remote-only. No in-person meetings, no office visits, no coffee shop discoveries.\n`;
llms += `- Core Web Vitals (90+ Lighthouse) is a contractual deliverable, not a post-launch hope.\n`;
llms += `- Schema markup (LocalBusiness, FAQPage, Service, Organization) is shipped on every build.\n\n`;

if (home) {
  llms += `## Homepage\n\n`;
  llms += `- [${home.title}](${home.url}): ${home.description}\n\n`;
}

if (services.length) {
  llms += `## Services\n\n`;
  for (const p of services) llms += `- [${p.title}](${p.url}): ${p.description}\n`;
  llms += `\n`;
}
if (industries.length) {
  llms += `## Industries\n\n`;
  for (const p of industries) llms += `- [${p.title}](${p.url}): ${p.description}\n`;
  llms += `\n`;
}
if (locations.length) {
  llms += `## Locations (Maryland)\n\n`;
  for (const p of locations) llms += `- [${p.title}](${p.url}): ${p.description}\n`;
  llms += `\n`;
}
if (work.length) {
  llms += `## Case studies\n\n`;
  for (const p of work) llms += `- [${p.title}](${p.url}): ${p.description}\n`;
  llms += `\n`;
}
if (tools.length) {
  llms += `## Free tools\n\n`;
  for (const p of tools) llms += `- [${p.title}](${p.url}): ${p.description}\n`;
  llms += `\n`;
}
if (others.length) {
  llms += `## Other pages\n\n`;
  for (const p of others) llms += `- [${p.title}](${p.url}): ${p.description}\n`;
  llms += `\n`;
}

llms += `## Contact\n\n`;
llms += `- Email: hello@upcomingbrand.com\n`;
llms += `- Discovery call: https://upcomingbrand.com/contact/\n`;
llms += `- Service area: Maryland (Baltimore, Annapolis, Frederick, Rockville, Bethesda, Silver Spring, Columbia, Bowie, Towson, Hagerstown, Salisbury, and surrounding cities) plus the broader DMV metro.\n`;

fs.writeFileSync(path.join(DIST, 'llms.txt'), llms);
console.log('Wrote llms.txt:', llms.length, 'chars,', pages.length, 'pages indexed.');

// ---- llms-full.txt (full content dump) ----
let full = '';
full += `# Upcoming Brand — Full Site Content\n\n`;
full += `> Complete content dump for AI assistants. Generated ${new Date().toISOString()}.\n`;
full += `> ${pages.length} pages indexed. Excludes noindex pages.\n\n`;
full += `---\n\n`;

for (const p of pages) {
  full += `# ${p.title}\n\n`;
  full += `URL: ${p.url}\n`;
  if (p.description) full += `Description: ${p.description}\n`;
  full += `\n`;
  if (p.headings.length) {
    full += `## Outline\n\n`;
    for (const h of p.headings) {
      full += `${'#'.repeat(h.level + 1)} ${h.text}\n`;
    }
    full += `\n`;
  }
  full += `## Content\n\n`;
  full += p.text + `\n\n`;
  full += `---\n\n`;
}

fs.writeFileSync(path.join(DIST, 'llms-full.txt'), full);
console.log('Wrote llms-full.txt:', full.length, 'chars (', (full.length / 1024).toFixed(1), 'KB).');
