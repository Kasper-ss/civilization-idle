export function setupTelegram(): void {
  const tg = window.Telegram?.WebApp;
  tg?.ready();
  tg?.expand();
  tg?.setHeaderColor('#0a0e17');
  tg?.setBackgroundColor('#0a0e17');
}

/** Raw initData string for backend validation. */
export function getTelegramInitData(): string {
  return window.Telegram?.WebApp?.initData ?? '';
}

export function isInsideTelegram(): boolean {
  if (getTelegramInitData().length > 0) return true;
  return !!window.Telegram?.WebApp?.initDataUnsafe?.user;
}

export function getBotUsername(): string {
  return import.meta.env.VITE_BOT_USERNAME || 'YourBot';
}

export function getTelegramAppLink(): string {
  const bot = getBotUsername().replace('@', '');
  return `https://t.me/${bot}/app`;
}
