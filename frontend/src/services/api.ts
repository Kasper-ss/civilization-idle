import { getTelegramInitData, isInsideTelegram } from '../lib/telegram';
import type { GameConfig, GameState } from '../types/game';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function getOrCreateDevId(): string {
  const key = 'devTelegramId';
  let id = localStorage.getItem(key);
  if (!id) {
    id = String(100000000 + Math.floor(Math.random() * 899999999));
    localStorage.setItem(key, id);
  }
  return id;
}

function resolveTelegramUserId(): string | undefined {
  const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (tgUserId) return String(tgUserId);
  const saved = localStorage.getItem('devTelegramId');
  if (saved) return saved;
  if (!isInsideTelegram()) return getOrCreateDevId();
  return undefined;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const initData = getTelegramInitData();

  if (initData.length > 0) {
    h['X-Telegram-Init-Data'] = initData;
  } else {
    const userId = resolveTelegramUserId();
    if (userId) h['X-Dev-Telegram-Id'] = userId;
  }

  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (startParam) h['X-Start-Param'] = startParam;

  return h;
}

function authPayload(): Record<string, unknown> {
  const initData = getTelegramInitData();
  const payload: Record<string, unknown> = {};
  if (initData.length > 0) payload.initData = initData;
  const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
  if (tgUserId) payload.telegramUserId = tgUserId;
  const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
  if (startParam) payload.startParam = startParam;
  return payload;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { ...headers(), ...options?.headers },
    });
  } catch {
    throw new Error('Network error');
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('application/json')) {
    throw new Error(res.ok ? 'Invalid server response' : `Request failed (${res.status})`);
  }

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export { isInsideTelegram, getTelegramInitData };

export const api = {
  auth: () =>
    request<{ userId: string; game: GameState }>('/auth', {
      method: 'POST',
      body: JSON.stringify(authPayload()),
    }),
  getState: (userId: string) => request<GameState>(`/state/${userId}`),
  collectOffline: (userId: string) => request<GameState>(`/offline/${userId}/collect`, { method: 'POST' }),
  build: (userId: string, buildingKey: string) =>
    request<GameState>(`/build/${userId}`, { method: 'POST', body: JSON.stringify({ buildingKey }) }),
  research: (userId: string, researchKey: string) =>
    request<GameState>(`/research/${userId}`, { method: 'POST', body: JSON.stringify({ researchKey }) }),
  advanceEra: (userId: string) => request<GameState>(`/era/${userId}/advance`, { method: 'POST' }),
  startWonder: (userId: string, wonderId: string) =>
    request<GameState>(`/wonder/${userId}/start`, { method: 'POST', body: JSON.stringify({ wonderId }) }),
  unlockTerritory: (userId: string, territoryId: string) =>
    request<GameState>(`/territory/${userId}/unlock`, { method: 'POST', body: JSON.stringify({ territoryId }) }),
  purchase: (userId: string, productId: string) =>
    request<GameState>(`/shop/${userId}/purchase`, { method: 'POST', body: JSON.stringify({ productId }) }),
  createInvoice: (userId: string, productId: string) =>
    request<{ invoiceUrl: string }>(`/shop/${userId}/invoice`, {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  sendInvoiceToChat: (userId: string, productId: string) =>
    request<{ ok: boolean; message: string }>(`/shop/${userId}/send-invoice`, {
      method: 'POST',
      body: JSON.stringify({ productId }),
    }),
  spin: (userId: string, paid = false) =>
    request<{ game: GameState; reward: string }>(`/wheel/${userId}/spin`, {
      method: 'POST',
      body: JSON.stringify({ paid }),
    }),
  leaderboard: (userId?: string) =>
    request<
      {
        rank: number;
        userId: string;
        username: string | null;
        civilizationName: string;
        score: number;
        era: number;
        eraKey: string;
        level: number;
        wonders: number;
        telegramId: string;
      }[]
    >(userId ? `/leaderboard?userId=${encodeURIComponent(userId)}` : '/leaderboard'),
  referrals: (userId: string) =>
    request<{ referralCount: number; link: string; tiers: { count: number; reward: string; unlocked: boolean }[] }>(
      `/referrals/${userId}`
    ),
  config: () => request<GameConfig>('/config'),
  gatherClick: (userId: string, clicks = 1) =>
    request<GameState>(`/gather/${userId}/click`, {
      method: 'POST',
      body: JSON.stringify({ clicks }),
    }),
  setAutoGather: (userId: string, hours: 0 | 8) =>
    request<GameState>(`/gather/${userId}/auto`, {
      method: 'POST',
      body: JSON.stringify({ hours }),
    }),
  dismissAutoGatherSummary: (userId: string) =>
    request<GameState>(`/gather/${userId}/auto-summary/dismiss`, { method: 'POST' }),
  claimDailyBonus: (userId: string) =>
    request<GameState>(`/daily-bonus/${userId}/claim`, { method: 'POST' }),
};
