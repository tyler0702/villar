import { useEffect, useState } from "react";
import { OnboardingStep } from "./OnboardingStep";
import { useTranslation } from "../../i18n/useTranslation";

interface StepDef {
  titleKey: string;
  descKey: string;
  target: string | null; // data-onboarding value, null for modal
}

const STEPS: StepDef[] = [
  { titleKey: "onboarding.welcome.title", descKey: "onboarding.welcome.desc", target: null },
  { titleKey: "onboarding.folder.title", descKey: "onboarding.folder.desc", target: "open" },
  { titleKey: "onboarding.cards.title", descKey: "onboarding.cards.desc", target: "main" },
  { titleKey: "onboarding.nav.title", descKey: "onboarding.nav.desc", target: "nav" },
  { titleKey: "onboarding.search.title", descKey: "onboarding.search.desc", target: "search" },
  { titleKey: "onboarding.settings.title", descKey: "onboarding.settings.desc", target: "settings" },
  { titleKey: "onboarding.done.title", descKey: "onboarding.done.desc", target: null },
];

interface Props {
  step: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
}

export function OnboardingOverlay({ step, totalSteps, onNext, onPrev, onSkip }: Props) {
  const t = useTranslation();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const def = STEPS[step];

  useEffect(() => {
    if (!def.target) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(`[data-onboarding="${def.target}"]`);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
    } else {
      setTargetRect(null);
    }
  }, [step, def.target]);

  // Spotlight cutout via clip-path
  const pad = 8;
  const clipPath = targetRect
    ? `polygon(
        0% 0%, 0% 100%, 100% 100%, 100% 0%, 0% 0%,
        ${targetRect.left - pad}px ${targetRect.top - pad}px,
        ${targetRect.left - pad}px ${targetRect.bottom + pad}px,
        ${targetRect.right + pad}px ${targetRect.bottom + pad}px,
        ${targetRect.right + pad}px ${targetRect.top - pad}px,
        ${targetRect.left - pad}px ${targetRect.top - pad}px
      )`
    : undefined;

  return (
    <div className="fixed inset-0 z-[99]">
      {/* Overlay with optional spotlight cutout */}
      <div
        className="absolute inset-0 bg-black/50 transition-all duration-300"
        style={clipPath ? { clipPath } : undefined}
        onClick={onSkip}
      />

      {/* Spotlight highlight ring */}
      {targetRect ? (
        <div
          className="absolute rounded-lg ring-2 ring-accent-400/80 pointer-events-none transition-all duration-300"
          style={{
            top: targetRect.top - pad,
            left: targetRect.left - pad,
            width: targetRect.width + pad * 2,
            height: targetRect.height + pad * 2,
          }}
        />
      ) : null}

      <OnboardingStep
        title={t(def.titleKey)}
        description={t(def.descKey)}
        step={step}
        totalSteps={totalSteps}
        onNext={onNext}
        onPrev={onPrev}
        onSkip={onSkip}
        isFirst={step === 0}
        isLast={step === totalSteps - 1}
        position={targetRect ? { top: targetRect.top, left: targetRect.left, width: targetRect.width, height: targetRect.height } : null}
        nextLabel={t("onboarding.next")}
        prevLabel={t("onboarding.prev")}
        skipLabel={t("onboarding.skip")}
        doneLabel={t("onboarding.done")}
      />
    </div>
  );
}
