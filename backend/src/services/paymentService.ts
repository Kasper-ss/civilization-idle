import { randomBytes } from 'crypto';
import { SHOP_PRODUCTS } from '../config/gameData';
import { prisma } from '../lib/prisma';
import { answerPreCheckoutQuery, createStarsInvoiceLink, sendStarsInvoiceToChat } from '../bot/telegramApi';
import { fulfillShopPurchase } from './gameService';

const PAYLOAD_PREFIX = 'c1.';

export type InvoicePayload = {
  userId: string;
  productId: string;
  nonce: string;
};

/** Compact payload (Telegram limit 128 bytes). */
export function encodeInvoicePayload(userId: string, productId: string): string {
  const nonce = randomBytes(3).toString('hex');
  const raw = JSON.stringify({ u: userId, p: productId, n: nonce });
  const encoded = Buffer.from(raw, 'utf8').toString('base64url');
  const payload = `${PAYLOAD_PREFIX}${encoded}`;
  if (payload.length > 128) throw new Error('Invoice payload too long');
  return payload;
}

export function decodeInvoicePayload(raw: string): InvoicePayload | null {
  if (!raw.startsWith(PAYLOAD_PREFIX)) {
    // Legacy format civ1:userId:productId:nonce
    if (raw.startsWith('civ1:')) {
      const parts = raw.slice(5).split(':');
      if (parts.length >= 3) {
        return { userId: parts[0], productId: parts[1], nonce: parts[2] };
      }
    }
    return null;
  }
  try {
    const json = Buffer.from(raw.slice(PAYLOAD_PREFIX.length), 'base64url').toString('utf8');
    const data = JSON.parse(json) as { u?: string; p?: string; n?: string };
    if (!data.u || !data.p || !data.n) return null;
    return { userId: data.u, productId: data.p, nonce: data.n };
  } catch {
    return null;
  }
}

export function getShopProduct(productId: string) {
  return SHOP_PRODUCTS.find((p) => p.id === productId) ?? null;
}

export async function createShopInvoice(userId: string, productId: string): Promise<string> {
  const product = getShopProduct(productId);
  if (!product) throw new Error('Unknown product');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const payload = encodeInvoicePayload(userId, productId);

  return createStarsInvoiceLink({
    title: product.name.slice(0, 32),
    description: `Civilization Idle — ${product.name}`.slice(0, 255),
    payload,
    stars: product.stars,
  });
}

/** Fallback: invoice message in bot chat (works when openInvoice shows info page). */
export async function sendShopInvoiceToChat(userId: string, productId: string): Promise<void> {
  const product = getShopProduct(productId);
  if (!product) throw new Error('Unknown product');

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const payload = encodeInvoicePayload(userId, productId);

  await sendStarsInvoiceToChat({
    chatId: Number(user.telegramId),
    title: product.name.slice(0, 32),
    description: `Civilization Idle — ${product.name}`.slice(0, 255),
    payload,
    stars: product.stars,
  });
}

export async function validatePreCheckout(params: {
  payload: string;
  totalAmount: number;
  currency: string;
  telegramUserId: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (params.currency !== 'XTR') {
    return { ok: false, error: 'Invalid currency' };
  }

  const decoded = decodeInvoicePayload(params.payload);
  if (!decoded) return { ok: false, error: 'Invalid invoice payload' };

  const product = getShopProduct(decoded.productId);
  if (!product) return { ok: false, error: 'Unknown product' };

  if (params.totalAmount !== product.stars) {
    return { ok: false, error: 'Price mismatch' };
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) return { ok: false, error: 'User not found' };

  if (user.telegramId !== BigInt(params.telegramUserId)) {
    return { ok: false, error: 'User mismatch' };
  }

  return { ok: true };
}

export async function isChargeProcessed(chargeId: string): Promise<boolean> {
  const existing = await prisma.purchase.findFirst({
    where: {
      payload: {
        path: ['telegram_payment_charge_id'],
        equals: chargeId,
      },
    },
  });
  return !!existing;
}

export async function handleSuccessfulPayment(params: {
  payload: string;
  chargeId: string;
  starsAmount: number;
  telegramUserId: number;
}): Promise<void> {
  const decoded = decodeInvoicePayload(params.payload);
  if (!decoded) throw new Error('Invalid payment payload');

  const validation = await validatePreCheckout({
    payload: params.payload,
    totalAmount: params.starsAmount,
    currency: 'XTR',
    telegramUserId: params.telegramUserId,
  });
  if (!validation.ok) throw new Error(validation.error);

  if (await isChargeProcessed(params.chargeId)) {
    console.log(`Payment already processed: ${params.chargeId}`);
    return;
  }

  await fulfillShopPurchase(decoded.userId, decoded.productId, {
    chargeId: params.chargeId,
    starsAmount: params.starsAmount,
  });

  console.log(`Payment fulfilled: ${decoded.productId} for user ${decoded.userId} (${params.starsAmount} XTR)`);
}

export async function handlePreCheckoutQuery(query: {
  id: string;
  invoice_payload: string;
  total_amount: number;
  currency: string;
  from: { id: number };
}): Promise<void> {
  const validation = await validatePreCheckout({
    payload: query.invoice_payload,
    totalAmount: query.total_amount,
    currency: query.currency,
    telegramUserId: query.from.id,
  });

  if (!validation.ok) {
    await answerPreCheckoutQuery(query.id, false, validation.error);
    return;
  }

  await answerPreCheckoutQuery(query.id, true);
}

export function paymentsConfig() {
  const token = process.env.BOT_TOKEN ?? '';
  const demoPurchases = process.env.ALLOW_DEMO_PURCHASES === 'true';
  const starsEnabled = !!token && token !== 'dev_bot_token_change_me';
  return {
    demoPurchases,
    starsEnabled,
    useInvoices: starsEnabled && !demoPurchases,
  };
}
