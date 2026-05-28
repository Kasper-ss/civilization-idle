import type { ResourceKey, ResourceState } from '../../types/game';
import { useLocaleStore } from '../../store/localeStore';
import { RESOURCE_ICONS, formatNumber } from '../../utils/format';

interface Props {
  resourceKey: ResourceKey;
  data: ResourceState;
  compact?: boolean;
}

export function ResourceCard({ resourceKey, data, compact }: Props) {
  const t = useLocaleStore((s) => s.t);
  const pct = data.storageLimit > 0 ? (data.currentAmount / data.storageLimit) * 100 : 0;
  const label = t.resources[resourceKey] ?? resourceKey;

  if (compact) {
    return (
      <div className="flex flex-col rounded-lg bg-black/30 px-3 py-2 text-xs">
        <span className="text-white/50">
          {RESOURCE_ICONS[resourceKey]} {label}
        </span>
        <span className="mt-0.5 text-base font-semibold text-civ-gold">{formatNumber(data.currentAmount)}</span>
        {data.productionPerHour > 0 && (
          <span className="text-[10px] text-emerald-400/80">+{formatNumber(data.productionPerHour)}/h</span>
        )}
      </div>
    );
  }

  return (
    <div className="glass-panel p-2">
      <div className="flex items-center justify-between text-sm">
        <span>
          {RESOURCE_ICONS[resourceKey]} <span>{label}</span>
        </span>
        <span className="font-semibold text-civ-gold">{formatNumber(data.currentAmount)}</span>
      </div>
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-black/40">
        <div className="h-full bg-amber-500/70 transition-all" style={{ width: `${Math.min(100, pct)}%` }} />
      </div>
      <p className="mt-1 text-[10px] text-white/50">+{formatNumber(data.productionPerHour)}/h</p>
    </div>
  );
}
