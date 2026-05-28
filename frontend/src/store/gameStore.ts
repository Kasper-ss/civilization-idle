import { create } from 'zustand';
import { api } from '../services/api';
import type { GameConfig, GameState } from '../types/game';

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
  manualGather: () => Promise<void>;
  toggleAutoGather: (enabled: boolean) => Promise<void>;
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
      const tg = window.Telegram?.WebApp;
      tg?.ready();
      tg?.expand();
      tg?.setHeaderColor('#0a0e17');
      tg?.setBackgroundColor('#0a0e17');

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
    const { userId } = get();
    if (!userId) return;
    const tg = window.Telegram?.WebApp;
    if (tg?.openInvoice) {
      tg.showAlert('In production, this opens Telegram Stars payment. Demo: granting purchase.');
    }
    const game = await api.purchase(userId, productId);
    set({ game });
  },

  spin: async (paid) => {
    const { userId } = get();
    if (!userId) return null;
    const result = await api.spin(userId, paid);
    set({ game: result.game });
    return result.reward;
  },

  manualGather: async () => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.gatherClick(userId);
    set({ game });
  },

  toggleAutoGather: async (enabled) => {
    const { userId } = get();
    if (!userId) return;
    const game = await api.setAutoGather(userId, enabled);
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
        showAlert: (msg: string) => void;
        openTelegramLink: (url: string) => void;
        shareMessage?: (msg: unknown) => void;
        HapticFeedback?: { impactOccurred: (style: string) => void };
      };
    };
  }
}
