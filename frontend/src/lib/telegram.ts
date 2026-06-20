export function setupTelegram(): void {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor('#0a0e17');
  tg.setBackgroundColor('#0a0e17');
}

/** Raw initData string for backend validation. */
export function getTelegramInitData(): string {
  return (window.Telegram?.WebApp?.initData ?? '').trim();
}

/** Telegram sometimes fills initData / user shortly after WebApp.ready(). */
export function waitForTelegramAuth(timeoutMs = 4000): Promise<void> {
  return new Promise((resolve) => {
    const ready = () =>
      getTelegramInitData().length > 0 || !!window.Telegram?.WebApp?.initDataUnsafe?.user?.id;

    if (ready()) {
      resolve();
      return;
    }

    const started = Date.now();
    const tick = () => {
      if (ready() || Date.now() - started >= timeoutMs) {
        clearInterval(timer);
        resolve();
      }
    };

    const timer = setInterval(tick, 100);
    tick();
  });
}

/** True when running inside Telegram (Mini App or in-app webview). */
export function isInsideTelegram(): boolean {
  const tg = window.Telegram?.WebApp;
  if (!tg) return false;
  if (getTelegramInitData().length > 0) return true;
  if (tg.initDataUnsafe?.user?.id) return true;
  const platform = (tg as { platform?: string }).platform;
  if (platform && platform !== 'unknown') return true;
  return false;
}

/** Can open native Stars invoice sheet. */
export function canPayWithTelegramStars(): boolean {
  const tg = window.Telegram?.WebApp;
  return isInsideTelegram() && typeof tg?.openInvoice === 'function';
}

export function getBotUsername(): string {
  return import.meta.env.VITE_BOT_USERNAME || 'YourBot';
}

export function getTelegramAppLink(): string {
  const bot = getBotUsername().replace('@', '');
  return `https://t.me/${bot}/app`;
}
