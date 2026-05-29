import { sendStartMessage } from './telegramApi';

interface TelegramUser {
  id: number;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  from?: TelegramUser;
  text?: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message?.text || !message.from) return;

  const text = message.text.trim();
  const command = text.split(/\s/)[0]?.split('@')[0];

  if (command === '/start') {
    await sendStartMessage(message.chat.id, message.from.language_code);
  }
}
