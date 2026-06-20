import { Router } from 'express';
import { handleTelegramUpdate } from '../bot/handleUpdate';
import { setupTelegramBot } from '../bot/setup';

const router = Router();

/** Telegram sends updates here (webhook). */
router.post('/webhook', async (req, res) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers['x-telegram-bot-api-secret-token'];
    if (header !== secret) {
      res.sendStatus(403);
      return;
    }
  }

  try {
    await handleTelegramUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook error:', e);
    res.sendStatus(200);
  }
});

/** Manual re-setup (protected when BOT_SETUP_SECRET is set). */
router.get('/setup', async (req, res) => {
  const setupSecret = process.env.BOT_SETUP_SECRET;
  if (setupSecret && req.query.secret !== setupSecret) {
    res.status(403).json({ ok: false, error: 'Forbidden' });
    return;
  }

  try {
    await setupTelegramBot();
    res.json({ ok: true, message: 'Menu button and webhook configured' });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

export default router;
