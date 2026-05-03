// One-shot: rewrite every <form ...> tag in src/ to use the new uc-form pipeline.
// Idempotent — safe to re-run.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..', 'src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (full.endsWith('.astro')) out.push(full);
  }
  return out;
}

const FORM_OPEN_RE = /<form\b([^>]*)>/g;
const ATTR_RE = (k) => new RegExp('\\s+' + k + '(?:="[^"]*")?', 'g');

let touched = 0;
for (const file of walk(ROOT)) {
  let src = fs.readFileSync(file, 'utf8');
  let changed = false;
  src = src.replace(FORM_OPEN_RE, (full, attrs) => {
    let a = attrs;
    // capture name attr (form identifier)
    const nameMatch = a.match(/\sname="([^"]+)"/);
    const formName = nameMatch ? nameMatch[1] : null;
    // skip forms that are clearly not user-submission (none here, but defensive)
    // strip netlify/legacy attrs
    a = a.replace(ATTR_RE('data-netlify'), '');
    a = a.replace(ATTR_RE('netlify'), '');
    a = a.replace(ATTR_RE('netlify-honeypot'), '');
    // remove old action="/thank-you/" — handled client-side now
    a = a.replace(/\s+action="\/thank-you\/?"/g, '');
    // remove redundant action="#contact" / "#anything"
    a = a.replace(/\s+action="#[^"]*"/g, '');
    // ensure data-uc-form
    if (formName && !/\sdata-uc-form=/.test(a)) {
      a += ` data-uc-form="${formName}"`;
    } else if (!formName && !/\sdata-uc-form=/.test(a)) {
      // no name? give it a generic one
      a += ` name="generic-form" data-uc-form="generic-form"`;
    }
    // ensure method POST
    if (!/\smethod=/i.test(a)) a += ' method="POST"';
    // ensure novalidate
    if (!/\snovalidate\b/.test(a)) a += ' novalidate';
    // collapse double spaces
    a = a.replace(/\s{2,}/g, ' ').replace(/\s+>/g, '>').replace(/^ +/, ' ');
    const out = `<form${a}>`;
    if (out !== full) changed = true;
    return out;
  });
  if (changed) {
    fs.writeFileSync(file, src);
    touched++;
    console.log('updated:', path.relative(ROOT, file));
  }
}
console.log(`\nDone. ${touched} files updated.`);
