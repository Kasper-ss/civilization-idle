import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { formatNumber } from '../../utils/format';

interface Props {
  id: string;
  name: string;
  bonus: string;
  durationHours: number;
  cost: Record<string, number>;
  built: boolean;
  building: boolean;
  blocked: boolean;
}

export function WonderCard({ id, name, bonus, durationHours, cost, built, building, blocked }: Props) {
  const startWonder = useGameStore((s) => s.startWonder);
  const [error, setError] = useState('');

  const handle = async () => {
    try {
      setError('');
      await startWonder(id);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="glass-panel p-3">
      <h3 className="font-display text-civ-gold">{name}</h3>
      <p className="text-xs text-emerald-400">{bonus}</p>
      <p className="text-xs text-white/50">
        Duration: {durationHours}h | Cost:{' '}
        {Object.entries(cost)
          .map(([k, v]) => `${formatNumber(v)} ${k}`)
          .join(', ')}
      </p>
      {built && <span className="text-xs text-amber-400">✓ Built</span>}
      {building && <span className="text-xs text-blue-400">⏳ Under construction</span>}
      {!built && !building && !blocked && (
        <>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button className="btn-gold mt-2 w-full text-sm" onClick={handle}>
            Start Construction
          </button>
        </>
      )}
    </div>
  );
}
