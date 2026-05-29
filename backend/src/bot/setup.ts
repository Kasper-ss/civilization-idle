import { getWebAppUrl, setMenuButtonWebApp, setWebhook } from './telegramApi';

export async function setupTelegramBot(): Promise<void> {
  const token = process.env.BOT_TOKEN;
  if (!token || token === 'dev_bot_token_change_me') {
    console.log('Telegram bot: skipped (BOT_TOKEN not set)');
    return;
  }

  try {
    const webAppUrl = getWebAppUrl();
    await setMenuButtonWebApp('🏛️ Играть');
    console.log(`Telegram bot: menu button → ${webAppUrl}`);

    const webhookBase =
      process.env.WEBHOOK_URL ||
      (process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/bot/webhook` : null);

    if (webhookBase) {
      await setWebhook(webhookBase);
      console.log(`Telegram bot: webhook → ${webhookBase}`);
    } else {
      console.log('Telegram bot: webhook not set (set WEBHOOK_URL or deploy on Render)');
    }
  } catch (e) {
    console.error('Telegram bot setup failed:', (e as Error).message);
  }
}
