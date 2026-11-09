/* Standalone checks for the pure embed rules (the backend has no test runner).
 * Run: bun scripts/check-embed.ts */
import {
  displayPricePaise,
  isOriginAllowed,
  normalizeOrigin,
  parseCsv,
  parseKonfhubExport,
  pickActiveTier,
  resolveCheckoutPrice,
  validatePriceTiers,
} from '../src/services/helpers/embedPricing.helpers';
import { PriceTierRule } from '../src/interfaces/embed.interface';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) failures++;
  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `\n      got ${JSON.stringify(actual)}\n      want ${JSON.stringify(expected)}`}`,
  );
}

const d = (iso: string) => new Date(`${iso}T00:00:00+05:30`);

// Cubbon Classic: 15% until 30 Nov (first 500), 10% until 31 Dec, 5% until 31 Jan.
const tiers: PriceTierRule[] = [
  {
    id: 't15',
    label: 'Early bird 15% off',
    percentOff: 15,
    startsAt: null,
    endsAt: d('2026-12-01'),
    capacity: 500,
    order: 0,
  },
  {
    id: 't10',
    label: 'Early bird 10% off',
    percentOff: 10,
    startsAt: null,
    endsAt: d('2027-01-01'),
    capacity: null,
    order: 1,
  },
  {
    id: 't5',
    label: 'Early bird 5% off',
    percentOff: 5,
    startsAt: d('2027-01-01'),
    endsAt: d('2027-02-01'),
    capacity: null,
    order: 2,
  },
];

check(
  'tier: 15% in November',
  pickActiveTier({ tiers, now: d('2026-11-20'), soldByTierId: {} })?.id,
  't15',
);
check(
  'tier: 15% sold out moves to 10%',
  pickActiveTier({ tiers, now: d('2026-11-20'), soldByTierId: { t15: 500 } })
    ?.id,
  't10',
);
check(
  'tier: December is 10%',
  pickActiveTier({ tiers, now: d('2026-12-15'), soldByTierId: {} })?.id,
  't10',
);
check(
  'tier: January is 5%',
  pickActiveTier({ tiers, now: d('2027-01-10'), soldByTierId: {} })?.id,
  't5',
);
check(
  'tier: none after 1 Feb',
  pickActiveTier({ tiers, now: d('2027-02-02'), soldByTierId: {} }),
  null,
);
check(
  'tier: end is exclusive',
  pickActiveTier({ tiers: [tiers[2]], now: d('2027-02-01'), soldByTierId: {} }),
  null,
);

const t15 = tiers[0];
check(
  'price: tier only',
  resolveCheckoutPrice({ baseAmount: 1500, tier: t15, coupon: null }),
  {
    categoryBaseAmount: 1275,
    offerPercentage: null,
    flatDiscountAmount: null,
    priceTierId: 't15',
    appliedDiscount: 'TIER',
  },
);
check(
  'price: 20% bulk code beats 15% tier',
  resolveCheckoutPrice({
    baseAmount: 1500,
    tier: t15,
    coupon: { offerPercentage: 20, flatDiscountAmount: null },
  }),
  {
    categoryBaseAmount: 1500,
    offerPercentage: 20,
    flatDiscountAmount: null,
    priceTierId: null,
    appliedDiscount: 'COUPON',
  },
);
check(
  'price: 10% coupon loses to 15% tier (no stacking)',
  resolveCheckoutPrice({
    baseAmount: 1500,
    tier: t15,
    coupon: { offerPercentage: 10, flatDiscountAmount: null },
  }).appliedDiscount,
  'TIER',
);
check(
  'price: equal discount prefers tier',
  resolveCheckoutPrice({
    baseAmount: 1000,
    tier: t15,
    coupon: { offerPercentage: 15, flatDiscountAmount: null },
  }).appliedDiscount,
  'TIER',
);
check(
  'price: flat coupon',
  resolveCheckoutPrice({
    baseAmount: 1500,
    tier: null,
    coupon: { offerPercentage: null, flatDiscountAmount: 2000 },
  }).appliedDiscount,
  'COUPON',
);
check(
  'price: nothing',
  resolveCheckoutPrice({ baseAmount: 1500, tier: null, coupon: null })
    .appliedDiscount,
  'NONE',
);

check(
  'display: GST on top',
  displayPricePaise({
    amount: 1275,
    gstPercentage: 18,
    isAmountInclusiveGST: false,
  }),
  150450,
);
check(
  'display: GST inclusive',
  displayPricePaise({
    amount: 1275,
    gstPercentage: 18,
    isAmountInclusiveGST: true,
  }),
  127500,
);
check(
  'display: no GST set',
  displayPricePaise({
    amount: 1699.5,
    gstPercentage: null,
    isAmountInclusiveGST: false,
  }),
  169950,
);

check(
  'tiers valid',
  validatePriceTiers([{ label: 'A', percentOff: 15, endsAt: d('2026-12-01') }]),
  null,
);
check(
  'tiers: 0% rejected',
  validatePriceTiers([
    { label: 'A', percentOff: 0, endsAt: d('2026-12-01') },
  ]) !== null,
  true,
);
check(
  'tiers: end before start rejected',
  validatePriceTiers([
    {
      label: 'A',
      percentOff: 5,
      startsAt: d('2027-01-02'),
      endsAt: d('2027-01-01'),
    },
  ]) !== null,
  true,
);

check(
  'origin: normalize',
  normalizeOrigin('https://CubbonClassic10k.com/register'),
  'https://cubbonclassic10k.com',
);
check(
  'origin: http rejected',
  normalizeOrigin('http://cubbonclassic10k.com'),
  null,
);
check(
  'origin: localhost http ok',
  normalizeOrigin('http://localhost:3000'),
  'http://localhost:3000',
);
check(
  'origin: wildcard',
  normalizeOrigin('*.cubbonclassic10k.com'),
  '*.cubbonclassic10k.com',
);
const allowed = ['https://cubbonclassic10k.com', '*.cubbonclassic10k.com'];
check(
  'origin: exact match',
  isOriginAllowed('https://cubbonclassic10k.com', allowed),
  true,
);
check(
  'origin: subdomain match',
  isOriginAllowed('https://www.cubbonclassic10k.com', allowed),
  true,
);
check(
  'origin: lookalike rejected',
  isOriginAllowed('https://evilcubbonclassic10k.com', allowed),
  false,
);
check(
  'origin: other site rejected',
  isOriginAllowed('https://example.com', allowed),
  false,
);

check('csv: quotes and commas', parseCsv('a,b\r\n"x, y","he said ""hi"""\n'), [
  ['a', 'b'],
  ['x, y', 'he said "hi"'],
]);
check('csv: BOM and blank lines', parseCsv('﻿a\n\n1\n'), [['a'], ['1']]);

const konfhub = [
  'Booking ID,Name,Email Address,Phone Number,Ticket Name,Amount Paid,Status',
  'KH-1,Alex Rao,alex@example.com,+91 98450 00001,Individual 10K,"1,699.00",Confirmed',
  'KH-2,Sam,SAM@example.com,9845000002,Individual 10K,1699,Confirmed',
  'KH-3,Refunded Runner,refund@example.com,9845000003,Individual 10K,1699,Refunded',
  'KH-4,No Email,,9845000004,Individual 10K,1699,Confirmed',
  'KH-5,Dup,alex@example.com,9845000005,Individual 10K,1699,Confirmed',
].join('\n');
const parsed = parseKonfhubExport(konfhub);
check(
  'konfhub: rows kept',
  parsed.rows.map((r) => r.email),
  ['alex@example.com', 'sam@example.com'],
);
check(
  'konfhub: name split',
  [parsed.rows[0].firstName, parsed.rows[0].lastName],
  ['Alex', 'Rao'],
);
check('konfhub: amount parsed', parsed.rows[0].amountPaid, 1699);
check('konfhub: phone cleaned', parsed.rows[0].phoneNumber, '+919845000001');
check('konfhub: refunds skipped', parsed.skippedCancelled, 1);
check(
  'konfhub: problems',
  parsed.problems.map((p) => p.line),
  [5, 6],
);
check(
  'konfhub: missing columns',
  parseKonfhubExport('foo,bar\n1,2').problems[0].reason,
  'Could not find the email and name columns',
);

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks pass');
if (failures) process.exit(1);
