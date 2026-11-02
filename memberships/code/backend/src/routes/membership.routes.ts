import express from 'express';

import { membershipController } from '../controllers/membership.controller';
import { requiredRBAC } from '../middlewares';

// Mount at /plans in src/index.ts, next to the other feature routers.
export const membershipRoutes = express.Router();

/* Public: the club page's Plans section and perks page. */
membershipRoutes.get('/club/:clubId', membershipController.listPublicPlans);
membershipRoutes.get('/club/:clubId/perks', membershipController.listClubPerks);

/* Member. */
membershipRoutes.get('/me', requiredRBAC('*'), membershipController.getMyPlans);
membershipRoutes.get(
  '/me/eligible',
  requiredRBAC('*'),
  membershipController.getEligiblePlans,
);
membershipRoutes.get(
  '/club/:clubId/perks/me',
  requiredRBAC('*'),
  membershipController.listClubPerksForMe,
);
membershipRoutes.post(
  '/:id/join',
  requiredRBAC('*'),
  membershipController.joinPlan,
);
membershipRoutes.post(
  '/me/:id/cancel',
  requiredRBAC('*'),
  membershipController.cancelMyPlan,
);
membershipRoutes.post(
  '/me/:id/guest-passes',
  requiredRBAC('*'),
  membershipController.sendGuestPass,
);
membershipRoutes.post(
  '/join-requests/:id/withdraw',
  requiredRBAC('*'),
  membershipController.withdrawJoinRequest,
);
membershipRoutes.post(
  '/perks/:id/reveal',
  requiredRBAC('*'),
  membershipController.revealPerk,
);

/* Club admin. Ownership of the club is re-checked in membershipHostService. */
const host = requiredRBAC(['HOST']);
membershipRoutes.post(
  '/host/club/:clubId',
  host,
  membershipController.createPlan,
);
membershipRoutes.patch('/host/:id', host, membershipController.updatePlan);
membershipRoutes.put(
  '/host/categories/:id/policies',
  host,
  membershipController.setCategoryPolicies,
);
membershipRoutes.get(
  '/host/club/:clubId/holders',
  host,
  membershipController.listHolders,
);
membershipRoutes.post(
  '/host/user-plans/:id/pause',
  host,
  membershipController.pauseUserPlan,
);
membershipRoutes.post(
  '/host/user-plans/:id/resume',
  host,
  membershipController.resumeUserPlan,
);
membershipRoutes.post(
  '/host/user-plans/:id/cancel',
  host,
  membershipController.cancelUserPlan,
);
membershipRoutes.post(
  '/host/user-plans/:id/credits',
  host,
  membershipController.setCredits,
);
membershipRoutes.post(
  '/host/join-requests/:id/review',
  host,
  membershipController.reviewJoinRequest,
);
membershipRoutes.post(
  '/host/cancel-requests/:id/review',
  host,
  membershipController.reviewCancelRequest,
);
membershipRoutes.put(
  '/host/club/:clubId/settings',
  host,
  membershipController.upsertSettings,
);
membershipRoutes.get(
  '/host/club/:clubId/perks',
  host,
  membershipController.listPerksWithReveals,
);
membershipRoutes.post(
  '/host/club/:clubId/perks',
  host,
  membershipController.createPerk,
);
membershipRoutes.patch(
  '/host/perks/:id',
  host,
  membershipController.setPerkActive,
);
membershipRoutes.post(
  '/host/club/:clubId/discounts',
  host,
  membershipController.createPlanCoupon,
);
