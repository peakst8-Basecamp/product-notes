import { Request, Response } from 'express';
import { ZodType } from 'zod';

import { getSessionUserId, parseRequestDto } from '../lib';
import {
  cancelPlanBodyDto,
  clubParamsDto,
  createPerkBodyDto,
  createPlanBodyDto,
  createPlanCouponBodyDto,
  eligiblePlansQueryDto,
  endPlanBodyDto,
  holdersQueryDto,
  idParamsDto,
  joinPlanBodyDto,
  membershipSettingsBodyDto,
  pausePlanBodyDto,
  reviewRequestBodyDto,
  setCategoryPoliciesBodyDto,
  setCreditsBodyDto,
  setPerkActiveBodyDto,
  updatePlanBodyDto,
} from '../dto/membership.dto';
import { membershipService } from '../services/membership.service';
import { membershipHostService } from '../services/membershipHost.service';

const parseParams = <T>({
  schema,
  req,
}: {
  schema: ZodType<T>;
  req: Request;
}): T => parseRequestDto({ schema, data: req.params });
const parseBody = <T>({
  schema,
  req,
}: {
  schema: ZodType<T>;
  req: Request;
}): T => parseRequestDto({ schema, data: req.body });
// Routes using this sit behind requiredRBAC, so the session user is always set.
const sessionUserId = (req: Request): string => getSessionUserId({ req })!;

export const membershipController = {
  /* ---------- public ---------- */
  listPublicPlans: async (req: Request, res: Response) => {
    const { clubId } = parseParams({ schema: clubParamsDto, req });
    res.status(200).json(await membershipService.listPublicPlans({ clubId }));
  },
  listClubPerks: async (req: Request, res: Response) => {
    const { clubId } = parseParams({ schema: clubParamsDto, req });
    res.status(200).json(await membershipService.listClubPerks({ clubId }));
  },

  /* ---------- member ---------- */
  listClubPerksForMe: async (req: Request, res: Response) => {
    const { clubId } = parseParams({ schema: clubParamsDto, req });
    res.status(200).json(
      await membershipService.listClubPerks({
        clubId,
        userId: sessionUserId(req),
      }),
    );
  },
  getMyPlans: async (req: Request, res: Response) => {
    res
      .status(200)
      .json(await membershipService.getMyPlans({ userId: sessionUserId(req) }));
  },
  getEligiblePlans: async (req: Request, res: Response) => {
    const { eventId, categoryId } = parseRequestDto({
      schema: eligiblePlansQueryDto,
      data: req.query,
    });
    const { best, candidates, baseAmount, isPlanHoldersOnly } =
      await membershipService.priceCategoryForMember({
        userId: sessionUserId(req),
        eventId,
        categoryId,
      });
    res.status(200).json({ best, candidates, baseAmount, isPlanHoldersOnly });
  },
  joinPlan: async (req: Request, res: Response) => {
    const { id: planId } = parseParams({ schema: idParamsDto, req });
    const { planPriceId, useIntroOffer, couponCode } = parseBody({
      schema: joinPlanBodyDto,
      req,
    });
    res.status(200).json(
      await membershipService.joinPlan({
        userId: sessionUserId(req),
        planId,
        planPriceId,
        useIntroOffer,
        couponCode,
      }),
    );
  },
  cancelMyPlan: async (req: Request, res: Response) => {
    const { id: userPlanId } = parseParams({ schema: idParamsDto, req });
    const { reason } = parseBody({ schema: cancelPlanBodyDto, req });
    res.status(200).json(
      await membershipService.cancelMyPlan({
        userId: sessionUserId(req),
        userPlanId,
        reason,
      }),
    );
  },
  withdrawJoinRequest: async (req: Request, res: Response) => {
    const { id: joinRequestId } = parseParams({ schema: idParamsDto, req });
    res.status(200).json(
      await membershipService.withdrawJoinRequest({
        userId: sessionUserId(req),
        joinRequestId,
      }),
    );
  },
  sendGuestPass: async (req: Request, res: Response) => {
    const { id: userPlanId } = parseParams({ schema: idParamsDto, req });
    res.status(200).json(
      await membershipService.sendGuestPass({
        userId: sessionUserId(req),
        userPlanId,
      }),
    );
  },
  revealPerk: async (req: Request, res: Response) => {
    const { id: perkId } = parseParams({ schema: idParamsDto, req });
    res.status(200).json(
      await membershipService.revealPerk({
        userId: sessionUserId(req),
        perkId,
      }),
    );
  },

  /* ---------- club admin ---------- */
  createPlan: async (req: Request, res: Response) => {
    const { clubId } = parseParams({ schema: clubParamsDto, req });
    const body = parseBody({ schema: createPlanBodyDto, req });
    res.status(201).json(
      await membershipHostService.createPlan({
        ...body,
        userId: sessionUserId(req),
        clubId,
      }),
    );
  },
  updatePlan: async (req: Request, res: Response) => {
    const { id: planId } = parseParams({ schema: idParamsDto, req });
    const body = parseBody({ schema: updatePlanBodyDto, req });
    res.status(200).json(
      await membershipHostService.updatePlan({
        ...body,
        userId: sessionUserId(req),
        planId,
      }),
    );
  },
  setCategoryPolicies: async (req: Request, res: Response) => {
    const { id: categoryId } = parseParams({ schema: idParamsDto, req });
    const { policies } = parseBody({ schema: setCategoryPoliciesBodyDto, req });
    res.status(200).json(
      await membershipHostService.setCategoryPolicies({
        userId: sessionUserId(req),
        categoryId,
        policies,
      }),
    );
  },
  listHolders: async (req: Request, res: Response) => {
    const { clubId } = parseParams({ schema: clubParamsDto, req });
    const { status } = parseRequestDto({
      schema: holdersQueryDto,
      data: req.query,
    });
    res.status(200).json(
      await membershipHostService.listHolders({
        userId: sessionUserId(req),
        clubId,
        status,
      }),
    );
  },
  pauseUserPlan: async (req: Request, res: Response) => {
    const { id: userPlanId } = parseParams({ schema: idParamsDto, req });
    const { pauseUntil } = parseBody({ schema: pausePlanBodyDto, req });
    res.status(200).json(
      await membershipHostService.pauseUserPlan({
        userId: sessionUserId(req),
        userPlanId,
        pauseUntil,
      }),
    );
  },
  resumeUserPlan: async (req: Request, res: Response) => {
    const { id: userPlanId } = parseParams({ schema: idParamsDto, req });
    res.status(200).json(
      await membershipHostService.resumeUserPlan({
        userId: sessionUserId(req),
        userPlanId,
      }),
    );
  },
  cancelUserPlan: async (req: Request, res: Response) => {
    const { id: userPlanId } = parseParams({ schema: idParamsDto, req });
    const { isImmediate } = parseBody({ schema: endPlanBodyDto, req });
    res.status(200).json(
      await membershipHostService.cancelUserPlan({
        userId: sessionUserId(req),
        userPlanId,
        isImmediate,
      }),
    );
  },
  setCredits: async (req: Request, res: Response) => {
    const { id: userPlanId } = parseParams({ schema: idParamsDto, req });
    const { credits } = parseBody({ schema: setCreditsBodyDto, req });
    res.status(200).json(
      await membershipHostService.setCredits({
        userId: sessionUserId(req),
        userPlanId,
        credits,
      }),
    );
  },
  reviewJoinRequest: async (req: Request, res: Response) => {
    const { id: joinRequestId } = parseParams({ schema: idParamsDto, req });
    const { isApproved } = parseBody({ schema: reviewRequestBodyDto, req });
    res.status(200).json(
      await membershipHostService.reviewJoinRequest({
        userId: sessionUserId(req),
        joinRequestId,
        isApproved,
      }),
    );
  },
  reviewCancelRequest: async (req: Request, res: Response) => {
    const { id: cancelRequestId } = parseParams({ schema: idParamsDto, req });
    const { isApproved } = parseBody({ schema: reviewRequestBodyDto, req });
    res.status(200).json(
      await membershipHostService.reviewCancelRequest({
        userId: sessionUserId(req),
        cancelRequestId,
        isApproved,
      }),
    );
  },
  upsertSettings: async (req: Request, res: Response) => {
    const { clubId } = parseParams({ schema: clubParamsDto, req });
    const body = parseBody({ schema: membershipSettingsBodyDto, req });
    res.status(200).json(
      await membershipHostService.upsertSettings({
        ...body,
        userId: sessionUserId(req),
        clubId,
      }),
    );
  },
  createPerk: async (req: Request, res: Response) => {
    const { clubId } = parseParams({ schema: clubParamsDto, req });
    const body = parseBody({ schema: createPerkBodyDto, req });
    res.status(201).json(
      await membershipHostService.createPerk({
        ...body,
        userId: sessionUserId(req),
        clubId,
      }),
    );
  },
  setPerkActive: async (req: Request, res: Response) => {
    const { id: perkId } = parseParams({ schema: idParamsDto, req });
    const { isActive } = parseBody({ schema: setPerkActiveBodyDto, req });
    res.status(200).json(
      await membershipHostService.setPerkActive({
        userId: sessionUserId(req),
        perkId,
        isActive,
      }),
    );
  },
  listPerksWithReveals: async (req: Request, res: Response) => {
    const { clubId } = parseParams({ schema: clubParamsDto, req });
    res.status(200).json(
      await membershipHostService.listPerksWithReveals({
        userId: sessionUserId(req),
        clubId,
      }),
    );
  },
  createPlanCoupon: async (req: Request, res: Response) => {
    const { clubId } = parseParams({ schema: clubParamsDto, req });
    const body = parseBody({ schema: createPlanCouponBodyDto, req });
    res.status(201).json(
      await membershipHostService.createPlanCoupon({
        ...body,
        userId: sessionUserId(req),
        clubId,
      }),
    );
  },
};
