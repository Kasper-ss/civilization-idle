import type { GameConfig, GameState } from '../types/game';

const API_URL = import.meta.env.VITE_API_URL || '/api';

function headers(): HeadersInit {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const tg = window.Telegram?.WebApp;
  if (tg?.initData) {
    h['X-Telegram-Init-Data'] = tg.initData;
  } else {
    h['X-Dev-Telegram-Id'] = localStorage.getItem('devTelegramId') || '123456789';
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
  gatherClick: (userId: string) =>
    request<GameState>(`/gather/${userId}/click`, { method: 'POST' }),
  setAutoGather: (userId: string, enabled: boolean) =>
    request<GameState>(`/gather/${userId}/auto`, {
      method: 'POST',
      body: JSON.stringify({ enabled }),
    }),
};
