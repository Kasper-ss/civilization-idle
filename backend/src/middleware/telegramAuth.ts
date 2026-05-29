import { createHmac } from 'crypto';
import type { Request, Response, NextFunction } from 'express';

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  language_code?: string;
}

declare global {
  namespace Express {
    interface Request {
      telegramUser?: TelegramUser;
      startParam?: string;
    }
  }
}

function parseInitData(initData: string): Record<string, string> {
  const params = new URLSearchParams(initData);
  const result: Record<string, string> = {};
  params.forEach((value, key) => {
    result[key] = value;
  });
  return result;
}

export function validateTelegramInitData(initData: string, botToken: string): boolean {
  const params = parseInitData(initData);
  const hash = params.hash;
  if (!hash) return false;

  const dataCheckArr: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (key !== 'hash') dataCheckArr.push(`${key}=${value}`);
  }
  dataCheckArr.sort();
  const dataCheckString = dataCheckArr.join('\n');

  const secretKey = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const calculatedHash = createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

  return calculatedHash === hash;
}

export function telegramAuthMiddleware(req: Request, res: Response, next: NextFunction): void {
  const botToken = process.env.BOT_TOKEN ?? '';
  const initData = req.headers['x-telegram-init-data'] as string | undefined;
  const isDev =
    process.env.NODE_ENV !== 'production' ||
    botToken === 'dev_bot_token_change_me' ||
    process.env.ALLOW_BROWSER_PLAY === 'true';

  if (!initData || initData.length === 0) {
    if (isDev) {
      const devId = req.headers['x-dev-telegram-id'] as string | undefined;
      req.telegramUser = {
        id: devId ? parseInt(devId, 10) : 123456789,
        first_name: 'Player',
        username: 'browser_player',
      };
      req.startParam = (req.headers['x-start-param'] as string | undefined) ?? undefined;
      next();
      return;
    }
    res.status(401).json({
      error:
        'Missing Telegram init data. Open the game from your Telegram bot (Menu → App), not in a regular browser.',
    });
    return;
  }

  if (botToken && botToken !== 'dev_bot_token_change_me' && !validateTelegramInitData(initData, botToken)) {
    res.status(401).json({
      error: 'Invalid Telegram init data. Check BOT_TOKEN on Render matches your BotFather bot.',
    });
    return;
  }

  const params = parseInitData(initData);
  if (params.user) {
    try {
      req.telegramUser = JSON.parse(params.user) as TelegramUser;
    } catch {
      res.status(401).json({ error: 'Invalid user data' });
      return;
    }
  }

  req.startParam = params.start_param;
  next();
}
