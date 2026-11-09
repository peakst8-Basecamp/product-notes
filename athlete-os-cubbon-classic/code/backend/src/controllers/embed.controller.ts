import { Request, Response } from 'express';

import {
  embedCategoryParamsDto,
  embedEventParamsDto,
  embedGroupCodeBodyDto,
  embedImportBodyDto,
  embedImportParamsDto,
  embedSettingsBodyDto,
  embedTiersBodyDto,
} from '../dto/embed.dto';
import { getSessionUserId, parseRequestDto } from '../lib';
import { embedService } from '../services/embed.service';

export const embedController = {
  getPublicEmbed: async (req: Request, res: Response) => {
    const { eventId } = parseRequestDto({
      schema: embedEventParamsDto,
      data: req.params,
    });
    const result = await embedService.getPublicEmbed(eventId);
    // Prices change with early-bird tiers; a short cache keeps the loader fast.
    res.setHeader('Cache-Control', 'public, max-age=60');
    res.status(200).json(result);
  },

  getSettings: async (req: Request, res: Response) => {
    const { eventId } = parseRequestDto({
      schema: embedEventParamsDto,
      data: req.params,
    });
    const userId = getSessionUserId({ req })!;
    res.status(200).json(await embedService.getSettings({ eventId, userId }));
  },

  updateSettings: async (req: Request, res: Response) => {
    const { eventId } = parseRequestDto({
      schema: embedEventParamsDto,
      data: req.params,
    });
    const input = parseRequestDto({
      schema: embedSettingsBodyDto,
      data: req.body,
    });
    const userId = getSessionUserId({ req })!;
    res
      .status(200)
      .json(await embedService.updateSettings({ eventId, userId, input }));
  },

  replaceTiers: async (req: Request, res: Response) => {
    const { eventId, categoryId } = parseRequestDto({
      schema: embedCategoryParamsDto,
      data: req.params,
    });
    const { tiers } = parseRequestDto({
      schema: embedTiersBodyDto,
      data: req.body,
    });
    const userId = getSessionUserId({ req })!;
    res
      .status(200)
      .json(
        await embedService.replaceTiers({ eventId, categoryId, userId, tiers }),
      );
  },

  createGroupCode: async (req: Request, res: Response) => {
    const { eventId } = parseRequestDto({
      schema: embedEventParamsDto,
      data: req.params,
    });
    const input = parseRequestDto({
      schema: embedGroupCodeBodyDto,
      data: req.body,
    });
    const userId = getSessionUserId({ req })!;
    res
      .status(201)
      .json(await embedService.createGroupCode({ eventId, userId, input }));
  },

  previewImport: async (req: Request, res: Response) => {
    const { eventId } = parseRequestDto({
      schema: embedEventParamsDto,
      data: req.params,
    });
    const { csv, categoryMap } = parseRequestDto({
      schema: embedImportBodyDto,
      data: req.body,
    });
    const userId = getSessionUserId({ req })!;
    res
      .status(200)
      .json(
        await embedService.previewImport({ eventId, userId, csv, categoryMap }),
      );
  },

  startImport: async (req: Request, res: Response) => {
    const { eventId } = parseRequestDto({
      schema: embedEventParamsDto,
      data: req.params,
    });
    const { csv, fileName, categoryMap } = parseRequestDto({
      schema: embedImportBodyDto,
      data: req.body,
    });
    const userId = getSessionUserId({ req })!;
    res.status(202).json(
      await embedService.startImport({
        eventId,
        userId,
        csv,
        fileName,
        categoryMap,
      }),
    );
  },

  getImport: async (req: Request, res: Response) => {
    const { eventId, importId } = parseRequestDto({
      schema: embedImportParamsDto,
      data: req.params,
    });
    const userId = getSessionUserId({ req })!;
    res
      .status(200)
      .json(await embedService.getImport({ eventId, importId, userId }));
  },
};
