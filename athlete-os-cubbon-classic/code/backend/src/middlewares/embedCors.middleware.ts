import { NextFunction, Request, Response } from 'express';

import { env } from '../config/env';
import { embedService } from '../services/embed.service';
import { isOriginAllowed } from '../services/helpers/embedPricing.helpers';

/**
 * CORS for the public embed endpoint. The global CORS list only knows
 * peakst8's own sites; here each event names the organiser sites that may
 * load it (EventEmbed.allowedOrigins). No cookies are involved, so
 * credentials stay off.
 */
export async function embedCors(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const origin = req.headers.origin;
  res.setHeader('Vary', 'Origin');
  if (!origin) return next();

  const eventId =
    typeof req.params.eventId === 'string' ? req.params.eventId : '';
  const allowed = [
    env.FRONT_END_BASE_URL,
    ...(eventId ? await embedService.getAllowedOrigins(eventId) : []),
  ];
  if (isOriginAllowed(origin, allowed) || origin === env.FRONT_END_BASE_URL) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Max-Age', '600');
  }
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
}
