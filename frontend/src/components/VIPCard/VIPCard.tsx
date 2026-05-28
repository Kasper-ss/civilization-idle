interface Props {
  tier: string;
  price: number;
  perks: string[];
  active?: boolean;
  onSelect: () => void;
}

export function VIPCard({ tier, price, perks, active, onSelect }: Props) {
  const colors: Record<string, string> = {
    bronze: 'from-orange-900/50 to-amber-950/50 border-orange-600/40',
    silver: 'from-slate-700/50 to-slate-900/50 border-slate-400/40',
    gold: 'from-amber-700/50 to-yellow-900/50 border-yellow-400/50',
  };

  return (
    <div className={`glass-panel border-2 bg-gradient-to-br p-4 ${colors[tier] ?? ''}`}>
      <div className="flex justify-between">
        <h3 className="font-display text-lg capitalize text-civ-gold">VIP {tier}</h3>
        {active && <span className="text-xs text-emerald-400">Active</span>}
      </div>
      <p className="text-sm text-white/70">{price} ⭐ / month</p>
      <ul className="mt-2 space-y-1 text-xs text-white/60">
        {perks.map((p) => (
          <li key={p}>• {p}</li>
        ))}
      </ul>
      <button className="btn-gold mt-3 w-full text-sm" onClick={onSelect}>
        Subscribe
      </button>
    </div>
  );
}
