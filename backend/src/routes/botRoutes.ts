import { Router } from 'express';
import { handleTelegramUpdate } from '../bot/handleUpdate';
import { setupTelegramBot } from '../bot/setup';

const router = Router();

/** Telegram sends updates here (webhook). */
router.post('/webhook', async (req, res) => {
  try {
    await handleTelegramUpdate(req.body);
    res.sendStatus(200);
  } catch (e) {
    console.error('Webhook error:', e);
    res.sendStatus(200);
  }
});

/** Manual re-setup (open in browser after deploy). */
router.get('/setup', async (_req, res) => {
  try {
    await setupTelegramBot();
    res.json({ ok: true, message: 'Menu button and webhook configured' });
  } catch (e) {
    res.status(500).json({ ok: false, error: (e as Error).message });
  }
});

export default router;
