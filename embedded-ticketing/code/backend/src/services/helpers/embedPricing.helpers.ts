import {
  DisplayPriceParams,
  ImportRowInput,
  ImportRowProblem,
  ParsedImport,
  PickActiveTierParams,
  PriceTierInput,
  PriceTierRule,
  ResolveCheckoutPriceParams,
  ResolvedCheckoutPrice,
} from '../../interfaces/embed.interface';

// Pure rules for peakst8 Embed: early-bird tiers, coupon vs tier, display
// prices, allowed origins and KonfHub CSV parsing. No database access here,
// so scripts/check-embed.ts can exercise every rule.

const roundRupees = (value: number) => Math.round(value * 100) / 100;

/**
 * The tier that applies right now: lowest `order` first, then earliest end.
 * A tier applies when it has started, has not ended and still has seats.
 */
export function pickActiveTier({
  tiers,
  now,
  soldByTierId,
}: PickActiveTierParams): PriceTierRule | null {
  const sorted = [...tiers].sort(
    (a, b) => a.order - b.order || a.endsAt.getTime() - b.endsAt.getTime(),
  );
  for (const tier of sorted) {
    const started = !tier.startsAt || tier.startsAt.getTime() <= now.getTime();
    const open = now.getTime() < tier.endsAt.getTime();
    const sold = soldByTierId[tier.id] ?? 0;
    const hasSeats = tier.capacity === null || sold < tier.capacity;
    if (started && open && hasSeats) return tier;
  }
  return null;
}

/**
 * Early-bird tiers and coupons never stack: the runner gets whichever is
 * cheaper. A tier lowers the base amount; a coupon keeps the base and is
 * applied by calculateRegistrationAmount as before.
 */
export function resolveCheckoutPrice({
  baseAmount,
  tier,
  coupon,
}: ResolveCheckoutPriceParams): ResolvedCheckoutPrice {
  const tierAmount = tier
    ? roundRupees(baseAmount * (1 - tier.percentOff / 100))
    : baseAmount;

  let couponAmount = baseAmount;
  if (coupon?.flatDiscountAmount) {
    couponAmount = Math.max(baseAmount - coupon.flatDiscountAmount, 0);
  } else if (coupon?.offerPercentage) {
    couponAmount = roundRupees(baseAmount * (1 - coupon.offerPercentage / 100));
  }

  const hasCoupon = Boolean(
    coupon && (coupon.flatDiscountAmount || coupon.offerPercentage),
  );

  if (tier && tierAmount <= couponAmount) {
    return {
      categoryBaseAmount: tierAmount,
      offerPercentage: null,
      flatDiscountAmount: null,
      priceTierId: tier.id,
      appliedDiscount: 'TIER',
    };
  }
  if (hasCoupon && coupon) {
    return {
      categoryBaseAmount: baseAmount,
      offerPercentage: coupon.offerPercentage,
      flatDiscountAmount: coupon.flatDiscountAmount,
      priceTierId: null,
      appliedDiscount: 'COUPON',
    };
  }
  return {
    categoryBaseAmount: baseAmount,
    offerPercentage: null,
    flatDiscountAmount: null,
    priceTierId: null,
    appliedDiscount: 'NONE',
  };
}

/** What a runner pays for the pass, in paise, including GST when it's added on top. */
export function displayPricePaise({
  amount,
  gstPercentage,
  isAmountInclusiveGST,
}: DisplayPriceParams): number {
  const withTax =
    isAmountInclusiveGST || !gstPercentage
      ? amount
      : amount * (1 + gstPercentage / 100);
  return Math.round(withTax * 100);
}

export function validatePriceTiers(tiers: PriceTierInput[]): string | null {
  for (const [index, tier] of tiers.entries()) {
    const name = tier.label || `Tier ${index + 1}`;
    if (!(tier.percentOff > 0 && tier.percentOff < 100)) {
      return `${name}: discount must be between 0 and 100%`;
    }
    if (tier.startsAt && tier.startsAt.getTime() >= tier.endsAt.getTime()) {
      return `${name}: end date must be after the start date`;
    }
    if (tier.capacity !== null && tier.capacity !== undefined) {
      if (!Number.isInteger(tier.capacity) || tier.capacity < 1) {
        return `${name}: seat limit must be a whole number above 0`;
      }
    }
  }
  return null;
}

// --- Origins ---------------------------------------------------------------

/** https origins only (plus http://localhost for testing). Returns null if invalid. */
export function normalizeOrigin(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.startsWith('*.')) {
    const host = trimmed.slice(2).toLowerCase();
    return /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(host) ? `*.${host}` : null;
  }
  try {
    const url = new URL(trimmed);
    const isLocal = url.hostname === 'localhost';
    if (url.protocol !== 'https:' && !(isLocal && url.protocol === 'http:')) {
      return null;
    }
    return url.origin.toLowerCase();
  } catch {
    return null;
  }
}

export function isOriginAllowed(origin: string, allowed: string[]): boolean {
  const candidate = normalizeOrigin(origin);
  if (!candidate || candidate.startsWith('*.')) return false;
  const host = new URL(candidate).hostname;
  return allowed.some((entry) => {
    if (entry.startsWith('*.')) {
      const suffix = entry.slice(1); // ".example.com"
      return candidate.startsWith('https://') && host.endsWith(suffix);
    }
    return entry === candidate;
  });
}

// --- CSV --------------------------------------------------------------------

/** RFC 4180 CSV: quoted fields, doubled quotes, CRLF or LF, BOM stripped. */
export function parseCsv(text: string): string[][] {
  const input = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  const endField = () => {
    row.push(field);
    field = '';
  };
  const endRow = () => {
    endField();
    rows.push(row);
    row = [];
  };

  let i = 0;
  while (i < input.length) {
    const char = input[i];
    if (char === '"') {
      const [value, next] = readQuoted(input, i + 1);
      field += value;
      i = next;
      continue;
    }
    if (char === ',') {
      endField();
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && input[i + 1] === '\n') i++;
      endRow();
    } else {
      field += char;
    }
    i++;
  }
  if (field !== '' || row.length > 0) endRow();
  return rows.filter((r) => r.some((cell) => cell.trim() !== ''));
}

/** Reads a quoted field starting after its opening quote. Returns the value and the index after the closing quote. */
function readQuoted(input: string, start: number): [string, number] {
  let value = '';
  let i = start;
  while (i < input.length) {
    if (input[i] === '"') {
      if (input[i + 1] !== '"') return [value, i + 1];
      value += '"';
      i += 2;
      continue;
    }
    value += input[i];
    i++;
  }
  return [value, i];
}

// KonfHub's attendee export headers vary by event form, so each field is
// found by any of these names (case and punctuation ignored).
const KONFHUB_COLUMNS: Record<keyof ImportRowInput | 'status', string[]> = {
  externalId: ['booking id', 'ticket id', 'registration id', 'order id', 'id'],
  email: ['email', 'email address', 'email id', 'attendee email'],
  firstName: ['first name', 'name', 'full name', 'attendee name'],
  lastName: ['last name', 'surname'],
  phoneNumber: [
    'phone',
    'phone number',
    'mobile',
    'mobile number',
    'contact number',
  ],
  ticketName: ['ticket name', 'ticket type', 'ticket', 'category'],
  amountPaid: [
    'amount paid',
    'amount',
    'ticket price',
    'total amount',
    'price',
  ],
  status: ['status', 'ticket status', 'booking status', 'payment status'],
};

const headerKey = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseKonfhubExport(text: string): ParsedImport {
  const table = parseCsv(text);
  const problems: ImportRowProblem[] = [];
  if (table.length === 0) {
    return {
      rows: [],
      problems: [{ line: 1, reason: 'The file is empty' }],
      skippedCancelled: 0,
    };
  }

  const headers = table[0].map(headerKey);
  const column = (field: keyof typeof KONFHUB_COLUMNS) =>
    headers.findIndex((h) => KONFHUB_COLUMNS[field].map(headerKey).includes(h));
  const index = {
    externalId: column('externalId'),
    email: column('email'),
    firstName: column('firstName'),
    lastName: column('lastName'),
    phoneNumber: column('phoneNumber'),
    ticketName: column('ticketName'),
    amountPaid: column('amountPaid'),
    status: column('status'),
  };
  if (index.email < 0 || index.firstName < 0) {
    return {
      rows: [],
      problems: [
        { line: 1, reason: 'Could not find the email and name columns' },
      ],
      skippedCancelled: 0,
    };
  }

  const cell = (row: string[], i: number) =>
    i >= 0 ? (row[i] ?? '').trim() : '';
  const seen = new Set<string>();
  const rows: ParsedImport['rows'] = [];
  let skippedCancelled = 0;

  table.slice(1).forEach((row, offset) => {
    const line = offset + 2;
    const status = cell(row, index.status).toLowerCase();
    if (/cancel|refund|fail/.test(status)) {
      skippedCancelled++;
      return;
    }
    const email = cell(row, index.email).toLowerCase();
    if (!EMAIL_PATTERN.test(email)) {
      problems.push({ line, reason: 'Email is missing or not valid' });
      return;
    }
    if (seen.has(email)) {
      problems.push({ line, reason: `${email} appears more than once` });
      return;
    }
    seen.add(email);

    let firstName = cell(row, index.firstName);
    let lastName: string | null = cell(row, index.lastName) || null;
    if (!lastName && firstName.includes(' ')) {
      const parts = firstName.split(/\s+/);
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }
    if (!firstName) {
      problems.push({ line, reason: 'Name is missing' });
      return;
    }

    const amount = Number(cell(row, index.amountPaid).replace(/[^0-9.]/g, ''));
    rows.push({
      line,
      externalId: cell(row, index.externalId) || null,
      email,
      firstName,
      lastName,
      phoneNumber: cell(row, index.phoneNumber).replace(/[^0-9+]/g, '') || null,
      ticketName: cell(row, index.ticketName) || 'Registration',
      amountPaid: Number.isFinite(amount) ? amount : 0,
    });
  });

  return { rows, problems, skippedCancelled };
}
