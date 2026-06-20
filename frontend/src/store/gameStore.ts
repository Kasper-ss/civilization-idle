import { create } from 'zustand';
import { hasAutoGatherSummary, isAutoGatherActive, type AutoGatherHours } from '../lib/autoGather';
import { canPayWithTelegramStars, getTelegramInitData, isInsideTelegram, setupTelegram } from '../lib/telegram';
import { openTelegramInvoice } from '../lib/payments';
import { api } from '../services/api';
import type { GameConfig, GameState } from '../types/game';
import { applyOptimisticGather } from '../utils/optimisticGather';
import { applyOptimisticBuild, applyOptimisticResearch } from '../utils/optimisticActions';

let pendingGatherClicks = 0;
let gatherFlushTimer: ReturnType<typeof setTimeout> | null = null;
let stateGeneration = 0;
const pendingMutations = new Set<string>();

function bumpStateGeneration(): number {
  stateGeneration += 1;
  return stateGeneration;
}

async function flushPendingGather(
  userId: string,
  set: (p: Partial<{ game: GameState }>) => void
): Promise<void> {
  if (gatherFlushTimer) {
    clearTimeout(gatherFlushTimer);
    gatherFlushTimer = null;
  }

  const clicks = pendingGatherClicks;
  pendingGatherClicks = 0;
  if (clicks <= 0) return;

  const genAtStart = stateGeneration;
  try {
    const synced = await api.gatherClick(userId, clicks);
    if (genAtStart === stateGeneration) {
      set({ game: synced });
    }
  } catch (e) {
    console.error('gather sync', e);
    if (genAtStart === stateGeneration) {
      try {
        const refreshed = await api.getState(userId);
        set({ game: refreshed });
      } catch {
        // ignore rollback failure
      }
    }
  }
}

function scheduleGatherSync(userId: string, set: (p: Partial<{ game: GameState }>) => void) {
  pendingGatherClicks += 1;
  if (gatherFlushTimer) clearTimeout(gatherFlushTimer);
  gatherFlushTimer = setTimeout(() => {
    void flushPendingGather(userId, set);
  }, 120);
}

function modalFlagsFromGame(
  game: GameState,
  opts?: { skipDaily?: boolean; skipAutoSummary?: boolean; skipOffline?: boolean }
) {
  return {
    showOfflineModal: !opts?.skipOffline && !!game.offlineIncome,
    showDailyBonusModal: !opts?.skipDaily && game.dailyBonusAvailable,
    showAutoGatherSummaryModal: !opts?.skipAutoSummary && hasAutoGatherSummary(game),
  };
}

async function runGameMutation(
  userId: string,
  set: (partial: Record<string, unknown>) => void,
  get: () => {
    offlineModalDismissed: boolean;
    dailyBonusDismissed: boolean;
  },
  mutate: () => Promise<GameState>
): Promise<GameState> {
  bumpStateGeneration();
  await flushPendingGather(userId, set);
  bumpStateGeneration();

  const game = await mutate();
  bumpStateGeneration();

  const { offlineModalDismissed, dailyBonusDismissed } = get();
  set({
    game,
    ...modalFlagsFromGame(game, {
      skipOffline: offlineModalDismissed,
      skipDaily: dailyBonusDismissed,
    }),
  });
  return game;
}

interface GameStore {
  userId: string | null;
  game: GameState | null;
  config: GameConfig | null;
  loading: boolean;
  error: string | null;
  showOfflineModal: boolean;
  showDailyBonusModal: boolean;
  showAutoGatherSummaryModal: boolean;
  offlineModalDismissed: boolean;
  dailyBonusDismissed: boolean;
  showEraModal: boolean;
  lastEraAdvanced: number | null;
  init: () => Promise<void>;
  refresh: () => Promise<void>;
  collectOffline: () => Promise<void>;
  build: (key: string) => Promise<void>;
  research: (key: string) => Promise<void>;
  advanceEra: () => Promise<void>;
  startWonder: (id: string) => Promise<void>;
  unlockTerritory: (id: string) => Promise<void>;
  purchase: (productId: string) => Promise<void>;
  spin: (paid?: boolean) => Promise<string | null>;
  manualGather: () => void;
  setAutoGather: (hours: AutoGatherHours) => Promise<void>;
  claimDailyBonus: () => Promise<void>;
  dismissOffline: () => void;
  dismissDailyBonus: () => void;
  dismissAutoGatherSummary: () => Promise<void>;
  dismissEra: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  userId: null,
  game: null,
  config: null,
  loading: true,
  error: null,
  showOfflineModal: false,
  showDailyBonusModal: false,
  showAutoGatherSummaryModal: false,
  offlineModalDismissed: false,
  dailyBonusDismissed: false,
  showEraModal: false,
  lastEraAdvanced: null,

  init: async () => {
    set({ loading: true, error: null, offlineModalDismissed: false, dailyBonusDismissed: false });
    try {
      setupTelegram();

      const tgUserId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id;
      if (tgUserId && getTelegramInitData().length === 0 && isInsideTelegram()) {
        localStorage.setItem('devTelegramId', String(tgUserId));
      }

      const [config, auth] = await Promise.all([api.config(), api.auth()]);
      set({
        userId: auth.userId,
        game: auth.game,
        config,
        loading: false,
        ...modalFlagsFromGame(auth.game),
      });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  refresh: async () => {
    const { userId, offlineModalDismissed, dailyBonusDismissed } = get();
    if (!userId) return;
    bumpStateGeneration();
    await flushPendingGather(userId, set);
    const genAtStart = stateGeneration;
    try {
      const game = await api.getState(userId);
      if (genAtStart !== stateGeneration) return;
      set({
        game,
        ...modalFlagsFromGame(game, {
          skipOffline: offlineModalDismissed,
          skipDaily: dailyBonusDismissed,
        }),
      });
    } catch (e) {
      console.error('refresh failed', e);
    }
  },

  collectOffline: async () => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.collectOffline(userId);
    set({
      game,
      offlineModalDismissed: true,
      ...modalFlagsFromGame(game, { skipOffline: true, skipDaily: get().dailyBonusDismissed }),
    });
  },

  build: async (key) => {
    const lockKey = `build:${key}`;
    if (pendingMutations.has(lockKey)) return;
    const { userId, game, config } = get();
    if (!userId || !game || !config) return;

    pendingMutations.add(lockKey);
    const optimistic = applyOptimisticBuild(game, key, config);
    if (optimistic) set({ game: optimistic });

    try {
      await runGameMutation(userId, set, get, () => api.build(userId, key));
    } catch (e) {
      bumpStateGeneration();
      const refreshed = await api.getState(userId);
      set({ game: refreshed });
      throw e;
    } finally {
      pendingMutations.delete(lockKey);
    }
  },

  research: async (key) => {
    const lockKey = `research:${key}`;
    if (pendingMutations.has(lockKey)) return;
    const { userId, game, config } = get();
    if (!userId || !game || !config) return;

    pendingMutations.add(lockKey);
    const optimistic = applyOptimisticResearch(game, key, config);
    if (optimistic) set({ game: optimistic });

    try {
      await runGameMutation(userId, set, get, () => api.research(userId, key));
    } catch (e) {
      bumpStateGeneration();
      const refreshed = await api.getState(userId);
      set({ game: refreshed });
      throw e;
    } finally {
      pendingMutations.delete(lockKey);
    }
  },

  advanceEra: async () => {
    const { userId } = get();
    if (!userId) return;
    const updated = await runGameMutation(userId, set, get, () => api.advanceEra(userId));
    set({ showEraModal: true, lastEraAdvanced: updated.era });
  },

  startWonder: async (id) => {
    const { userId } = get();
    if (!userId) return;
    await runGameMutation(userId, set, get, () => api.startWonder(userId, id));
  },

  unlockTerritory: async (id) => {
    const { userId } = get();
    if (!userId) return;
    await runGameMutation(userId, set, get, () => api.unlockTerritory(userId, id));
  },

  purchase: async (productId) => {
    const { userId, config } = get();
    if (!userId) return;

    const tg = window.Telegram?.WebApp;
    const inTelegram = isInsideTelegram();
    const useDemo = (config?.payments?.demoPurchases ?? false) && !inTelegram;

    if (useDemo) {
      const game = await api.purchase(userId, productId);
      set({ game });
      return;
    }

    if (!canPayWithTelegramStars()) {
      const msg = inTelegram
        ? 'Обновите Telegram до последней версии — оплата Stars недоступна в этом клиенте.'
        : 'Откройте игру через бота: /start → кнопка «Играть»\n\nНе открывайте ссылку Vercel в браузере.';
      tg?.showAlert?.(msg);
      throw new Error('Stars payment unavailable');
    }

    let invoiceUrl: string;
    try {
      const res = await api.createInvoice(userId, productId);
      invoiceUrl = res.invoiceUrl;
    } catch (e) {
      tg?.showAlert?.(`Ошибка оплаты: ${(e as Error).message}`);
      throw e;
    }

    const status = await openTelegramInvoice(invoiceUrl);

    if (status === 'paid') {
      await get().refresh();
      await new Promise((r) => setTimeout(r, 1200));
      await get().refresh();
      tg?.HapticFeedback?.notificationOccurred?.('success');
      tg?.showAlert?.('Оплата прошла! Награда зачислена.');
      return;
    }

    if (status === 'cancelled' || status === 'pending') return;

    if (status === 'failed') {
      tg?.showAlert?.('Оплата не прошла. Попробуйте снова.');
      return;
    }

    try {
      await api.sendInvoiceToChat(userId, productId);
      tg?.showAlert?.(
        'Счёт отправлен в чат с ботом.\n\nОткройте диалог с ботом → нажмите «Оплатить» ⭐\n\nПосле оплаты вернитесь в игру — награда зачислится автоматически.'
      );
    } catch (e) {
      tg?.showAlert?.(`Не удалось создать счёт: ${(e as Error).message}`);
      throw e;
    }
  },

  spin: async (paid) => {
    const { userId } = get();
    if (!userId) return null;

    if (paid) {
      await get().purchase('spin_10');
      await get().refresh();
      return null;
    }

    const result = await api.spin(userId, false);
    set({ game: result.game });
    return result.reward;
  },

  manualGather: () => {
    const { userId, game, config } = get();
    if (!userId || !game || isAutoGatherActive(game)) return;

    set({ game: applyOptimisticGather(game, config) });
    scheduleGatherSync(userId, set);
  },

  setAutoGather: async (hours) => {
    const { userId } = get();
    if (!userId) return;
    const game = await runGameMutation(userId, set, get, () => api.setAutoGather(userId, hours));
    set({
      showAutoGatherSummaryModal: hours === 0 && hasAutoGatherSummary(game),
    });
  },

  claimDailyBonus: async () => {
    const { userId } = get();
    if (!userId) return;
    await runGameMutation(userId, set, get, () => api.claimDailyBonus(userId));
    set({ showDailyBonusModal: false, dailyBonusDismissed: false });
  },

  dismissOffline: () => {
    set({ showOfflineModal: false, offlineModalDismissed: true });
  },

  dismissDailyBonus: () => {
    set({ showDailyBonusModal: false, dailyBonusDismissed: true });
  },

  dismissAutoGatherSummary: async () => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.dismissAutoGatherSummary(userId);
    set({ game, showAutoGatherSummaryModal: false });
  },

  dismissEra: () => set({ showEraModal: false, lastEraAdvanced: null }),
}));

declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        initData: string;
        initDataUnsafe: { user?: { id: number; username?: string; first_name?: string; photo_url?: string }; start_param?: string };
        ready: () => void;
        expand: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        openInvoice?: (url: string, callback?: (status: string) => void) => void;
        onEvent?: (eventType: string, callback: (data: { status?: string }) => void) => void;
        offEvent?: (eventType: string, callback: (data: { status?: string }) => void) => void;
        showAlert: (msg: string) => void;
        openTelegramLink: (url: string) => void;
        platform?: string;
        shareMessage?: (msg: unknown) => void;
        HapticFeedback?: { impactOccurred: (style: string) => void; notificationOccurred?: (type: string) => void };
      };
    };
  }
}
