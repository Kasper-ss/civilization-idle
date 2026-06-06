import { create } from 'zustand';
import { isAutoGatherActive } from '../lib/autoGather';
import { canPayWithTelegramStars, getTelegramInitData, isInsideTelegram, setupTelegram } from '../lib/telegram';
import { openTelegramInvoice } from '../lib/payments';
import { api } from '../services/api';
import type { GameConfig, GameState } from '../types/game';
import { applyOptimisticGather } from '../utils/optimisticGather';

let pendingGatherClicks = 0;
let gatherFlushTimer: ReturnType<typeof setTimeout> | null = null;

function flushGatherToServer(userId: string, set: (p: Partial<{ game: GameState }>) => void) {
  const clicks = pendingGatherClicks;
  pendingGatherClicks = 0;
  gatherFlushTimer = null;
  if (clicks <= 0) return;

  api
    .gatherClick(userId, clicks)
    .then((synced) => set({ game: synced }))
    .catch((e) => console.error('gather sync', e));
}

function scheduleGatherSync(userId: string, set: (p: Partial<{ game: GameState }>) => void) {
  pendingGatherClicks += 1;
  if (gatherFlushTimer) clearTimeout(gatherFlushTimer);
  gatherFlushTimer = setTimeout(() => flushGatherToServer(userId, set), 120);
}

interface GameStore {
  userId: string | null;
  game: GameState | null;
  config: GameConfig | null;
  loading: boolean;
  error: string | null;
  showOfflineModal: boolean;
  showEraModal: boolean;
  lastEraAdvanced: number | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
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
  setAutoGather: (hours: 0 | 4 | 8 | 12) => Promise<void>;
  dismissOffline: () => void;
  dismissEra: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  userId: null,
  game: null,
  config: null,
  loading: true,
  error: null,
  showOfflineModal: false,
  showEraModal: false,
  lastEraAdvanced: null,
  activeTab: 'home',

  setActiveTab: (tab) => set({ activeTab: tab }),

  init: async () => {
    set({ loading: true, error: null });
    try {
      setupTelegram();

      // Sync dev fallback id to real Telegram user when initData string is missing in Mini App
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
        showOfflineModal: !!auth.game.offlineIncome,
      });
    } catch (e) {
      set({ loading: false, error: (e as Error).message });
    }
  },

  refresh: async () => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.getState(userId);
    set({ game });
  },

  collectOffline: async () => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.collectOffline(userId);
    set({ game, showOfflineModal: false });
  },

  build: async (key) => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.build(userId, key);
    set({ game });
  },

  research: async (key) => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.research(userId, key);
    set({ game });
  },

  advanceEra: async () => {
    const { userId, game } = get();
    if (!userId || !game) return;
    const prevEra = game.era;
    const updated = await api.advanceEra(userId);
    set({
      game: updated,
      showEraModal: true,
      lastEraAdvanced: updated.era,
    });
  },

  startWonder: async (id) => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.startWonder(userId, id);
    set({ game });
  },

  unlockTerritory: async (id) => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.unlockTerritory(userId, id);
    set({ game });
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

    if (getTelegramInitData().length === 0) {
      console.warn('Telegram Mini App: initData empty, using initDataUnsafe user id');
    }

    let invoiceUrl: string;
    try {
      const res = await api.createInvoice(userId, productId);
      invoiceUrl = res.invoiceUrl;
    } catch (e) {
      const msg = (e as Error).message;
      tg?.showAlert?.(`Ошибка оплаты: ${msg}`);
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

    if (status === 'cancelled' || status === 'pending') {
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
      return 'Спин выполнен! Проверьте награду.';
    }

    const result = await api.spin(userId, false);
    set({ game: result.game });
    return result.reward;
  },

  manualGather: () => {
    const { userId, game } = get();
    if (!userId || !game || isAutoGatherActive(game)) return;

    set({ game: applyOptimisticGather(game) });
    scheduleGatherSync(userId, set);
  },

  setAutoGather: async (hours) => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.setAutoGather(userId, hours);
    set({ game });
  },

  dismissOffline: () => set({ showOfflineModal: false }),
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
