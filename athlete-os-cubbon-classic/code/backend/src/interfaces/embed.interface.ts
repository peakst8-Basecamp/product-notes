export interface PriceTierRule {
  id: string;
  label: string;
  percentOff: number;
  startsAt: Date | null;
  endsAt: Date;
  capacity: number | null;
  order: number;
}

export interface CouponDiscount {
  offerPercentage: number | null;
  flatDiscountAmount: number | null;
}

export type AppliedDiscount = 'TIER' | 'COUPON' | 'NONE';

export interface ResolvedCheckoutPrice {
  /** Base amount to pass to calculateRegistrationAmount. */
  categoryBaseAmount: number;
  offerPercentage: number | null;
  flatDiscountAmount: number | null;
  priceTierId: string | null;
  appliedDiscount: AppliedDiscount;
}

export interface ResolveCheckoutPriceParams {
  baseAmount: number;
  tier: PriceTierRule | null;
  coupon: CouponDiscount | null;
}

export interface PickActiveTierParams {
  tiers: PriceTierRule[];
  now: Date;
  soldByTierId: Record<string, number>;
}

export interface DisplayPriceParams {
  amount: number;
  gstPercentage: number | null;
  isAmountInclusiveGST: boolean;
}

export interface ImportRowInput {
  externalId: string | null;
  email: string;
  firstName: string;
  lastName: string | null;
  phoneNumber: string | null;
  ticketName: string;
  amountPaid: number;
}

export interface ImportRowProblem {
  line: number;
  reason: string;
}

export interface ParsedImport {
  rows: (ImportRowInput & { line: number })[];
  problems: ImportRowProblem[];
  skippedCancelled: number;
}

export interface PublicEmbedPass {
  id: string;
  name: string;
  description: string | null;
  listPricePaise: number;
  pricePaise: number;
  tier: { id: string; label: string; percentOff: number; endsAt: Date } | null;
  soldOut: boolean;
}

export interface PublicEmbedResponse {
  event: {
    id: string;
    name: string;
    startDate: Date | null;
    venue: string | null;
    openForRegistration: boolean;
  };
  passes: PublicEmbedPass[];
  bulk: { minQuantity: number; percentOff: number } | null;
  brand: { buttonLabel: string | null; accentColor: string | null };
  tracking: { ga4MeasurementId: string | null; metaPixelId: string | null };
  checkoutUrl: string;
}

export interface EmbedSettingsInput {
  isEnabled?: boolean;
  allowedOrigins?: string[];
  buttonLabel?: string | null;
  accentColor?: string | null;
  ga4MeasurementId?: string | null;
  metaPixelId?: string | null;
  bulkMinQuantity?: number | null;
  bulkPercentOff?: number | null;
}

export interface PriceTierInput {
  label: string;
  percentOff: number;
  startsAt?: Date | null;
  endsAt: Date;
  capacity?: number | null;
}

export interface GroupCodeInput {
  groupName: string;
  quantity: number;
  couponCode?: string;
}

export interface PriceForRegistrationParams {
  categoryId: string;
  baseAmount: number;
  coupon: CouponDiscount | null;
  now?: Date;
}

export interface CreateImportedRowRecord extends ImportRowInput {
  categoryId: string | null;
}
