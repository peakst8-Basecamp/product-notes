import express from 'express';

import { embedController } from '../controllers/embed.controller';
import { requiredRBAC } from '../middlewares/auth.middlewares';
import { embedCors } from '../middlewares/embedCors.middleware';

export const embedRoutes = express.Router();

// Public: read by /embed/v1.js on the organiser's own website.
embedRoutes.options('/v1/events/:eventId', embedCors);
embedRoutes.get(
  '/v1/events/:eventId',
  embedCors,
  embedController.getPublicEmbed,
);

// Organiser: settings, early-bird tiers, group codes, KonfHub import.
embedRoutes.get(
  '/events/:eventId/settings',
  requiredRBAC(['HOST']),
  embedController.getSettings,
);
embedRoutes.put(
  '/events/:eventId/settings',
  requiredRBAC(['HOST']),
  embedController.updateSettings,
);
embedRoutes.put(
  '/events/:eventId/categories/:categoryId/tiers',
  requiredRBAC(['HOST']),
  embedController.replaceTiers,
);
embedRoutes.post(
  '/events/:eventId/group-codes',
  requiredRBAC(['HOST']),
  embedController.createGroupCode,
);
embedRoutes.post(
  '/events/:eventId/imports/konfhub/preview',
  requiredRBAC(['HOST']),
  embedController.previewImport,
);
embedRoutes.post(
  '/events/:eventId/imports/konfhub',
  requiredRBAC(['HOST']),
  embedController.startImport,
);
embedRoutes.get(
  '/events/:eventId/imports/:importId',
  requiredRBAC(['HOST']),
  embedController.getImport,
);
