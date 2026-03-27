import { useEffect, useState, useCallback } from "react";

const SKIP_KEY = "villar-skip-version";
const RELEASES_URL = "https://api.github.com/repos/tyler0702/villar/releases/latest";

interface UpdateState {
  hasUpdate: boolean;
  latestVersion: string;
  releaseUrl: string;
  dismiss: () => void;
  skipVersion: () => void;
}

function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/, "").split(".").map(Number);
  const pb = b.replace(/^v/, "").split(".").map(Number);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const na = pa[i] ?? 0;
    const nb = pb[i] ?? 0;
    if (na !== nb) return na - nb;
  }
  return 0;
}

export function useUpdateCheck(): UpdateState {
  const [latestVersion, setLatestVersion] = useState("");
  const [releaseUrl, setReleaseUrl] = useState("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(RELEASES_URL);
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;

        const tag = data?.tag_name;
        const url = data?.html_url;
        if (typeof tag !== "string" || typeof url !== "string") return;

        setLatestVersion(tag);
        setReleaseUrl(url);
      } catch {
        // Network error, rate limit, or parse error — silent
      }
    })();

    return () => { cancelled = true; };
  }, []);

  const currentVersion = typeof __APP_VERSION__ === "string" ? __APP_VERSION__ : "0.0.0";
  const skippedVersion = localStorage.getItem(SKIP_KEY);
  const isNewer = latestVersion !== "" && compareVersions(latestVersion, currentVersion) > 0;
  const isSkipped = skippedVersion === latestVersion;
  const hasUpdate = isNewer && !isSkipped && !dismissed;

  const dismiss = useCallback(() => setDismissed(true), []);
  const skipVersion = useCallback(() => {
    if (latestVersion) {
      localStorage.setItem(SKIP_KEY, latestVersion);
    }
    setDismissed(true);
  }, [latestVersion]);

  return { hasUpdate, latestVersion, releaseUrl, dismiss, skipVersion };
}
