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

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const initData = getTelegramInitData();

  if (initData) {
    h['X-Telegram-Init-Data'] = initData;
    const startParam = window.Telegram?.WebApp?.initDataUnsafe?.start_param;
    if (startParam) h['X-Start-Param'] = startParam;
  } else {
    // Browser test mode (backend must have ALLOW_BROWSER_PLAY=true)
    h['X-Dev-Telegram-Id'] = getOrCreateDevId();
  }

  return h;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...headers(), ...options?.headers },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export { isInsideTelegram, getTelegramInitData };

export const api = {
  auth: () => request<{ userId: string; game: GameState }>('/auth', { method: 'POST' }),
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
  spin: (userId: string, paid = false) =>
    request<{ game: GameState; reward: string }>(`/wheel/${userId}/spin`, {
      method: 'POST',
      body: JSON.stringify({ paid }),
    }),
  leaderboard: () =>
    request<
      { username: string | null; score: number; era: number; level: number; wonders: number; telegramId: bigint }[]
    >('/leaderboard'),
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
  setAutoGather: (userId: string, enabled: boolean) =>
    request<GameState>(`/gather/${userId}/auto`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
};
