export const prerender = false;

import type { APIRoute } from 'astro';
import nodemailer from 'nodemailer';

// ---------- config ----------
const ADMIN_TO = 'hello@upcomingbrand.com';
const FROM_NAME = 'Upcoming Brand';
const FROM_EMAIL = 'hello@upcomingbrand.com';
const RECAPTCHA_SECRET = import.meta.env.RECAPTCHA_SECRET || process.env.RECAPTCHA_SECRET || '';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.titan.email';
const SMTP_PORT = Number(process.env.SMTP_PORT || 465);
const SMTP_USER = process.env.SMTP_USER || '';
const SMTP_PASS = process.env.SMTP_PASS || '';

// ---------- subject lines per form ----------
const SUBJECT_MAP: Record<string, string> = {
  'contact':                    'New contact inquiry',
  'hero-inquiry':               'New homepage hero lead',
  'bottom-cta':                 'New CTA inquiry',
  'tools-cta':                  'New tools-page request',
  'services-cta':               'New services-page inquiry',
  'pricing-cta':                'New pricing-page inquiry',
  'reviews-cta':                'New reviews-page inquiry',
  'about-cta':                  'New about-page inquiry',
  'work-cta':                   'New portfolio inquiry',
  'industries-cta':             'New industries-page inquiry',
  'locations-cta':              'New locations-page inquiry',
  'process-cta':                'New process-page inquiry',
  'team-cta':                   'New team-page inquiry',
  'careers-cta':                'New careers application',
  'discovery-call':             'New discovery call booking',
  'hire-designer':              'New hire-designer inquiry',
  'wp-agency-cta':              'New WP agency inquiry',
  // industries
  'accountant-inquiry':         'New accountant-website lead',
  'church-inquiry':             'New church-website lead',
  'contractor-inquiry':         'New contractor-website lead',
  'dental-inquiry':             'New dental-website lead',
  'ec-inquiry':                 'New ecommerce-website lead',
  'gym-inquiry':                'New gym-website lead',
  'lawfirm-inquiry':            'New law-firm-website lead',
  'medical-inquiry':            'New medical-website lead',
  'nonprofit-inquiry':          'New nonprofit-website lead',
  'realestate-inquiry':         'New real-estate-website lead',
  'restaurant-inquiry':         'New restaurant-website lead',
  'smallbiz-inquiry':           'New small-business-website lead',
  // contact-on-page (industry pages footer forms)
  'contact-accountant':         'Industry contact: accountant',
  'contact-church':             'Industry contact: church',
  'contact-contractor':         'Industry contact: contractor',
  'contact-dental':             'Industry contact: dental',
  'contact-ecommerce':          'Industry contact: ecommerce',
  'contact-gym':                'Industry contact: gym',
  'contact-lawfirm':            'Industry contact: law firm',
  'contact-medical':            'Industry contact: medical',
  'contact-nonprofit':          'Industry contact: nonprofit',
  'contact-realestate':         'Industry contact: real estate',
  'contact-restaurant':         'Industry contact: restaurant',
  'contact-smallbiz':           'Industry contact: small business',
  // services
  'service-inquiry':            'New service inquiry',
  'service-seo-audit':          'New SEO audit request',
  'service-care-plan':          'New care-plan inquiry',
  'service-hosting':            'New hosting inquiry',
  'service-migration':          'New migration inquiry',
  'service-redesign':           'New redesign inquiry',
  'service-security':           'New security inquiry',
  'service-seo':                'New SEO services inquiry',
  'service-speed':              'New speed-optimization inquiry',
  'service-support':            'New support-plan inquiry',
  'service-webdesign':          'New web-design inquiry',
  'service-woocommerce':        'New WooCommerce inquiry',
  'service-localseo':           'New local-SEO inquiry',
  // tools
  'installment-calculator':     'Installment calculator lead',
  'schema-generator':           'Schema generator follow-up',
};

// ---------- helpers ----------
function getSubject(formName: string, name: string): string {
  const base = SUBJECT_MAP[formName] || `Form submission: ${formName}`;
  const who = name ? ` from ${name}` : '';
  return `${base}${who}`;
}

// Cyrillic (Russian, Ukrainian, etc) + CJK (Chinese, Japanese, Korean Hangul)
const BLOCKED_LANG_RE = /[Ѐ-ӿԀ-ԯ぀-ヿㇰ-ㇿ㐀-䶿一-鿿가-힯豈-﫿]/;
function containsBlockedLanguage(...fields: string[]): boolean {
  return fields.some(f => f && BLOCKED_LANG_RE.test(f));
}

async function verifyRecaptcha(token: string, ip: string): Promise<{ ok: boolean; reason?: string }> {
  if (!RECAPTCHA_SECRET) return { ok: false, reason: 'recaptcha_secret_missing' };
  if (!token) return { ok: false, reason: 'no_token' };
  try {
    const body = new URLSearchParams({ secret: RECAPTCHA_SECRET, response: token, remoteip: ip });
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data: any = await res.json();
    if (data.success) return { ok: true };
    return { ok: false, reason: (data['error-codes'] || []).join(',') || 'failed' };
  } catch (e: any) {
    return { ok: false, reason: 'fetch_error: ' + (e.message || 'unknown') };
  }
}

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for') || '';
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || '';
}

function escapeHtml(s: string): string {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ---------- email templates ----------
function adminEmailHtml(opts: {
  formName: string; fields: Record<string, string>; pageUrl: string; ip: string; ua: string; ts: string;
}): string {
  const rows = Object.entries(opts.fields)
    .filter(([k]) => !['g-recaptcha-response', 'bot-field', '_recaptcha', '_form'].includes(k))
    .map(([k, v]) => `<tr><td style="padding:6px 12px 6px 0;color:#7a6a4a;font:600 12px monospace;text-transform:uppercase;letter-spacing:.08em;vertical-align:top;">${escapeHtml(k)}</td><td style="padding:6px 0;color:#1a1208;font:400 14px/1.5 system-ui;white-space:pre-wrap;">${escapeHtml(v)}</td></tr>`)
    .join('');
  return `<!doctype html><html><body style="margin:0;background:#f6efe1;font-family:system-ui,sans-serif;">
<div style="max-width:600px;margin:24px auto;background:#fdf8ec;border:1px solid #e6d9bb;border-radius:12px;padding:32px;">
  <div style="font:500 11px monospace;letter-spacing:.18em;text-transform:uppercase;color:#8a6a1e;margin-bottom:8px;">New form submission</div>
  <h1 style="margin:0 0 20px;font:600 22px/1.2 Georgia,serif;color:#1a1208;">${escapeHtml(opts.formName)}</h1>
  <table style="width:100%;border-collapse:collapse;border-top:1px dashed #e6d9bb;">${rows}</table>
  <div style="margin-top:24px;padding-top:16px;border-top:1px dashed #e6d9bb;font:400 12px/1.6 monospace;color:#7a6a4a;">
    <div><strong style="color:#1a1208;">Page URL:</strong> ${escapeHtml(opts.pageUrl)}</div>
    <div><strong style="color:#1a1208;">IP:</strong> ${escapeHtml(opts.ip)}</div>
    <div><strong style="color:#1a1208;">User Agent:</strong> ${escapeHtml(opts.ua)}</div>
    <div><strong style="color:#1a1208;">Submitted:</strong> ${escapeHtml(opts.ts)}</div>
    <div><strong style="color:#1a1208;">Form name:</strong> ${escapeHtml(opts.formName)}</div>
  </div>
</div></body></html>`;
}

function thankYouHtml(firstName: string): string {
  const name = firstName || 'there';
  return `<!doctype html><html><body style="margin:0;background:#f6efe1;font-family:system-ui,sans-serif;">
<div style="max-width:560px;margin:32px auto;background:#fdf8ec;border:1px solid #e6d9bb;border-radius:14px;padding:40px 36px;">
  <div style="font:500 11px monospace;letter-spacing:.2em;text-transform:uppercase;color:#8a6a1e;margin-bottom:14px;">Upcoming Brand</div>
  <h1 style="margin:0 0 18px;font:500 28px/1.15 Georgia,serif;color:#1a1208;letter-spacing:-0.02em;">Thanks, ${escapeHtml(name)}.</h1>
  <p style="font:400 16px/1.6 system-ui;color:#3a2e1c;margin:0 0 16px;">Your message just landed in my inbox. I read every single one personally — no auto-routing, no junior account managers.</p>
  <p style="font:400 16px/1.6 system-ui;color:#3a2e1c;margin:0 0 16px;"><strong>What happens next:</strong></p>
  <ol style="font:400 16px/1.7 system-ui;color:#3a2e1c;margin:0 0 22px;padding-left:22px;">
    <li>Within one business day, you will get a real reply from me with thoughts on your project.</li>
    <li>If it is a fit, we will book a 30-minute discovery call (Zoom or Google Meet, your pick).</li>
    <li>If it is not a fit, I will tell you and point you to someone better. No pretending.</li>
  </ol>
  <p style="font:400 16px/1.6 system-ui;color:#3a2e1c;margin:0 0 24px;">In the meantime, if anything urgent comes up, just reply to this email.</p>
  <div style="border-top:1px dashed #e6d9bb;padding-top:20px;margin-top:28px;font:400 14px/1.6 system-ui;color:#7a6a4a;">
    <div style="font-style:italic;color:#8a6a1e;">Looking forward to it,</div>
    <div style="margin-top:6px;color:#1a1208;font-weight:600;">The Upcoming Brand team</div>
    <div style="margin-top:14px;font:400 12px monospace;letter-spacing:.06em;color:#9a8a6a;">
      <a href="https://upcomingbrand.com/" style="color:#8a6a1e;text-decoration:none;">upcomingbrand.com</a>
      &nbsp;&middot;&nbsp;
      <a href="mailto:hello@upcomingbrand.com" style="color:#8a6a1e;text-decoration:none;">hello@upcomingbrand.com</a>
    </div>
  </div>
</div></body></html>`;
}

// ---------- naive in-memory rate limit (per warm instance) ----------
const rateMap = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const window = 60 * 60 * 1000; // 1h
  const max = 8;
  const e = rateMap.get(ip);
  if (!e || e.resetAt < now) {
    rateMap.set(ip, { count: 1, resetAt: now + window });
    return false;
  }
  e.count++;
  if (e.count > max) return true;
  return false;
}

// ---------- handler ----------
export const POST: APIRoute = async ({ request }) => {
  const ts = new Date().toISOString();
  const ip = getClientIp(request) || 'unknown';
  const ua = request.headers.get('user-agent') || '';

  let payload: Record<string, string> = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      payload = await request.json();
    } else {
      const fd = await request.formData();
      fd.forEach((v, k) => { payload[k] = String(v); });
    }
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad_payload' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  // honeypot
  if ((payload['bot-field'] || payload['_gotcha'] || '').trim() !== '') {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  // rate limit
  if (rateLimited(ip)) {
    return new Response(JSON.stringify({ ok: false, error: 'rate_limit' }), { status: 429, headers: { 'content-type': 'application/json' } });
  }

  // language filter (silent reject so attackers don't tune)
  const blockedFields = [payload.name || '', payload.message || '', payload.email || '', payload.notes || '', payload.details || ''];
  if (containsBlockedLanguage(...blockedFields)) {
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
  }

  // recaptcha
  const token = payload['g-recaptcha-response'] || payload['recaptcha'] || '';
  const cap = await verifyRecaptcha(token, ip);
  if (!cap.ok) {
    return new Response(JSON.stringify({ ok: false, error: 'recaptcha_failed', reason: cap.reason }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  const formName = (payload['form-name'] || payload['_form'] || payload['formName'] || 'unknown').toString().trim();
  const userEmail = (payload.email || '').trim();
  const userName = (payload.name || payload['first-name'] || payload.firstName || '').trim();
  const firstName = userName.split(/\s+/)[0] || '';
  const pageUrl = (payload['page-url'] || request.headers.get('referer') || '').toString();

  // build SMTP transport
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  // admin email
  try {
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to: ADMIN_TO,
      replyTo: userEmail || undefined,
      subject: getSubject(formName, userName),
      html: adminEmailHtml({ formName, fields: payload, pageUrl, ip, ua, ts }),
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ ok: false, error: 'admin_send_failed', detail: e.message }), { status: 500, headers: { 'content-type': 'application/json' } });
  }

  // thank-you to user (only if valid email)
  if (userEmail && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(userEmail)) {
    try {
      await transporter.sendMail({
        from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
        to: userEmail,
        subject: `Thanks ${firstName ? firstName + ', ' : ''}your Upcoming Brand inquiry is in`,
        html: thankYouHtml(firstName),
      });
    } catch {
      // do not fail the user flow if branded reply bounces
    }
  }

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } });
};

export const GET: APIRoute = () => new Response('Method Not Allowed', { status: 405 });
