import { z } from 'zod';

const eventId = z.string().trim().min(1).max(191);

export const embedEventParamsDto = z.object({ eventId }).strip();

export const embedCategoryParamsDto = z
  .object({ eventId, categoryId: z.uuid() })
  .strip();

export const embedImportParamsDto = z
  .object({ eventId, importId: z.uuid() })
  .strip();

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Use a color like #ff5a1f');

export const embedSettingsBodyDto = z
  .object({
    isEnabled: z.boolean().optional(),
    allowedOrigins: z.array(z.string().trim().min(1)).max(20).optional(),
    buttonLabel: z.string().trim().min(1).max(40).nullable().optional(),
    accentColor: hexColor.nullable().optional(),
    ga4MeasurementId: z
      .string()
      .regex(/^G-[A-Z0-9]+$/, 'GA4 ids look like G-XXXXXXX')
      .nullable()
      .optional(),
    metaPixelId: z
      .string()
      .regex(/^[0-9]{6,20}$/, 'Meta pixel ids are numbers')
      .nullable()
      .optional(),
    bulkMinQuantity: z.number().int().min(2).max(1000).nullable().optional(),
    bulkPercentOff: z.number().gt(0).lt(100).nullable().optional(),
  })
  .strip();

export const embedTiersBodyDto = z
  .object({
    tiers: z
      .array(
        z
          .object({
            label: z.string().trim().min(1).max(60),
            percentOff: z.number().gt(0).lt(100),
            startsAt: z.coerce.date().nullable().optional(),
            endsAt: z.coerce.date(),
            capacity: z.number().int().min(1).nullable().optional(),
          })
          .strip(),
      )
      .max(10),
  })
  .strip();

export const embedGroupCodeBodyDto = z
  .object({
    groupName: z.string().trim().min(1).max(120),
    quantity: z.number().int().min(2).max(5000),
    couponCode: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z0-9-]{4,24}$/,
        'Codes are 4 to 24 letters, numbers or dashes',
      )
      .optional(),
  })
  .strip();

export const embedImportBodyDto = z
  .object({
    csv: z.string().min(1).max(20_000_000),
    fileName: z.string().trim().max(200).optional(),
    /** KonfHub ticket name → peakst8 pass id, for names that don't match exactly. */
    categoryMap: z.record(z.string(), z.uuid()).optional(),
  })
  .strip();
