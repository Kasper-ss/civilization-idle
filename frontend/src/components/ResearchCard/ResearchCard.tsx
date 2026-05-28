import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';

type Status = 'locked' | 'available' | 'completed';

interface Props {
  researchKey: string;
  name: string;
  level: number;
  maxDisplay?: number;
  status: Status;
  bonus: string;
  eraUnlock: number;
}

export function ResearchCard({ researchKey, name, level, status, bonus, eraUnlock }: Props) {
  const research = useGameStore((s) => s.research);
  const [error, setError] = useState('');

  const handle = async () => {
    try {
      setError('');
      await research(researchKey);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const statusColors = {
    locked: 'border-red-500/30 opacity-60',
    available: 'border-emerald-500/40',
    completed: 'border-amber-500/40',
  };

  return (
    <div className={`glass-panel border-2 p-3 ${statusColors[status]}`}>
      <div className="flex justify-between">
        <h3 className="font-display text-civ-gold">{name}</h3>
        <span className="text-xs uppercase tracking-wide text-white/50">{status}</span>
      </div>
      <p className="text-sm">Level {level}</p>
      <p className="text-xs text-white/50">{bonus}</p>
      {status === 'locked' && <p className="text-xs text-red-400">Era {eraUnlock + 1}+</p>}
      {status === 'available' && (
        <>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button className="btn-gold mt-2 w-full text-sm" onClick={handle}>
            Research
          </button>
        </>
      )}
    </div>
  );
}
