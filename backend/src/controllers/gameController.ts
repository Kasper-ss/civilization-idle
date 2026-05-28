import type { Request, Response } from 'express';
import {
  advanceEra,
  collectOffline,
  fetchGameState,
  getGameConfig,
  getLeaderboard,
  getOrCreateUser,
  getReferralInfo,
  processPurchase,
  spinWheel,
  startWonder,
  unlockTerritory,
  updateCivilizationName,
  upgradeBuilding,
  upgradeResearch,
  manualGatherClick,
  setAutoGather,
} from '../services/gameService';

export async function auth(req: Request, res: Response): Promise<void> {
  try {
    const tgUser = req.telegramUser!;
    const user = await getOrCreateUser(tgUser, req.startParam);
    const game = await fetchGameState(user.id);
    res.json({ userId: user.id, game });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}

export async function getState(req: Request, res: Response): Promise<void> {
  try {
    const game = await fetchGameState(req.params.userId);
    if (!game) {
      res.status(404).json({ error: 'Not found' });
      return;
    }
    res.json(game);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
}

export async function collectOfflineHandler(req: Request, res: Response): Promise<void> {
  try {
    const game = await collectOffline(req.params.userId);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

export async function build(req: Request, res: Response): Promise<void> {
  try {
    const game = await upgradeBuilding(req.params.userId, req.body.buildingKey);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

export async function research(req: Request, res: Response): Promise<void> {
  try {
    const game = await upgradeResearch(req.params.userId, req.body.researchKey);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

export async function eraAdvance(req: Request, res: Response): Promise<void> {
  try {
    const game = await advanceEra(req.params.userId);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

export async function wonderStart(req: Request, res: Response): Promise<void> {
  try {
    const game = await startWonder(req.params.userId, req.body.wonderId);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

export async function territoryUnlock(req: Request, res: Response): Promise<void> {
  try {
    const game = await unlockTerritory(req.params.userId, req.body.territoryId);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

export async function shopPurchase(req: Request, res: Response): Promise<void> {
  try {
    const game = await processPurchase(req.params.userId, req.body.productId);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

export async function wheelSpin(req: Request, res: Response): Promise<void> {
  try {
    const result = await spinWheel(req.params.userId, req.body.paid === true);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

export async function leaderboard(req: Request, res: Response): Promise<void> {
  const data = await getLeaderboard(100);
  res.json(data);
}

export async function referrals(req: Request, res: Response): Promise<void> {
  const botUsername = process.env.BOT_USERNAME ?? 'CivilizationIdleBot';
  const info = await getReferralInfo(req.params.userId, botUsername);
  res.json(info);
}

export async function config(_req: Request, res: Response): Promise<void> {
  res.json(getGameConfig());
}

export async function renameCiv(req: Request, res: Response): Promise<void> {
  await updateCivilizationName(req.params.userId, req.body.name);
  const game = await fetchGameState(req.params.userId);
  res.json(game);
}

export async function gatherClick(req: Request, res: Response): Promise<void> {
  try {
    const game = await manualGatherClick(req.params.userId);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}

export async function autoGatherToggle(req: Request, res: Response): Promise<void> {
  try {
    let enabled: boolean;
    if (typeof req.body.enabled === 'boolean') {
      enabled = req.body.enabled;
    } else {
      const current = await fetchGameState(req.params.userId);
      enabled = !current?.autoGatherEnabled;
    }
    const game = await setAutoGather(req.params.userId, enabled);
    res.json(game);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
}
