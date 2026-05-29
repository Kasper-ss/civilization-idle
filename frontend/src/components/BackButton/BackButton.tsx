import { useNavigate } from 'react-router-dom';
import { useLocaleStore } from '../../store/localeStore';

interface Props {
  className?: string;
}

export function BackButton({ className = 'mx-3 mt-2' }: Props) {
  const navigate = useNavigate();
  const t = useLocaleStore((s) => s.t);

  return (
    <button
      type="button"
      className={`flex items-center gap-1.5 py-1 text-sm text-white/70 transition hover:text-civ-gold ${className}`}
      onClick={() => navigate('/')}
    >
      <span className="text-lg leading-none" aria-hidden>
        ←
      </span>
      <span>{t.common.back}</span>
    </button>
  );
}
