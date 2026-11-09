import { randomBytes } from 'crypto';

import { env } from '../config/env';
import { IMPORTED_REGISTRATION_STATUS } from '../generated/prisma/enums';
import {
  EmbedSettingsInput,
  GroupCodeInput,
  PriceForRegistrationParams,
  PriceTierInput,
  PriceTierRule,
  PublicEmbedResponse,
  ResolvedCheckoutPrice,
} from '../interfaces/embed.interface';
import {
  ErrorResponse,
  generateTicketImage,
  generateTicketQRUrl,
  logger,
} from '../lib';
import {
  EMBED_GROUP_CODE_PREFIX,
  EMBED_MAX_IMPORT_ROWS,
} from '../lib/embed.constants';
import { embedRepository } from '../repositories/embed.repository';
import { eventRepository } from '../repositories/event.repository';
import { registrationRepository } from '../repositories/registration.repository';
import {
  displayPricePaise,
  normalizeOrigin,
  parseKonfhubExport,
  pickActiveTier,
  resolveCheckoutPrice,
  validatePriceTiers,
} from './helpers/embedPricing.helpers';

const toTierRule = (tier: {
  id: string;
  label: string;
  percentOff: number;
  startsAt: Date | null;
  endsAt: Date;
  capacity: number | null;
  order: number;
}): PriceTierRule => ({
  id: tier.id,
  label: tier.label,
  percentOff: tier.percentOff,
  startsAt: tier.startsAt,
  endsAt: tier.endsAt,
  capacity: tier.capacity,
  order: tier.order,
});

const normalizeTicketName = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

async function assertHost(eventId: string, userId: string) {
  const event = await eventRepository.findHostedEventAccess(eventId, userId);
  if (!event) throw ErrorResponse.forbidden('You do not host this event');
  return event;
}

export const embedService = {
  /** Public: what the loader renders on the organiser's site. */
  async getPublicEmbed(eventId: string): Promise<PublicEmbedResponse> {
    const event = await embedRepository.findPublicEmbedEvent(eventId);
    if (!event?.embed?.isEnabled) {
      throw ErrorResponse.notFound('Embed is not switched on for this event');
    }

    const now = new Date();
    const tierIds = event.categories.flatMap((c) =>
      c.priceTiers.map((t) => t.id),
    );
    const soldByTierId = await embedRepository.countSeatsByTier(tierIds);
    const gstPercentage =
      event.club.clubRegistrationInfo?.gstPercentage ?? null;

    const openForRegistration =
      !event.isRegistrationClosedManually &&
      (!event.registrationCloseDate || event.registrationCloseDate > now) &&
      (!event.startDate || event.startDate > now);

    const passes = event.categories.map((category) => {
      const tier = pickActiveTier({
        tiers: category.priceTiers.map(toTierRule),
        now,
        soldByTierId,
      });
      const { categoryBaseAmount } = resolveCheckoutPrice({
        baseAmount: category.baseAmount,
        tier,
        coupon: null,
      });
      const price = (amount: number) =>
        displayPricePaise({
          amount,
          gstPercentage,
          isAmountInclusiveGST: category.isAmountInclusiveGST,
        });
      return {
        id: category.id,
        name: category.name,
        description: category.information ?? null,
        listPricePaise: price(category.baseAmount),
        pricePaise: price(categoryBaseAmount),
        tier: tier
          ? {
              id: tier.id,
              label: tier.label,
              percentOff: tier.percentOff,
              endsAt: tier.endsAt,
            }
          : null,
        soldOut: category.isSoldOut || category.isRegistrationClosed,
      };
    });

    const { embed } = event;
    return {
      event: {
        id: event.id,
        name: event.name,
        startDate: event.startDate,
        venue: event.location?.name ?? null,
        openForRegistration,
      },
      passes,
      bulk:
        embed.bulkMinQuantity && embed.bulkPercentOff
          ? {
              minQuantity: embed.bulkMinQuantity,
              percentOff: embed.bulkPercentOff,
            }
          : null,
      brand: { buttonLabel: embed.buttonLabel, accentColor: embed.accentColor },
      tracking: {
        ga4MeasurementId: embed.ga4MeasurementId,
        metaPixelId: embed.metaPixelId,
      },
      checkoutUrl: `${env.FRONT_END_BASE_URL}/event/${encodeURIComponent(event.id)}`,
    };
  },

  /** Origins allowed to call the public endpoint for this event. */
  async getAllowedOrigins(eventId: string): Promise<string[]> {
    const embed = await embedRepository.findEmbedSettings(eventId);
    return embed?.isEnabled ? embed.allowedOrigins : [];
  },

  /**
   * Checkout hook, called from registrationService.register before
   * calculateRegistrationAmount. Works for every registration, embedded or
   * not, so the early-bird price is the same on ps8.club and the race site.
   */
  async priceForRegistration({
    categoryId,
    baseAmount,
    coupon,
    now = new Date(),
  }: PriceForRegistrationParams): Promise<ResolvedCheckoutPrice> {
    const tiers = (await embedRepository.findTiersForCategory(categoryId)).map(
      toTierRule,
    );
    const soldByTierId = await embedRepository.countSeatsByTier(
      tiers.map((t) => t.id),
    );
    const tier = pickActiveTier({ tiers, now, soldByTierId });
    return resolveCheckoutPrice({ baseAmount, tier, coupon });
  },

  async recordPriceTier(registrationId: string, priceTierId: string | null) {
    if (!priceTierId) return;
    await embedRepository.setRegistrationPriceTier(registrationId, priceTierId);
  },

  // --- Organiser ---------------------------------------------------------------

  async getSettings({ eventId, userId }: { eventId: string; userId: string }) {
    await assertHost(eventId, userId);
    const [settings, tierSales] = await Promise.all([
      embedRepository.findEmbedSettings(eventId),
      embedRepository.tierSalesForEvent(eventId),
    ]);
    return {
      settings,
      snippet: `<div data-peakst8-event="${eventId}" data-mode="passes"></div>\n<script src="${env.FRONT_END_BASE_URL}/embed/v1.js" async></script>`,
      tierSales: tierSales.map((tier) => ({
        id: tier.id,
        pass: tier.category.name,
        label: tier.label,
        percentOff: tier.percentOff,
        active: !tier.isDeleted,
        ticketsSold: tier._count.registrations,
      })),
    };
  },

  async updateSettings({
    eventId,
    userId,
    input,
  }: {
    eventId: string;
    userId: string;
    input: EmbedSettingsInput;
  }) {
    await assertHost(eventId, userId);
    const next = { ...input };
    if (input.allowedOrigins) {
      const normalized = input.allowedOrigins.map((origin) => ({
        origin,
        value: normalizeOrigin(origin),
      }));
      const invalid = normalized.filter((o) => !o.value).map((o) => o.origin);
      if (invalid.length) {
        throw ErrorResponse.badRequest(
          `These websites aren't valid https addresses: ${invalid.join(', ')}`,
        );
      }
      next.allowedOrigins = [...new Set(normalized.map((o) => o.value!))];
    }
    const touchesBulk =
      input.bulkMinQuantity !== undefined || input.bulkPercentOff !== undefined;
    const hasMinimum =
      input.bulkMinQuantity !== undefined && input.bulkMinQuantity !== null;
    const hasDiscount =
      input.bulkPercentOff !== undefined && input.bulkPercentOff !== null;
    if (touchesBulk && hasMinimum !== hasDiscount) {
      throw ErrorResponse.badRequest(
        'Set both the bulk minimum and the bulk discount, or neither',
      );
    }
    return embedRepository.upsertEmbedSettings(eventId, next);
  },

  async replaceTiers({
    eventId,
    categoryId,
    userId,
    tiers,
  }: {
    eventId: string;
    categoryId: string;
    userId: string;
    tiers: PriceTierInput[];
  }) {
    await assertHost(eventId, userId);
    const category = await embedRepository.findCategoryInEvent(
      eventId,
      categoryId,
    );
    if (!category) throw ErrorResponse.notFound('Pass not found in this event');
    const problem = validatePriceTiers(tiers);
    if (problem) throw ErrorResponse.badRequest(problem);
    return embedRepository.replaceTiers(categoryId, tiers);
  },

  /** Bulk buy: a code for a company or club, one use per entry, at the bulk discount. */
  async createGroupCode({
    eventId,
    userId,
    input,
  }: {
    eventId: string;
    userId: string;
    input: GroupCodeInput;
  }) {
    await assertHost(eventId, userId);
    const embed = await embedRepository.findEmbedSettings(eventId);
    if (!embed?.bulkMinQuantity || !embed.bulkPercentOff) {
      throw ErrorResponse.badRequest('Set a bulk minimum and discount first');
    }
    if (input.quantity < embed.bulkMinQuantity) {
      throw ErrorResponse.badRequest(
        `Bulk buys start at ${embed.bulkMinQuantity} entries`,
      );
    }
    const couponCode = (
      input.couponCode ??
      `${EMBED_GROUP_CODE_PREFIX}${randomBytes(3).toString('hex')}`
    ).toUpperCase();
    if (await embedRepository.isActiveCouponCodeTaken(couponCode)) {
      throw ErrorResponse.Conflict(`${couponCode} is already in use`);
    }
    return embedRepository.createGroupCode({
      eventId,
      couponCode,
      groupName: input.groupName,
      quantity: input.quantity,
      percentOff: embed.bulkPercentOff,
    });
  },

  // --- KonfHub import ------------------------------------------------------------

  /** Reads the file and shows what would happen. Writes nothing. */
  async previewImport({
    eventId,
    userId,
    csv,
    categoryMap,
  }: {
    eventId: string;
    userId: string;
    csv: string;
    categoryMap?: Record<string, string>;
  }) {
    await assertHost(eventId, userId);
    const parsed = parseKonfhubExport(csv);
    if (parsed.rows.length > EMBED_MAX_IMPORT_ROWS) {
      throw ErrorResponse.badRequest(
        `Import up to ${EMBED_MAX_IMPORT_ROWS} rows at a time`,
      );
    }
    const categories = await embedRepository.findCategoriesForImport(eventId);
    const resolveCategory = buildCategoryResolver(categories, categoryMap);
    const ticketNames = [...new Set(parsed.rows.map((r) => r.ticketName))].map(
      (name) => ({
        ticketName: name,
        rows: parsed.rows.filter((r) => r.ticketName === name).length,
        categoryId: resolveCategory(name),
      }),
    );
    return {
      rowsReady: parsed.rows.length,
      skippedCancelled: parsed.skippedCancelled,
      problems: parsed.problems,
      ticketNames,
      unmatchedTicketNames: ticketNames
        .filter((t) => !t.categoryId)
        .map((t) => t.ticketName),
      passes: categories.map((c) => ({ id: c.id, name: c.name })),
      totalPaid: parsed.rows.reduce((sum, r) => sum + r.amountPaid, 0),
    };
  },

  /** Saves the rows and issues tickets in the background. Poll getImport for progress. */
  async startImport({
    eventId,
    userId,
    csv,
    fileName,
    categoryMap,
  }: {
    eventId: string;
    userId: string;
    csv: string;
    fileName?: string;
    categoryMap?: Record<string, string>;
  }) {
    await assertHost(eventId, userId);
    const parsed = parseKonfhubExport(csv);
    if (parsed.rows.length === 0) {
      throw ErrorResponse.badRequest('No registrations found in this file');
    }
    if (parsed.rows.length > EMBED_MAX_IMPORT_ROWS) {
      throw ErrorResponse.badRequest(
        `Import up to ${EMBED_MAX_IMPORT_ROWS} rows at a time`,
      );
    }
    const categories = await embedRepository.findCategoriesForImport(eventId);
    const resolveCategory = buildCategoryResolver(categories, categoryMap);
    const created = await embedRepository.createImport({
      eventId,
      createdById: userId,
      fileName: fileName ?? null,
      rows: parsed.rows.map((row) => ({
        ...row,
        categoryId: resolveCategory(row.ticketName),
      })),
    });

    void issueImportedTickets(eventId, created.id).catch((error: unknown) => {
      logger.error(
        { error, importId: created.id },
        '[EmbedImport] import stopped',
      );
    });

    return {
      importId: created.id,
      totalRows: created.totalRows,
      problems: parsed.problems,
      skippedCancelled: parsed.skippedCancelled,
    };
  },

  async getImport({
    eventId,
    importId,
    userId,
  }: {
    eventId: string;
    importId: string;
    userId: string;
  }) {
    await assertHost(eventId, userId);
    const found = await embedRepository.findImport(eventId, importId);
    if (!found) throw ErrorResponse.notFound('Import not found');
    return found;
  },
};

function buildCategoryResolver(
  categories: { id: string; name: string }[],
  categoryMap?: Record<string, string>,
) {
  const byName = new Map(
    categories.map((c) => [normalizeTicketName(c.name), c.id]),
  );
  const ids = new Set(categories.map((c) => c.id));
  return (ticketName: string): string | null => {
    const mapped = categoryMap?.[ticketName];
    if (mapped && ids.has(mapped)) return mapped;
    if (categories.length === 1) return categories[0].id;
    return byName.get(normalizeTicketName(ticketName)) ?? null;
  };
}

/**
 * One row at a time: find or create the runner, skip anyone already
 * registered, create the registration and issue a real peakst8 ticket
 * (QR + ticket image) with the amount they paid on KonfHub.
 * No confirmation email is sent here; the "your entry has moved" emailer
 * goes out separately once the import is checked.
 */
async function issueImportedTickets(eventId: string, importId: string) {
  const event = await embedRepository.findPublicEmbedEvent(eventId);
  if (!event) throw ErrorResponse.notFound('Event not found');
  const categories = await embedRepository.findCategoriesForImport(eventId);
  const rows = await embedRepository.findPendingImportRows(importId);
  const confirmed = new Map<string, number>();

  for (const row of rows) {
    const category = categories.find((c) => c.id === row.categoryId);
    if (!category) {
      await embedRepository.markImportRow(row.id, {
        status: IMPORTED_REGISTRATION_STATUS.INVALID,
        error: 'No pass matched this ticket name',
      });
      continue;
    }
    try {
      const user =
        (await embedRepository.findUserByEmail(row.email)) ??
        (await embedRepository.createImportedUser(row));

      const existing = await embedRepository.findLiveRegistration(
        eventId,
        user.id,
      );
      if (existing) {
        await embedRepository.markImportRow(row.id, {
          status: IMPORTED_REGISTRATION_STATUS.DUPLICATE,
          error: `Already registered on peakst8 (${existing.status})`,
          userId: user.id,
          registrationId: existing.id,
        });
        continue;
      }

      if (!confirmed.has(category.id)) {
        confirmed.set(
          category.id,
          await embedRepository.countConfirmedInCategory(category.id),
        );
      }
      const confirmedCount = confirmed.get(category.id) ?? 0;

      const registration = await embedRepository.createImportedRegistration({
        eventId,
        categoryId: category.id,
        userId: user.id,
      });
      const { qrUrl: qrCodeUrl } = await generateTicketQRUrl({
        categoryName: category.name,
        eventName: event.name,
        registrationId: registration.id,
      });
      const { fullName, teamName, eventDate } =
        await registrationRepository.getUserInfoFromRegistrationId(
          registration.id,
        );
      const ticketImageUrl = await generateTicketImage({
        eventName: event.name,
        categoryName: category.name,
        registrationId: registration.id,
        eventLocation: event.location?.name ?? '',
        displayName: teamName || fullName,
        qrDataUri: qrCodeUrl,
        eventDate,
      });
      await registrationRepository.finalizeTicket({
        registrationId: registration.id,
        qrCodeUrl,
        ticketImageUrl,
        confirmedRegistrationCount: confirmedCount,
        capacity: category.capacity,
      });
      await embedRepository.setTicketSoldPrice(registration.id, row.amountPaid);
      confirmed.set(category.id, confirmedCount + 1);

      await embedRepository.markImportRow(row.id, {
        status: IMPORTED_REGISTRATION_STATUS.TICKET_ISSUED,
        userId: user.id,
        registrationId: registration.id,
      });
    } catch (error) {
      logger.error({ error, rowId: row.id }, '[EmbedImport] row failed');
      await embedRepository.markImportRow(row.id, {
        status: IMPORTED_REGISTRATION_STATUS.FAILED,
        error:
          error instanceof Error
            ? error.message.slice(0, 500)
            : 'Unknown error',
      });
    }
  }

  await embedRepository.completeImport(importId);
  logger.info({ importId, rows: rows.length }, '[EmbedImport] import finished');
}
