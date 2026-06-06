import { sendPaySupportMessage, sendStartMessage } from './telegramApi';
import { handlePreCheckoutQuery, handleSuccessfulPayment } from '../services/paymentService';

interface TelegramUser {
  id: number;
  language_code?: string;
}

interface TelegramMessage {
  message_id: number;
  chat: { id: number };
  from?: TelegramUser;
  text?: string;
  successful_payment?: {
    currency: string;
    total_amount: number;
    invoice_payload: string;
    telegram_payment_charge_id: string;
  };
}

interface PreCheckoutQuery {
  id: string;
  from: TelegramUser;
  currency: string;
  total_amount: number;
  invoice_payload: string;
}

interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  pre_checkout_query?: PreCheckoutQuery;
}

export async function handleTelegramUpdate(update: TelegramUpdate): Promise<void> {
  if (update.pre_checkout_query) {
    await handlePreCheckoutQuery(update.pre_checkout_query);
    return;
  }

  const payment = update.message?.successful_payment;
  if (payment && update.message?.from) {
    await handleSuccessfulPayment({
      payload: payment.invoice_payload,
      chargeId: payment.telegram_payment_charge_id,
      starsAmount: payment.total_amount,
      telegramUserId: update.message.from.id,
    });
    return;
  }

  const message = update.message;
  if (!message?.text || !message.from) return;

  const text = message.text.trim();
  const command = text.split(/\s/)[0]?.split('@')[0];

  if (command === '/start') {
    await sendStartMessage(message.chat.id, message.from.language_code);
    return;
  }

  if (command === '/paysupport') {
    const isRu = message.from.language_code?.startsWith('ru');
    await sendPaySupportMessage(message.chat.id, isRu);
  }
}
