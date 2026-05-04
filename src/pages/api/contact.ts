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
  <div style="text-align:left;margin-bottom:18px;padding-bottom:14px;border-bottom:1px dashed #e6d9bb;">
    <img src="https://www.upcomingbrand.com/02-footer-logo-dark-edited.png" alt="Upcoming Brand" width="140" style="display:inline-block;max-width:140px;height:auto;" />
  </div>
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
  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>Thanks, ${escapeHtml(name)}</title>
</head>
<body style="margin:0;padding:0;background:#f4efe6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4efe6;padding:24px 12px;">
  <tr>
    <td align="center">

      <!-- =============== EMAIL CONTAINER =============== -->
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(15,20,25,0.08);">

        <!-- ========== 1. HERO (BLACK) ========== -->
        <tr>
          <td style="background:#0F1419;padding:44px 40px 40px;text-align:center;">
            <img src="https://www.upcomingbrand.com/02-footer-logo-dark-edited.png" alt="Upcoming Brand" width="180" style="display:block;margin:0 auto 24px;max-width:180px;height:auto;" />
            <div style="font:500 11px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.22em;text-transform:uppercase;color:#D4932E;margin-bottom:14px;">Message received</div>
            <h1 style="margin:0 0 14px;font:500 32px/1.1 Georgia,'Times New Roman',serif;color:#F4EFE6;letter-spacing:-0.025em;">Thanks, ${escapeHtml(name)}.</h1>
            <p style="margin:0 auto;font:400 16px/1.6 -apple-system,sans-serif;color:rgba(244,239,230,0.78);max-width:440px;">Your message just landed in our inbox. We read every single inquiry personally. No auto-routing. No junior account managers.</p>

            <!-- confirmation pills -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px auto 0;">
              <tr>
                <td style="padding:6px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="background:rgba(244,239,230,0.08);border:1px solid rgba(244,239,230,0.16);border-radius:999px;padding:6px 14px 6px 8px;">
                    <tr>
                      <td style="padding-right:8px;line-height:0;"><span style="display:inline-block;width:18px;height:18px;background:#D4932E;border-radius:50%;text-align:center;line-height:18px;color:#0F1419;font:700 11px sans-serif;">&#10003;</span></td>
                      <td style="font:500 11px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.06em;color:#F4EFE6;white-space:nowrap;">Submission confirmed</td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <!-- BIG CALL/WHATSAPP CTA in hero -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px auto 0;">
              <tr>
                <td style="padding:0;text-align:center;">
                  <div style="font:500 11px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;color:rgba(244,239,230,0.55);margin-bottom:10px;">Need to talk now?</div>
                  <a href="tel:+12402092757" style="display:inline-block;font:700 26px/1.1 Georgia,'Times New Roman',serif;color:#D4932E;text-decoration:none;letter-spacing:-0.01em;">+1 (240) 209 2757</a>
                  <div style="margin-top:12px;">
                    <a href="https://wa.me/12402092757?text=Hi%20Upcoming%20Brand%2C%20I%20just%20sent%20you%20an%20inquiry." style="display:inline-block;background:#25D366;color:#FFFFFF;font:700 12px/1 -apple-system,sans-serif;letter-spacing:.06em;text-decoration:none;border-radius:999px;padding:11px 18px;">&#9742; WhatsApp us</a>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ========== 2. TRUST STRIP (CREAM-SOFT) ========== -->
        <tr>
          <td style="background:#EAE3D4;padding:28px 32px;border-top:1px solid rgba(15,20,25,0.06);border-bottom:1px solid rgba(15,20,25,0.06);">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="50%" style="padding:6px 8px;text-align:center;border-right:1px dashed rgba(15,20,25,0.14);">
                  <div style="font:500 28px/1 Georgia,serif;color:#A86F1F;letter-spacing:-0.02em;margin-bottom:6px;">5.0</div>
                  <div style="font:600 10px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:#0F1419;">Average rating</div>
                </td>
                <td width="50%" style="padding:6px 8px;text-align:center;">
                  <div style="font:500 28px/1 Georgia,serif;color:#A86F1F;letter-spacing:-0.02em;margin-bottom:6px;">90+</div>
                  <div style="font:600 10px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:#0F1419;">Lighthouse</div>
                </td>
              </tr>
              <tr><td colspan="2" style="height:14px;line-height:14px;border-top:1px dashed rgba(15,20,25,0.14);"></td></tr>
              <tr>
                <td width="50%" style="padding:6px 8px;text-align:center;border-right:1px dashed rgba(15,20,25,0.14);">
                  <div style="font:500 24px/1 Georgia,serif;color:#A86F1F;letter-spacing:-0.02em;margin-bottom:6px;">1 day</div>
                  <div style="font:600 10px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:#0F1419;">Reply time</div>
                </td>
                <td width="50%" style="padding:6px 8px;text-align:center;">
                  <div style="font:500 24px/1 Georgia,serif;color:#A86F1F;letter-spacing:-0.02em;margin-bottom:6px;">60-90d</div>
                  <div style="font:600 10px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.16em;text-transform:uppercase;color:#0F1419;">Local Pack</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ========== 3. WHAT HAPPENS NEXT (PAPER) ========== -->
        <tr>
          <td style="background:#FBF8F2;padding:48px 40px 36px;">
            <div style="font:600 11px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;color:#A86F1F;margin-bottom:10px;text-align:center;">The next 24 hours</div>
            <h2 style="margin:0 0 8px;font:500 26px/1.15 Georgia,serif;color:#0F1419;letter-spacing:-0.02em;text-align:center;">What happens next</h2>
            <p style="margin:0 0 28px;font:400 14px/1.55 -apple-system,sans-serif;color:#4A5561;text-align:center;">A clear, predictable process. No surprises.</p>

            <!-- step 01 -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4EFE6;border:1px solid rgba(15,20,25,0.10);border-radius:12px;margin-bottom:12px;">
              <tr>
                <td width="56" valign="top" style="padding:20px 0 20px 22px;">
                  <span style="display:inline-block;font:700 11px/1 'SF Mono',Consolas,monospace;letter-spacing:.08em;color:#A86F1F;background:#FBF8F2;border:1px solid rgba(15,20,25,0.10);padding:7px 10px;border-radius:6px;">01</span>
                </td>
                <td style="padding:20px 22px 20px 16px;">
                  <h3 style="margin:0 0 4px;font:600 16px/1.25 Georgia,serif;color:#0F1419;letter-spacing:-0.01em;">Within one business day</h3>
                  <p style="margin:0;font:400 13.5px/1.6 -apple-system,sans-serif;color:#4A5561;">You will get a real reply from us with thoughts on your project. Specific. Useful. Not a templated "thanks for reaching out."</p>
                </td>
              </tr>
            </table>

            <!-- step 02 -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4EFE6;border:1px solid rgba(15,20,25,0.10);border-radius:12px;margin-bottom:12px;">
              <tr>
                <td width="56" valign="top" style="padding:20px 0 20px 22px;">
                  <span style="display:inline-block;font:700 11px/1 'SF Mono',Consolas,monospace;letter-spacing:.08em;color:#A86F1F;background:#FBF8F2;border:1px solid rgba(15,20,25,0.10);padding:7px 10px;border-radius:6px;">02</span>
                </td>
                <td style="padding:20px 22px 20px 16px;">
                  <h3 style="margin:0 0 4px;font:600 16px/1.25 Georgia,serif;color:#0F1419;letter-spacing:-0.01em;">If it is a fit, we book a call</h3>
                  <p style="margin:0;font:400 13.5px/1.6 -apple-system,sans-serif;color:#4A5561;">30-minute discovery call on Zoom or Google Meet. Your pick. We come prepared with questions specific to your business — not a generic agency pitch deck.</p>
                </td>
              </tr>
            </table>

            <!-- step 03 -->
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4EFE6;border:1px solid rgba(15,20,25,0.10);border-radius:12px;">
              <tr>
                <td width="56" valign="top" style="padding:20px 0 20px 22px;">
                  <span style="display:inline-block;font:700 11px/1 'SF Mono',Consolas,monospace;letter-spacing:.08em;color:#A86F1F;background:#FBF8F2;border:1px solid rgba(15,20,25,0.10);padding:7px 10px;border-radius:6px;">03</span>
                </td>
                <td style="padding:20px 22px 20px 16px;">
                  <h3 style="margin:0 0 4px;font:600 16px/1.25 Georgia,serif;color:#0F1419;letter-spacing:-0.01em;">If it is not a fit, we tell you</h3>
                  <p style="margin:0;font:400 13.5px/1.6 -apple-system,sans-serif;color:#4A5561;">And we point you to someone better suited. No pretending. No sunk-cost agreements. Your time matters.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ========== 4. REVIEW (CREAM) ========== -->
        <tr>
          <td style="background:#F4EFE6;padding:48px 40px;border-top:1px solid rgba(15,20,25,0.06);border-bottom:1px solid rgba(15,20,25,0.06);">
            <div style="font:600 11px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;color:#A86F1F;margin-bottom:10px;text-align:center;">5.0 average rating</div>
            <h2 style="margin:0 0 24px;font:500 24px/1.2 Georgia,serif;color:#0F1419;letter-spacing:-0.02em;text-align:center;">What clients say</h2>

            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FBF8F2;border:1px solid rgba(15,20,25,0.10);border-radius:12px;">
              <tr>
                <td style="padding:26px 26px 22px;">
                  <div style="margin-bottom:14px;font:400 16px/1 sans-serif;color:#D4932E;letter-spacing:0.1em;">&#9733;&#9733;&#9733;&#9733;&#9733;</div>
                  <p style="margin:0 0 22px;font:italic 400 16px/1.55 Georgia,serif;color:#0F1419;letter-spacing:-0.005em;">"We were ranking page 4 for our most important keyword. Three months after launch we hit Local Pack #1 and it has not budged. The discovery call alone was worth more than two prior agency engagements."</p>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-top:1px dashed rgba(15,20,25,0.14);padding-top:16px;width:100%;">
                    <tr>
                      <td width="48" style="padding-top:16px;vertical-align:middle;">
                        <span style="display:inline-block;width:40px;height:40px;background:#0F1419;color:#F4EFE6;border-radius:50%;text-align:center;line-height:40px;font:700 11px 'SF Mono',Consolas,monospace;letter-spacing:0.04em;">MC</span>
                      </td>
                      <td style="padding:16px 0 0 12px;vertical-align:middle;">
                        <div style="font:600 14px/1.3 Georgia,serif;color:#0F1419;">Margaret Coleman</div>
                        <div style="font:400 12px/1.4 -apple-system,sans-serif;color:#4A5561;">Managing Partner, Coleman &amp; Reyes Law</div>
                        <div style="font:500 10px/1.4 'SF Mono',Consolas,monospace;color:#A86F1F;letter-spacing:0.06em;margin-top:2px;">BETHESDA, MD</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>

            <p style="margin:24px 0 0;text-align:center;">
              <a href="https://www.upcomingbrand.com/reviews/" style="display:inline-block;font:600 11px/1 'SF Mono',Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;color:#A86F1F;text-decoration:none;border:1.5px solid #D4932E;border-radius:999px;padding:11px 18px;">See all client reviews &rarr;</a>
            </p>
          </td>
        </tr>

        <!-- ========== 5. DIRECT CONTACT (BLACK) ========== -->
        <tr>
          <td style="background:#0F1419;padding:44px 40px 36px;text-align:center;">
            <div style="font:500 11px/1.2 'SF Mono',Consolas,monospace;letter-spacing:.22em;text-transform:uppercase;color:#D4932E;margin-bottom:12px;">Anything urgent?</div>
            <h2 style="margin:0 0 12px;font:500 26px/1.15 Georgia,serif;color:#F4EFE6;letter-spacing:-0.02em;">Reach us directly.</h2>
            <p style="margin:0 auto 24px;font:400 14px/1.6 -apple-system,sans-serif;color:rgba(244,239,230,0.75);max-width:420px;">If your project is time-sensitive or you have a specific question, the founder is one email away.</p>

            <!-- BIG phone (primary direct contact) -->
            <div style="margin:0 0 8px;">
              <div style="font:500 10px/1 'SF Mono',Consolas,monospace;letter-spacing:.2em;text-transform:uppercase;color:rgba(244,239,230,0.55);margin-bottom:8px;">Call or WhatsApp</div>
              <a href="tel:+12402092757" style="display:inline-block;font:700 32px/1.05 Georgia,'Times New Roman',serif;color:#D4932E;text-decoration:none;letter-spacing:-0.01em;">+1 (240) 209 2757</a>
            </div>

            <!-- CTA buttons -->
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:18px auto 0;">
              <tr>
                <td style="padding:4px;">
                  <a href="https://wa.me/12402092757?text=Hi%20Upcoming%20Brand%2C%20I%20just%20sent%20you%20an%20inquiry." style="display:inline-block;background:#25D366;color:#FFFFFF;font:700 12px/1 -apple-system,sans-serif;letter-spacing:.06em;text-decoration:none;border-radius:999px;padding:13px 20px;">&#9742; WhatsApp</a>
                </td>
                <td style="padding:4px;">
                  <a href="tel:+12402092757" style="display:inline-block;background:#D4932E;color:#0F1419;font:700 12px/1 'SF Mono',Consolas,monospace;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-radius:999px;padding:13px 20px;">Call now</a>
                </td>
                <td style="padding:4px;">
                  <a href="mailto:hello@upcomingbrand.com" style="display:inline-block;background:transparent;color:#F4EFE6;font:600 12px/1 'SF Mono',Consolas,monospace;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border:1.5px solid rgba(244,239,230,0.3);border-radius:999px;padding:11.5px 20px;">Email</a>
                </td>
              </tr>
            </table>

            <!-- live status -->
            <div style="margin-top:20px;font:500 11px/1.4 'SF Mono',Consolas,monospace;letter-spacing:.06em;color:rgba(244,239,230,0.6);">
              <span style="display:inline-block;width:8px;height:8px;background:#4ade80;border-radius:50%;vertical-align:middle;margin-right:6px;"></span>
              Mon-Fri, 9 AM-6 PM ET &middot; Replies within 1 business day
            </div>

            <!-- sign-off -->
            <div style="margin-top:32px;padding-top:24px;border-top:1px dashed rgba(244,239,230,0.18);font:400 13px/1.6 -apple-system,sans-serif;color:rgba(244,239,230,0.6);">
              <div style="font-style:italic;color:#D4932E;">Looking forward to it,</div>
              <div style="margin-top:4px;color:#F4EFE6;font-weight:600;">The Upcoming Brand team</div>
            </div>
          </td>
        </tr>

        <!-- ========== FOOTER (BLACK) ========== -->
        <tr>
          <td style="background:#0F1419;padding:0 40px 32px;text-align:center;">
            <div style="font:500 11px/1.6 'SF Mono',Consolas,monospace;letter-spacing:.06em;color:rgba(244,239,230,0.45);">
              <a href="https://www.upcomingbrand.com/" style="color:#D4932E;text-decoration:none;">upcomingbrand.com</a>
              &nbsp;&middot;&nbsp;
              <a href="https://www.upcomingbrand.com/work/" style="color:#D4932E;text-decoration:none;">Work</a>
              &nbsp;&middot;&nbsp;
              <a href="https://www.upcomingbrand.com/process/" style="color:#D4932E;text-decoration:none;">Process</a>
              &nbsp;&middot;&nbsp;
              <a href="https://www.upcomingbrand.com/reviews/" style="color:#D4932E;text-decoration:none;">Reviews</a>
            </div>
            <div style="margin-top:14px;font:400 10px/1.5 -apple-system,sans-serif;color:rgba(244,239,230,0.35);">
              Upcoming Brand &middot; WordPress Web Design Studio &middot; Maryland, USA
            </div>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>
</body>
</html>`;
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

  // Origin / referer check — block obvious cross-site abuse
  // (form submissions must originate from upcomingbrand.com or its preview domains)
  const origin = request.headers.get('origin') || request.headers.get('referer') || '';
  const isAllowedOrigin = !origin
    || /^https?:\/\/(www\.)?upcomingbrand\.com(\/|$)/i.test(origin)
    || /^https?:\/\/[a-z0-9-]+\.vercel\.app(\/|$)/i.test(origin)
    || /^https?:\/\/localhost(:\d+)?(\/|$)/i.test(origin);
  if (!isAllowedOrigin) {
    return new Response(JSON.stringify({ ok: false, error: 'origin_not_allowed' }), { status: 403, headers: { 'content-type': 'application/json' } });
  }

  // Body size guard — reject obvious payload-flooding attempts
  const contentLength = Number(request.headers.get('content-length') || '0');
  if (contentLength > 32_000) {
    return new Response(JSON.stringify({ ok: false, error: 'payload_too_large' }), { status: 413, headers: { 'content-type': 'application/json' } });
  }

  let payload: Record<string, string> = {};
  try {
    const ct = request.headers.get('content-type') || '';
    if (ct.includes('application/json')) {
      payload = await request.json();
    } else if (ct.includes('application/x-www-form-urlencoded') || ct.includes('multipart/form-data')) {
      const fd = await request.formData();
      fd.forEach((v, k) => { payload[k] = String(v); });
    } else {
      return new Response(JSON.stringify({ ok: false, error: 'unsupported_content_type' }), { status: 415, headers: { 'content-type': 'application/json' } });
    }
  } catch {
    return new Response(JSON.stringify({ ok: false, error: 'bad_payload' }), { status: 400, headers: { 'content-type': 'application/json' } });
  }

  // Per-field length caps — prevent abusive payloads even when content-length is bypassed
  const FIELD_CAPS: Record<string, number> = {
    name: 120, email: 200, phone: 40, business: 80, company: 120,
    message: 4000, notes: 4000, details: 4000, project: 4000,
    'first-name': 120, firstName: 120,
  };
  for (const [k, v] of Object.entries(payload)) {
    if (typeof v !== 'string') continue;
    const cap = FIELD_CAPS[k] ?? 1000;
    if (v.length > cap) payload[k] = v.slice(0, cap);
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
