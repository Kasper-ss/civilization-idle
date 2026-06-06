export const APPSS_VERIFY_CODE = 'appss_4a4661';

export function AppssVerifyButton() {
  const handleClick = () => {
    const tg = window.Telegram?.WebApp;
    if (tg?.showAlert) {
      tg.showAlert(APPSS_VERIFY_CODE);
      return;
    }
    alert(APPSS_VERIFY_CODE);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="fixed bottom-0 left-0 right-0 z-[60] mx-auto max-w-[480px] border-t border-white/10 bg-civ-dark/95 py-1.5 text-center text-[11px] text-white/45 touch-manipulation pb-[max(0.25rem,env(safe-area-inset-bottom))]"
    >
      /appss_verify
    </button>
  );
}
