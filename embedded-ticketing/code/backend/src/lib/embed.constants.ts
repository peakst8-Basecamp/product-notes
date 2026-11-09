/** Registrations in these states hold a seat in an early-bird tier. */
export const EMBED_TIER_SEAT_STATUSES = [
  'PAYMENT_PENDING',
  'TICKET_GENERATED',
] as const;

/** Waiver content stored on imported registrations (they accepted it on KonfHub). */
export const KONFHUB_IMPORT_WAIVER_NOTE = {
  source: 'konfhub-import',
  note: 'Registered and accepted the waiver on KonfHub before moving to peakst8',
};

export const EMBED_MAX_IMPORT_ROWS = 10_000;

export const EMBED_GROUP_CODE_PREFIX = 'GRP';
