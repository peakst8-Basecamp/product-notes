import { prisma } from '..';
import { Prisma } from '../generated/prisma/client';
import {
  IMPORT_SOURCE,
  IMPORTED_REGISTRATION_STATUS,
  REGISTRATION_STATUS,
} from '../generated/prisma/enums';
import {
  CreateImportedRowRecord,
  EmbedSettingsInput,
  PriceTierInput,
} from '../interfaces/embed.interface';
import {
  EMBED_TIER_SEAT_STATUSES,
  KONFHUB_IMPORT_WAIVER_NOTE,
} from '../lib/embed.constants';

const tierSeatStatuses = EMBED_TIER_SEAT_STATUSES.map(
  (status) => REGISTRATION_STATUS[status],
);

export const embedRepository = {
  async findPublicEmbedEvent(eventId: string) {
    return prisma.event.findFirst({
      where: { id: eventId, isDeleted: false, isWithdrawn: false },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        registrationCloseDate: true,
        isRegistrationClosedManually: true,
        location: { select: { name: true } },
        club: {
          select: {
            clubRegistrationInfo: { select: { gstPercentage: true } },
          },
        },
        embed: true,
        categories: {
          where: { isDeleted: false, isHidden: false },
          orderBy: [{ order: 'asc' }, { baseAmount: 'asc' }],
          select: {
            id: true,
            name: true,
            information: true,
            baseAmount: true,
            isSoldOut: true,
            isRegistrationClosed: true,
            isAmountInclusiveGST: true,
            priceTiers: {
              where: { isDeleted: false },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });
  },

  async findTiersForCategory(categoryId: string) {
    return prisma.categoryPriceTier.findMany({
      where: { categoryId, isDeleted: false },
      orderBy: { order: 'asc' },
    });
  },

  async countSeatsByTier(tierIds: string[]) {
    if (tierIds.length === 0) return {};
    const groups = await prisma.registration.groupBy({
      by: ['priceTierId'],
      where: {
        priceTierId: { in: tierIds },
        isDeleted: false,
        status: { in: tierSeatStatuses },
      },
      _count: { _all: true },
    });
    return Object.fromEntries(
      groups
        .filter((group) => group.priceTierId)
        .map((group) => [group.priceTierId!, group._count._all]),
    ) as Record<string, number>;
  },

  async setRegistrationPriceTier(registrationId: string, priceTierId: string) {
    await prisma.registration.update({
      where: { id: registrationId },
      data: { priceTierId },
    });
  },

  async findEmbedSettings(eventId: string) {
    return prisma.eventEmbed.findUnique({ where: { eventId } });
  },

  async upsertEmbedSettings(eventId: string, input: EmbedSettingsInput) {
    return prisma.eventEmbed.upsert({
      where: { eventId },
      create: { eventId, allowedOrigins: [], ...input },
      update: input,
    });
  },

  async findCategoryInEvent(eventId: string, categoryId: string) {
    return prisma.category.findFirst({
      where: { id: categoryId, eventId, isDeleted: false },
      select: { id: true, name: true, baseAmount: true },
    });
  },

  /** Replaces a pass's tiers. Old tiers are soft-deleted so past registrations keep their link. */
  async replaceTiers(categoryId: string, tiers: PriceTierInput[]) {
    return prisma.$transaction(async (tx) => {
      await tx.categoryPriceTier.updateMany({
        where: { categoryId, isDeleted: false },
        data: { isDeleted: true },
      });
      await tx.categoryPriceTier.createMany({
        data: tiers.map((tier, order) => ({
          categoryId,
          label: tier.label,
          percentOff: tier.percentOff,
          startsAt: tier.startsAt ?? null,
          endsAt: tier.endsAt,
          capacity: tier.capacity ?? null,
          order,
        })),
      });
      return tx.categoryPriceTier.findMany({
        where: { categoryId, isDeleted: false },
        orderBy: { order: 'asc' },
      });
    });
  },

  async tierSalesForEvent(eventId: string) {
    return prisma.categoryPriceTier.findMany({
      where: { category: { eventId } },
      orderBy: [{ categoryId: 'asc' }, { order: 'asc' }],
      select: {
        id: true,
        label: true,
        percentOff: true,
        isDeleted: true,
        category: { select: { name: true } },
        _count: {
          select: {
            registrations: {
              where: {
                isDeleted: false,
                status: REGISTRATION_STATUS.TICKET_GENERATED,
              },
            },
          },
        },
      },
    });
  },

  async isActiveCouponCodeTaken(couponCode: string) {
    const found = await prisma.coupon.findFirst({
      where: { couponCode, isActive: true },
      select: { id: true },
    });
    return Boolean(found);
  },

  /** A group code is an event coupon: one use per entry bought, valid on every pass. */
  async createGroupCode({
    eventId,
    couponCode,
    groupName,
    quantity,
    percentOff,
  }: {
    eventId: string;
    couponCode: string;
    groupName: string;
    quantity: number;
    percentOff: number;
  }) {
    return prisma.coupon.create({
      data: {
        couponCode,
        leadName: groupName,
        offerPercentage: percentOff,
        totalUsageLimit: quantity,
        isGlobal: false,
        isActive: true,
        couponToEvents: { create: { eventId } },
      },
      select: {
        id: true,
        couponCode: true,
        leadName: true,
        offerPercentage: true,
        totalUsageLimit: true,
      },
    });
  },

  // --- Imports ---------------------------------------------------------------

  async findCategoriesForImport(eventId: string) {
    return prisma.category.findMany({
      where: { eventId, isDeleted: false },
      select: { id: true, name: true, capacity: true },
    });
  },

  async createImport({
    eventId,
    createdById,
    fileName,
    rows,
  }: {
    eventId: string;
    createdById: string;
    fileName: string | null;
    rows: CreateImportedRowRecord[];
  }) {
    return prisma.registrationImport.create({
      data: {
        eventId,
        createdById,
        fileName,
        source: IMPORT_SOURCE.KONFHUB,
        totalRows: rows.length,
        rows: {
          createMany: {
            data: rows.map((row) => ({
              externalId: row.externalId,
              email: row.email,
              firstName: row.firstName,
              lastName: row.lastName,
              phoneNumber: row.phoneNumber,
              ticketName: row.ticketName,
              categoryId: row.categoryId,
              amountPaid: row.amountPaid,
              status: row.categoryId
                ? IMPORTED_REGISTRATION_STATUS.PENDING
                : IMPORTED_REGISTRATION_STATUS.INVALID,
              error: row.categoryId ? null : 'No pass matched this ticket name',
            })),
          },
        },
      },
      select: { id: true, totalRows: true },
    });
  },

  async findPendingImportRows(importId: string) {
    return prisma.importedRegistration.findMany({
      where: { importId, status: IMPORTED_REGISTRATION_STATUS.PENDING },
      orderBy: { createdAt: 'asc' },
    });
  },

  async findImport(eventId: string, importId: string) {
    return prisma.registrationImport.findFirst({
      where: { id: importId, eventId },
      include: {
        rows: {
          where: {
            status: {
              in: [
                IMPORTED_REGISTRATION_STATUS.DUPLICATE,
                IMPORTED_REGISTRATION_STATUS.INVALID,
                IMPORTED_REGISTRATION_STATUS.FAILED,
              ],
            },
          },
          select: { email: true, ticketName: true, status: true, error: true },
        },
      },
    });
  },

  async markImportRow(
    rowId: string,
    data: Prisma.ImportedRegistrationUncheckedUpdateInput,
  ) {
    await prisma.importedRegistration.update({ where: { id: rowId }, data });
  },

  async completeImport(importId: string) {
    const counts = await prisma.importedRegistration.groupBy({
      by: ['status'],
      where: { importId },
      _count: { _all: true },
    });
    const count = (status: IMPORTED_REGISTRATION_STATUS) =>
      counts.find((c) => c.status === status)?._count._all ?? 0;
    await prisma.registrationImport.update({
      where: { id: importId },
      data: {
        issuedCount: count(IMPORTED_REGISTRATION_STATUS.TICKET_ISSUED),
        duplicateCount: count(IMPORTED_REGISTRATION_STATUS.DUPLICATE),
        invalidCount: count(IMPORTED_REGISTRATION_STATUS.INVALID),
        failedCount: count(IMPORTED_REGISTRATION_STATUS.FAILED),
        completedAt: new Date(),
      },
    });
  },

  async findUserByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, isDeleted: false },
      select: { id: true },
    });
  },

  async createImportedUser({
    email,
    firstName,
    lastName,
    phoneNumber,
  }: {
    email: string;
    firstName: string;
    lastName: string | null;
    phoneNumber: string | null;
  }) {
    return prisma.user.create({
      data: { email, firstName, lastName, phoneNumber },
      select: { id: true },
    });
  },

  async findLiveRegistration(eventId: string, userId: string) {
    return prisma.registration.findFirst({
      where: { eventId, userId, isDeleted: false },
      select: { id: true, status: true },
    });
  },

  async countConfirmedInCategory(categoryId: string) {
    return prisma.registration.count({
      where: {
        categoryId,
        isDeleted: false,
        status: REGISTRATION_STATUS.TICKET_GENERATED,
      },
    });
  },

  async createImportedRegistration({
    eventId,
    categoryId,
    userId,
  }: {
    eventId: string;
    categoryId: string;
    userId: string;
  }) {
    return prisma.registration.create({
      data: {
        eventId,
        categoryId,
        userId,
        status: REGISTRATION_STATUS.PAYMENT_PENDING,
        utmSource: 'konfhub-import',
        acceptedWaiverContent: KONFHUB_IMPORT_WAIVER_NOTE,
      },
      select: { id: true },
    });
  },

  async setTicketSoldPrice(registrationId: string, soldTotalPrice: number) {
    await prisma.ticket.updateMany({
      where: { registration: { some: { id: registrationId } } },
      data: { soldTotalPrice },
    });
  },
};
