// Catalog of planned blog articles. Each entry powers /blog/ hub + /blog/[slug] placeholder.
// When an article actually publishes, replace its `status: 'coming-soon'` with `status: 'published'`
// and add the real route in /blog/[slug].astro getStaticPaths exclusion.

export interface BlogArticle {
  slug: string;
  title: string;
  category: 'buying-guides' | 'industry-seo' | 'industry-design' | 'technical' | 'local-seo' | 'vertical-deep-dive';
  description: string;
  status: 'coming-soon' | 'published';
  /** Custom URL for published articles that live outside /blog/[slug]/. Defaults to /blog/[slug]/ when omitted. */
  route?: string;
  estPublishMonth?: string;
  relatedServices?: string[];
  relatedIndustries?: string[];
}

/** Returns the public URL for any article — custom route or default /blog/[slug]/ */
export function articleUrl(a: BlogArticle): string {
  return a.route ?? `/blog/${a.slug}/`;
}

export const categories = {
  'buying-guides':       { label: 'Buying Guides',         desc: 'Cost, comparison, and decision-making content for businesses evaluating a website investment.' },
  'industry-seo':        { label: 'Industry SEO',          desc: 'Vertical-specific SEO playbooks for law firms, dentists, medical practices, real estate, and more.' },
  'industry-design':     { label: 'Industry Design',       desc: 'Website design guides tailored to specific verticals.' },
  'technical':           { label: 'Technical Guides',      desc: 'Performance, hosting, accessibility, and WordPress technical deep-dives.' },
  'local-seo':           { label: 'Local SEO',             desc: 'Google Business Profile, reviews, citations, and Local Pack ranking strategy.' },
  'vertical-deep-dive':  { label: 'Vertical Deep Dives',   desc: 'IDX integration, ecommerce CRO, menu schema, ADA compliance, and other niche topics.' },
};

export const articles: BlogArticle[] = [
  // BUYING GUIDES (9)
  { slug: 'website-for-a-small-business-cost', title: 'How Much Does a Professional Website for a Small Business Typically Cost?', category: 'buying-guides', description: 'Real 2026 pricing for small business websites across DIY, freelancer, and agency builds. Plus the recurring costs most owners miss when setting a budget.', status: 'published', route: '/website-for-a-small-business-cost/', relatedServices: ['/services/wordpress-web-design/', '/hire-wordpress-designer/'] },
  { slug: 'how-much-does-a-wordpress-website-cost', title: 'How Much Does a WordPress Website Cost in 2026?', category: 'buying-guides', description: 'Real WordPress website costs across builds, redesigns, and ongoing care. Numbers from 400+ shipped projects across 9 verticals.', status: 'coming-soon', estPublishMonth: '2026-06', relatedServices: ['/services/wordpress-web-design/', '/pricing/'] },
  { slug: 'attorney-website-design-cost', title: 'Attorney Website Design Cost: What Law Firms Actually Pay', category: 'buying-guides', description: 'Honest pricing breakdown for law firm websites including schema, intake forms, and Local Pack optimization.', status: 'coming-soon', estPublishMonth: '2026-06', relatedServices: ['/services/wordpress-web-design/'], relatedIndustries: ['/industries/law-firm-website-design/'] },
  { slug: 'dental-website-design-cost', title: 'Dental Website Design Cost: 2026 Pricing for Practices', category: 'buying-guides', description: 'What dental practices pay for a real website with online booking, MedicalProcedure schema, and HIPAA-aware forms.', status: 'coming-soon', estPublishMonth: '2026-06', relatedIndustries: ['/industries/dental-website-design/'] },
  { slug: 'questions-to-ask-a-web-designer', title: '15 Questions to Ask a Web Designer Before You Sign', category: 'buying-guides', description: 'The questions that separate real WordPress agencies from page-builder shops. Use them on your discovery calls.', status: 'coming-soon', estPublishMonth: '2026-06' },
  { slug: 'wordpress-vs-wix', title: 'WordPress vs Wix: Which Is Right for Your Business?', category: 'buying-guides', description: 'When Wix wins, when WordPress wins, and why most growing businesses outgrow Wix between year 2 and year 3.', status: 'coming-soon', estPublishMonth: '2026-07', relatedServices: ['/services/wordpress-migration/'] },
  { slug: 'wordpress-vs-webflow', title: 'WordPress vs Webflow: The Honest Comparison', category: 'buying-guides', description: 'Performance, SEO, ownership, and total cost compared across both platforms after 5 years of use.', status: 'coming-soon', estPublishMonth: '2026-07' },
  { slug: 'wordpress-vs-squarespace', title: 'WordPress vs Squarespace: When to Switch', category: 'buying-guides', description: 'The exact signals that mean it is time to migrate from Squarespace to WordPress.', status: 'coming-soon', estPublishMonth: '2026-07', relatedServices: ['/services/wordpress-migration/'] },
  { slug: 'wordpress-vs-squarespace-business', title: 'WordPress vs Squarespace for Business Sites', category: 'buying-guides', description: 'For businesses past 5,000 monthly visits, the cost / benefit math changes. Here is the full breakdown.', status: 'coming-soon', estPublishMonth: '2026-08' },
  { slug: 'elementor-vs-divi', title: 'Elementor vs Divi: Which to Avoid in 2026', category: 'buying-guides', description: 'Both page builders carry performance penalties and lock-in. We compare what you actually pay over 5 years.', status: 'coming-soon', estPublishMonth: '2026-07', relatedServices: ['/services/wordpress-redesign/'] },

  // INDUSTRY SEO (10)
  { slug: 'law-firm-seo-maryland', title: 'Law Firm SEO Maryland: Local Pack Strategy for Attorneys', category: 'industry-seo', description: 'How Maryland law firms rank in the Local Pack with LegalService schema, citation cleanup, and bar-compliant content.', status: 'coming-soon', estPublishMonth: '2026-06', relatedServices: ['/services/local-seo-maryland/'], relatedIndustries: ['/industries/law-firm-website-design/'] },
  { slug: 'dental-seo-maryland', title: 'Dental SEO Maryland: New Patient Acquisition Playbook', category: 'industry-seo', description: 'Local SEO playbook for Maryland dental practices: GBP optimization, reviews, MedicalProcedure schema, and patient acquisition.', status: 'coming-soon', estPublishMonth: '2026-06', relatedIndustries: ['/industries/dental-website-design/'] },
  { slug: 'medical-practice-seo-maryland', title: 'Medical Practice SEO Maryland: Patient Acquisition Through Search', category: 'industry-seo', description: 'How medical practices in Maryland rank for high-intent patient queries while staying HIPAA compliant.', status: 'coming-soon', estPublishMonth: '2026-07', relatedIndustries: ['/industries/medical-website-design/'] },
  { slug: 'real-estate-seo-maryland', title: 'Real Estate SEO Maryland: How Realtors Win Local Search', category: 'industry-seo', description: 'IDX integration, neighborhood pages, RealEstateAgent schema, and the Local Pack strategy for Maryland realtors.', status: 'coming-soon', estPublishMonth: '2026-07', relatedIndustries: ['/industries/real-estate-website-design/'] },
  { slug: 'contractor-seo-maryland', title: 'Contractor SEO Maryland: Service-Area Ranking Strategy', category: 'industry-seo', description: 'How Maryland contractors rank in the Local Pack for "[trade] near me" across multiple service areas.', status: 'coming-soon', estPublishMonth: '2026-08', relatedIndustries: ['/industries/contractor-website-design/'] },
  { slug: 'restaurant-seo-maryland', title: 'Restaurant SEO Maryland: Menu, Map, and Reviews', category: 'industry-seo', description: 'Restaurant schema, Menu markup, OpenTable integration, and the GBP photo strategy that drives walk-ins.', status: 'coming-soon', estPublishMonth: '2026-07', relatedIndustries: ['/industries/restaurant-website-design/'] },
  { slug: 'small-business-seo-maryland', title: 'Small Business SEO Maryland: Where to Start', category: 'industry-seo', description: 'The 5-step Local SEO baseline every Maryland small business should ship before doing anything else.', status: 'coming-soon', estPublishMonth: '2026-06', relatedIndustries: ['/industries/small-business-website-design/'] },
  { slug: 'woocommerce-seo-maryland', title: 'WooCommerce SEO: Product Schema and Conversion Architecture', category: 'industry-seo', description: 'Product schema, faceted navigation, and on-page optimization for WooCommerce stores selling in Maryland and beyond.', status: 'coming-soon', estPublishMonth: '2026-08', relatedServices: ['/services/woocommerce-development/'] },
  { slug: 'fitness-studio-local-seo', title: 'Fitness Studio Local SEO: Class Booking Through Search', category: 'industry-seo', description: 'How gyms and fitness studios rank for "[class type] near me" via SportsActivityLocation schema and review velocity.', status: 'coming-soon', estPublishMonth: '2026-08', relatedIndustries: ['/industries/gym-website-design/'] },
  { slug: 'church-local-seo-google', title: 'Church Local SEO: Show Up When People Search "Church Near Me"', category: 'industry-seo', description: 'Google Business Profile, sermon schema, event markup, and the local SEO basics for faith communities.', status: 'coming-soon', estPublishMonth: '2026-08', relatedIndustries: ['/industries/church-website-design/'] },

  // INDUSTRY DESIGN (4)
  { slug: 'gym-website-design-guide', title: 'Gym Website Design Guide: Conversion Architecture for Fitness', category: 'industry-design', description: 'What converts on a gym website: class schedules, free trial offers, social proof, and MindBody integration.', status: 'coming-soon', estPublishMonth: '2026-07', relatedIndustries: ['/industries/gym-website-design/'] },
  { slug: 'church-website-design-tips', title: 'Church Website Design Tips That Actually Drive Engagement', category: 'industry-design', description: 'Sermon archives, event calendars, online giving, and accessibility patterns that grow congregations.', status: 'coming-soon', estPublishMonth: '2026-07', relatedIndustries: ['/industries/church-website-design/'] },
  { slug: 'home-services-website-design', title: 'Home Services Website Design: Lead Generation Patterns That Work', category: 'industry-design', description: 'Quote calculators, service area pages, and the conversion architecture that turns home services traffic into booked jobs.', status: 'coming-soon', estPublishMonth: '2026-08', relatedIndustries: ['/industries/contractor-website-design/'] },
  { slug: 'doctor-website-new-patients', title: 'Doctor Website Design for New Patient Acquisition', category: 'industry-design', description: 'Online booking, Physician schema, insurance pages, and the patterns that bring in new patients.', status: 'coming-soon', estPublishMonth: '2026-08', relatedIndustries: ['/industries/medical-website-design/'] },

  // TECHNICAL (5)
  { slug: 'best-wordpress-hosting', title: 'Best WordPress Hosting in 2026: Honest Comparison', category: 'technical', description: 'Kinsta vs WP Engine vs Cloudways vs SiteGround compared after migrating 100+ sites onto and off all four.', status: 'coming-soon', estPublishMonth: '2026-06', relatedServices: ['/services/wordpress-hosting/'] },
  { slug: 'how-to-speed-up-wordpress', title: 'How to Speed Up WordPress: The Real Checklist', category: 'technical', description: 'The 12 highest-impact speed optimizations ranked by effort and result. No fluff, no plugin recommendations.', status: 'coming-soon', estPublishMonth: '2026-06', relatedServices: ['/services/wordpress-speed-optimization/'] },
  { slug: 'wordpress-seo-best-practices', title: 'WordPress SEO Best Practices That Actually Move Rankings', category: 'technical', description: 'Schema, internal linking, Core Web Vitals, and the on-page work that compounds. Skip the rest.', status: 'coming-soon', estPublishMonth: '2026-07', relatedServices: ['/services/wordpress-seo-services/'] },
  { slug: 'wordpress-accessibility-plugins', title: 'WordPress Accessibility Plugins: What Actually Helps', category: 'technical', description: 'Most accessibility plugins do not actually fix accessibility. Here is what does and what to use instead.', status: 'coming-soon', estPublishMonth: '2026-08' },
  { slug: 'hipaa-compliant-wordpress', title: 'HIPAA Compliant WordPress: What Medical Practices Need to Know', category: 'technical', description: 'BAA agreements, hosting requirements, form processing, and the actual technical bar for HIPAA-compliant WordPress.', status: 'coming-soon', estPublishMonth: '2026-08', relatedIndustries: ['/industries/medical-website-design/'] },

  // LOCAL SEO (4)
  { slug: 'google-business-profile-optimization', title: 'Google Business Profile Optimization: The Full Playbook', category: 'local-seo', description: 'Categories, services, products, posts, photos, Q&A, and the GBP signals that move Local Pack rankings.', status: 'coming-soon', estPublishMonth: '2026-06', relatedServices: ['/services/local-seo-maryland/'] },
  { slug: 'realtor-google-business-profile', title: 'Realtor Google Business Profile: Setup for Real Estate Agents', category: 'local-seo', description: 'GBP categories, service areas, listing photos, and review velocity for real estate professionals.', status: 'coming-soon', estPublishMonth: '2026-07', relatedIndustries: ['/industries/real-estate-website-design/'] },
  { slug: 'google-reviews-dental-practice', title: 'Google Reviews for Dental Practices: Strategy and Compliance', category: 'local-seo', description: 'Review acquisition tactics that work for dental practices while staying HIPAA-compliant.', status: 'coming-soon', estPublishMonth: '2026-07', relatedIndustries: ['/industries/dental-website-design/'] },
  { slug: 'google-local-services-ads', title: 'Google Local Services Ads: When to Run Them', category: 'local-seo', description: 'How LSAs work, what they cost, and which verticals actually benefit from running them alongside organic.', status: 'coming-soon', estPublishMonth: '2026-08' },

  // VERTICAL DEEP DIVES (7)
  { slug: 'idx-integration-wordpress', title: 'IDX Integration with WordPress: Real Estate Setup Guide', category: 'vertical-deep-dive', description: 'IDX Broker, Bright MLS, and the integration patterns that work for WordPress real estate sites.', status: 'coming-soon', estPublishMonth: '2026-08', relatedIndustries: ['/industries/real-estate-website-design/'] },
  { slug: 'abandoned-cart-recovery-guide', title: 'Abandoned Cart Recovery for WooCommerce: What Works in 2026', category: 'vertical-deep-dive', description: 'Email sequences, SMS recovery, exit-intent popups, and the data on what actually recovers carts.', status: 'coming-soon', estPublishMonth: '2026-08', relatedServices: ['/services/woocommerce-development/'] },
  { slug: 'ecommerce-conversion-rate-optimization', title: 'Ecommerce Conversion Rate Optimization: 12 Tests That Move the Needle', category: 'vertical-deep-dive', description: 'CRO tests ranked by impact on conversion rate. Most stores have low-hanging fruit they have never run.', status: 'coming-soon', estPublishMonth: '2026-09', relatedIndustries: ['/industries/ecommerce-website-design/'] },
  { slug: 'restaurant-website-menu-seo', title: 'Restaurant Menu SEO: Schema and Search Visibility', category: 'vertical-deep-dive', description: 'Menu schema, dish-level structured data, and how to show up when people search for specific dishes.', status: 'coming-soon', estPublishMonth: '2026-08', relatedIndustries: ['/industries/restaurant-website-design/'] },
  { slug: 'mindbody-vs-glofox-comparison', title: 'MindBody vs Glofox: Booking Platform Comparison for Studios', category: 'vertical-deep-dive', description: 'Pricing, features, integration depth, and which platform fits which type of fitness business.', status: 'coming-soon', estPublishMonth: '2026-09', relatedIndustries: ['/industries/gym-website-design/'] },
  { slug: 'online-giving-platform-comparison', title: 'Online Giving Platform Comparison: Tithely vs Pushpay vs GiveWP', category: 'vertical-deep-dive', description: 'Fees, integration depth, and feature comparison for the top three online giving platforms.', status: 'coming-soon', estPublishMonth: '2026-09', relatedIndustries: ['/industries/church-website-design/', '/industries/nonprofit-website-design/'] },
  { slug: 'legal-website-ada-compliance', title: 'Legal Website ADA Compliance: What Law Firms Need', category: 'vertical-deep-dive', description: 'WCAG 2.2 AA compliance for law firm websites: what is required, what is best practice, and what is theater.', status: 'coming-soon', estPublishMonth: '2026-09', relatedIndustries: ['/industries/law-firm-website-design/'] },
  { slug: 'google-ordering-restaurants', title: 'Google Ordering for Restaurants: Setup and Direct-Order Strategy', category: 'vertical-deep-dive', description: 'How to capture Google ordering traffic via direct integration, bypassing the third-party platform fees.', status: 'coming-soon', estPublishMonth: '2026-09', relatedIndustries: ['/industries/restaurant-website-design/'] },
];

export function articleByslug(slug: string): BlogArticle | undefined {
  return articles.find((a) => a.slug === slug);
}

export function articlesByCategory(cat: string): BlogArticle[] {
  return articles.filter((a) => a.category === cat);
}
