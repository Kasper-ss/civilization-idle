export function formatNumber(n: number): string {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return Math.floor(n).toLocaleString();
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export const RESOURCE_ICONS: Record<string, string> = {
  food: '🌾',
  wood: '🪵',
  stone: '🪨',
  bronze: '🥉',
  iron: '⚙️',
  gold: '🪙',
  science: '🔬',
  population: '👥',
  energy: '⚡',
  coal: '🖤',
  titanium: '🛸',
  darkMatter: '✨',
  gems: '💎',
};

export const ERA_BACKGROUNDS = [
  'from-stone-900 via-amber-950 to-stone-900',
  'from-amber-950 via-orange-950 to-stone-900',
  'from-zinc-900 via-slate-800 to-zinc-900',
  'from-indigo-950 via-purple-950 to-slate-900',
  'from-rose-950 via-amber-900 to-indigo-950',
  'from-gray-900 via-slate-700 to-gray-900',
  'from-blue-950 via-cyan-950 to-slate-900',
  'from-purple-950 via-indigo-950 to-black',
];
