// src/lib/advertTemplates.ts
// Fill-in templates for user business adverts. The user picks a template and
// fills the fields; template + fields render into an ad card in the app.

export interface AdvertTemplate {
  id: string;
  name: string;
  description: string;
  /** Field placeholder, keyed by canonical field. Empty string = omit field from UI. */
  fields: {
    headline: string;       // required, 120 chars
    businessName: string;   // required, 100 chars
    description: string;    // optional, 800 chars
    contactPhone: string;   // optional, 40 chars
    whatsapp: string;       // optional, 40 chars
    location: string;       // optional, 150 chars
  };
}

export const ADVERT_TEMPLATES: AdvertTemplate[] = [
  {
    id: 'standard',
    name: 'Standard Ad',
    description: 'Introduce your business — what you do and how to reach you.',
    fields: {
      headline: 'e.g. Quality plumbing services in Blantyre',
      businessName: 'e.g. Mw Plumbing Co.',
      description: 'Describe your business, products or services...',
      contactPhone: 'Phone number customers can call',
      whatsapp: 'WhatsApp number (optional)',
      location: 'e.g. Limbe, Blantyre',
    },
  },
  {
    id: 'promotion',
    name: 'Promotion / Discount',
    description: 'Announce a special offer or discount to attract customers.',
    fields: {
      headline: 'e.g. 20% OFF all catering this month!',
      businessName: 'e.g. Tasty Bites Catering',
      description: 'What is the offer, what does it apply to, and when does it end?',
      contactPhone: 'Phone number customers can call',
      whatsapp: 'WhatsApp number (optional)',
      location: 'e.g. Area 47, Lilongwe',
    },
  },
  {
    id: 'grand-opening',
    name: 'Grand Opening',
    description: 'Launching a new shop or branch? Announce it here.',
    fields: {
      headline: 'e.g. GRAND OPENING — Saturday 10AM!',
      businessName: 'e.g. Chipiku Express Mzuzu',
      description: 'What are you opening, when, and any opening-day specials?',
      contactPhone: 'Phone number customers can call',
      whatsapp: 'WhatsApp number (optional)',
      location: 'e.g. Shop 12, Mzuzu Mall',
    },
  },
  {
    id: 'hiring',
    name: 'Hiring / Job Opening',
    description: 'Looking for staff? Post the position and how to apply.',
    fields: {
      headline: 'e.g. We are hiring: Sales Assistants (3)',
      businessName: 'e.g. Sunrise Enterprises',
      description: 'Role, requirements, salary range and how to apply...',
      contactPhone: 'Phone number for applications',
      whatsapp: 'WhatsApp number (optional)',
      location: 'e.g. Zomba',
    },
  },
];

export const TEMPLATE_IDS = ADVERT_TEMPLATES.map((t) => t.id);

/** Text fields accepted for official (admin-created) ads. */
export const OFFICIAL_FIELDS = ['headline', 'businessName', 'description', 'contactPhone', 'location', 'whatsapp'] as const;

export interface OfficialAdInput {
  headline: string;
  businessName: string;
  description?: string;
  contactPhone?: string;
  location?: string;
  whatsapp?: string;
}

export function getTemplate(id: string): AdvertTemplate | undefined {
  return ADVERT_TEMPLATES.find((t) => t.id === id);
}

export const ADVERT_LIMITS = {
  maxImages: 3,
  maxImageBytes: 5 * 1024 * 1024, // 5MB
  allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
};

/**
 * Sanitize the JSON image_urls text column into a safe string array.
 *
 * Stored URLs use /uploads/adverts/<file> (physical location), but the app
 * runs in SSR mode where Astro only serves public/ files that existed at
 * build time — runtime uploads would 404. So we rewrite to the fs-backed
 * /api/advert-images/<file> route, which works in every environment.
 */
export function parseImageUrls(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((u): u is string => typeof u === 'string')
      .map((u) => u.replace(/[<>"'`\\]/g, ''))
      .map((u) => u.replace(/^\/uploads\/adverts\//, '/api/advert-images/'))
      .filter((u) => u.startsWith('/api/advert-images/') && u.length < 300)
      .slice(0, 3);
  } catch {
    return [];
  }
}
