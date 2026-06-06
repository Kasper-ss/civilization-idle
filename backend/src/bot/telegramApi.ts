const TELEGRAM_API = 'https://api.telegram.org';

function getToken(): string {
  const token = process.env.BOT_TOKEN;
  if (!token || token === 'dev_bot_token_change_me') {
    throw new Error('BOT_TOKEN is not configured');
  }
  return token;
}

export function getWebAppUrl(): string {
  const url = process.env.WEB_APP_URL || process.env.FRONTEND_URL;
  if (!url) throw new Error('WEB_APP_URL or FRONTEND_URL is not configured');
  return url.replace(/\/$/, '');
}

async function callApi<T>(method: string, body: Record<string, unknown>): Promise<T> {
  const token = getToken();
  const res = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { ok: boolean; description?: string; result?: T };
  if (!data.ok) {
    throw new Error(data.description || `Telegram API ${method} failed`);
  }
  return data.result as T;
}

/** Bottom menu button (panel near input) — opens Mini App. */
export async function setMenuButtonWebApp(text = '🏛️ Играть'): Promise<void> {
  const webAppUrl = getWebAppUrl();
  await callApi('setChatMenuButton', {
    menu_button: {
      type: 'web_app',
      text,
      web_app: { url: webAppUrl },
    },
  });
}

export async function setWebhook(webhookUrl: string): Promise<void> {
  await callApi('setWebhook', {
    url: webhookUrl,
    allowed_updates: ['message', 'callback_query', 'pre_checkout_query'],
    drop_pending_updates: true,
  });
}

/** Telegram Stars invoice for Mini App (currency XTR). Stars go to the bot owner balance. */
export async function createStarsInvoiceLink(params: {
  title: string;
  description: string;
  payload: string;
  stars: number;
}): Promise<string> {
  // provider_token must be OMITTED for XTR (empty string breaks invoice — shows Stars info page).
  const link = await callApi<string>('createInvoiceLink', {
    title: params.title,
    description: params.description,
    payload: params.payload,
    currency: 'XTR',
    prices: [{ label: params.title, amount: params.stars }],
  });

  if (!link || !link.includes('t.me/')) {
    throw new Error('Invalid invoice link from Telegram');
  }

  return link;
}

/** Send pay button in private chat with the bot. */
export async function sendStarsInvoiceToChat(params: {
  chatId: number;
  title: string;
  description: string;
  payload: string;
  stars: number;
}): Promise<void> {
  await callApi('sendInvoice', {
    chat_id: params.chatId,
    title: params.title,
    description: params.description,
    payload: params.payload,
    currency: 'XTR',
    prices: [{ label: params.title, amount: params.stars }],
  });
}

export async function answerPreCheckoutQuery(
  preCheckoutQueryId: string,
  ok: boolean,
  errorMessage?: string
): Promise<void> {
  await callApi('answerPreCheckoutQuery', {
    pre_checkout_query_id: preCheckoutQueryId,
    ok,
    ...(ok ? {} : { error_message: errorMessage?.slice(0, 200) ?? 'Payment rejected' }),
  });
}

export async function sendPaySupportMessage(chatId: number, isRu?: boolean): Promise<void> {
  const text = isRu
    ? 'По вопросам оплаты Stars напишите создателю игры. Укажите дату покупки и товар.\n\nВозврат Stars возможен через поддержку Telegram в течение 14 дней.'
    : 'For Stars payment issues, contact the game developer with purchase date and product.\n\nStar refunds may be available via Telegram support within 14 days.';

  await callApi('sendMessage', { chat_id: chatId, text });
}

export async function sendStartMessage(chatId: number, languageCode?: string): Promise<void> {
  const webAppUrl = getWebAppUrl();
  const isRu = languageCode?.startsWith('ru');

  const text = isRu
    ? 'Добро пожаловать в Civilization Idle!\n\nРазвивайте цивилизацию от племени до межпланетной империи. Нажмите кнопку ниже, чтобы начать.'
    : 'Welcome to Civilization Idle!\n\nGrow your civilization from tribe to interstellar empire. Tap the button below to play.';

  const buttonText = isRu ? '🏛️ Играть' : '🏛️ Play';

  await callApi('sendMessage', {
    chat_id: chatId,
    text,
    reply_markup: {
      keyboard: [
        [
          {
            text: buttonText,
            web_app: { url: webAppUrl },
          },
        ],
      ],
      resize_keyboard: true,
      is_persistent: true,
    },
  });
}
