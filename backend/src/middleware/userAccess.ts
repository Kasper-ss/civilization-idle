import type { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

export async function requireUserAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = req.params.userId;
  const tgId = req.telegramUser?.id;
  if (!userId || !tgId) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { telegramId: true } });
  if (!user || user.telegramId !== BigInt(tgId)) {
    res.status(403).json({ error: 'Forbidden' });
    return;
  }

  next();
}
