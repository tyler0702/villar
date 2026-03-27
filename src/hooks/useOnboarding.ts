import { useState, useCallback } from "react";

const STORAGE_KEY = "villar-onboarding-done";
const TOTAL_STEPS = 7;

export function useOnboarding() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) !== "true";
    } catch {
      return true;
    }
  });

  const next = useCallback(() => {
    setStep((s) => {
      if (s >= TOTAL_STEPS - 1) {
        // Complete
        setVisible(false);
        try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* */ }
        return s;
      }
      return s + 1;
    });
  }, []);

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  const skip = useCallback(() => {
    setVisible(false);
    try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /* */ }
  }, []);

  const restart = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* */ }
    setStep(0);
    setVisible(true);
  }, []);

  return { step, totalSteps: TOTAL_STEPS, visible, next, prev, skip, restart };
}
