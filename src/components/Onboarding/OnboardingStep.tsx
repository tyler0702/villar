interface OnboardingStepProps {
  title: string;
  description: string;
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  isFirst: boolean;
  isLast: boolean;
  position?: { top: number; left: number; width: number; height: number } | null;
  nextLabel: string;
  prevLabel: string;
  skipLabel: string;
  doneLabel: string;
}

export function OnboardingStep({
  title, description, step, totalSteps,
  onNext, onPrev, onSkip,
  isFirst, isLast, position,
  nextLabel, prevLabel, skipLabel, doneLabel,
}: OnboardingStepProps) {
  // For modal steps (welcome/done) — no position
  const isModal = !position;

  // Tooltip placement: below target if top half of screen, above otherwise
  const tooltipStyle: React.CSSProperties = isModal
    ? { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }
    : (() => {
        const below = position.top + position.height + 16;
        const above = position.top - 16;
        const useBelow = position.top < window.innerHeight / 2;
        return {
          position: "fixed" as const,
          top: useBelow ? below : undefined,
          bottom: useBelow ? undefined : window.innerHeight - above,
          left: Math.max(16, Math.min(position.left, window.innerWidth - 340)),
          maxWidth: 320,
        };
      })();

  return (
    <div style={tooltipStyle} className="bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 p-5 z-[100] select-none">
      <div className="text-xs text-gray-400 dark:text-gray-500 mb-1">{step + 1} / {totalSteps}</div>
      <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mb-4">{description}</p>
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={onSkip}
          className="text-[11px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          {skipLabel}
        </button>
        <div className="flex items-center gap-2">
          {!isFirst ? (
            <button
              onClick={onPrev}
              className="px-3 py-1 text-[11px] font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              {prevLabel}
            </button>
          ) : null}
          <button
            onClick={onNext}
            className="px-3 py-1 text-[11px] font-medium rounded-lg bg-accent-500 text-white hover:bg-accent-600 transition-colors"
          >
            {isLast ? doneLabel : nextLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
