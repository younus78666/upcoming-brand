import { readFile, writeFile } from 'node:fs/promises';

const updates = [
  {
    file: 'src/pages/industries/law-firm-website-design/index.astro',
    title: { from: 'Law Firm Website Design Maryland | Upcoming Brand', to: 'Law Firm Website Design + Attorney Website Design Service | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland law firms. LegalService schema, intake forms, practice area pages, 90+ PageSpeed. Fixed-scope from $1,500. Baltimore.',
             to: 'Senior law firm website design and attorney website design service. LegalService schema, intake forms, practice area pages, 90+ Lighthouse. Maryland-based, US-wide remote. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/dental-website-design/index.astro',
    title: { from: 'Dental Practice Website Design Maryland | Upcoming Brand', to: 'Dental Website Design + Dentist Website Design Service | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland dental practices. Dentist schema, online booking, 90+ PageSpeed. Fixed-scope from $1,500. Baltimore, Annapolis, Frederick.',
             to: 'Senior dental website design and dentist website design service. Dentist schema, MedicalProcedure markup, online booking integration, 90+ Lighthouse. Maryland-based, US-wide remote. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/medical-website-design/index.astro',
    title: { from: 'Medical Practice Website Design Maryland | Upcoming Brand', to: 'Medical Website Design + Doctor Website Design Service | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland medical practices. Physician schema, online booking, 90+ PageSpeed. Fixed-scope from $1,500. Baltimore, Annapolis.',
             to: 'Senior medical website design and doctor website design service. Physician schema, MedicalClinic markup, online booking, HIPAA-aware forms, 90+ Lighthouse. Maryland-based, US-wide remote. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/real-estate-website-design/index.astro',
    title: { from: 'Real Estate Website Design Maryland | Upcoming Brand', to: 'Real Estate Website Design + Realtor Website Design Service | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland real estate agents. RealEstateAgent schema, IDX/Bright MLS integration, 90+ PageSpeed. Fixed-scope from $1,500.',
             to: 'Senior real estate website design and realtor website design service. RealEstateAgent schema, IDX Broker / Bright MLS integration, neighborhood pages, 90+ Lighthouse. Maryland-based, US-wide remote. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/contractor-website-design/index.astro',
    title: { from: 'Contractor Website Design Maryland | Upcoming Brand', to: 'Contractor Website Design Service | Trades + Home Services WordPress | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland contractors. HomeAndConstructionBusiness schema, service area pages, 90+ PageSpeed. Fixed-scope from $1,500. Baltimore.',
             to: 'Senior contractor website design service for trades and home services businesses. HomeAndConstructionBusiness schema, service-area pages, quote calculators, 90+ Lighthouse. Maryland + US-wide remote. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/restaurant-website-design/index.astro',
    title: { from: 'Restaurant Website Design Maryland | Upcoming Brand', to: 'Restaurant Website Design Service | Menu Schema + Online Ordering | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland restaurants. Restaurant schema, OpenTable integration, online ordering, and 90+ PageSpeed. Fixed-scope from $1,500. Serving Baltimore.',
             to: 'Senior restaurant website design service. Restaurant schema, Menu markup, OpenTable / Toast integration, online ordering, multi-location support, 90+ Lighthouse. Maryland + US-wide remote. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/nonprofit-website-design/index.astro',
    title: { from: 'Nonprofit Website Design Maryland | Upcoming Brand', to: 'Nonprofit Website Design Service | NGO + Foundation WordPress | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland nonprofits and charities. NonprofitOrganization schema, GiveWP donation integration, volunteer signup. Fixed-scope from $1,500.',
             to: 'Senior nonprofit website design service for NGOs, foundations, and charities. NGO schema, GiveWP / Donorbox donation integration, volunteer signup, WCAG AA accessibility, 90+ Lighthouse. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/church-website-design/index.astro',
    title: { from: 'Church &amp; Faith Website Design Maryland | Upcoming Brand', to: 'Church Website Design Service | Sermon Archive + Online Giving | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland churches. Sermon archives, event calendars, online giving, 90+ PageSpeed. Fixed-scope from $1,500. Baltimore, Annapolis.',
             to: 'Senior church website design service for faith communities. Church schema, sermon archive with structured data, event calendars, Tithely / Pushpay integration, 90+ Lighthouse. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/gym-website-design/index.astro',
    title: { from: 'Gym & Fitness Website Design Maryland | Upcoming Brand', to: 'Gym Website Design + Fitness Website Design Service | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland gyms and fitness studios. Class booking, membership signup, 90+ PageSpeed. Fixed-scope from $1,500. Baltimore, Annapolis.',
             to: 'Senior gym website design and fitness website design service. SportsActivityLocation schema, MindBody / Glofox / Mariana Tek integration, class booking, membership signup, 90+ Lighthouse. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/ecommerce-website-design/index.astro',
    title: { from: 'Ecommerce Website Design Maryland | WooCommerce Experts', to: 'Ecommerce Website Design Service | Online Store + WooCommerce Experts | Upcoming Brand' },
    desc:  { from: 'Ecommerce website design for Maryland businesses. WooCommerce with product schema, Stripe/PayPal checkout, 90+ PageSpeed. Fixed-scope from $1,500. Baltimore.',
             to: 'Senior ecommerce website design and online store website design service. Custom WooCommerce builds, Product schema across catalog, Stripe / PayPal / Authorize.net integration, subscriptions, 90+ Lighthouse. Fixed-scope from $4,500.' },
  },
  {
    file: 'src/pages/industries/accountant-website-design/index.astro',
    title: { from: 'Accounting Firm Website Design Maryland | Upcoming Brand', to: 'Accountant Website Design + CPA Website Design Service | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland accountants and CPA firms. AccountingService schema, client portal integration, 90+ PageSpeed. Fixed-scope from $1,500.',
             to: 'Senior accountant website design and CPA website design service. AccountingService schema, secure client portal integration, tax-season landing pages, 90+ Lighthouse. Maryland + US-wide remote. Fixed-scope from $1,500.' },
  },
  {
    file: 'src/pages/industries/small-business-website-design/index.astro',
    title: { from: 'Small Business Website Design Maryland | Upcoming Brand', to: 'Small Business Website Design Service | Maryland + US-Wide Remote | Upcoming Brand' },
    desc:  { from: 'WordPress website design for Maryland small businesses. LocalBusiness schema, lead generation forms, 90+ PageSpeed. Fixed-scope from $1,500. Baltimore.',
             to: 'Senior small business website design and small business web design service. LocalBusiness schema, lead generation forms, Google Business Profile setup, 90+ Lighthouse. Maryland-based, US-wide remote. Fixed-scope from $1,500.' },
  },
];

let updated = 0;
let errors = [];
for (const u of updates) {
  let src = await readFile(u.file, 'utf8');
  let changed = false;
  if (src.includes(u.title.from)) {
    src = src.replace(u.title.from, u.title.to);
    changed = true;
  } else {
    errors.push(`title not found in ${u.file}`);
  }
  if (src.includes(u.desc.from)) {
    src = src.replace(u.desc.from, u.desc.to);
    changed = true;
  } else {
    errors.push(`desc not found in ${u.file}`);
  }
  if (changed) {
    await writeFile(u.file, src, 'utf8');
    console.log(`ok ${u.file}`);
    updated++;
  }
}
console.log(`\n${updated} files updated.`);
if (errors.length) {
  console.log('Errors:');
  errors.forEach((e) => console.log('  ' + e));
}
