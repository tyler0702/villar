import { useEffect, useMemo, useRef } from "react";
import { resolveLocalUrl } from "../../hooks/useMarkdown";
import { resolveRelativePath, openMarkdownFileByPath } from "../../hooks/openMarkdownFile";

interface OriginalHtmlViewProps {
  content: string;
  filePath: string | null;
  onScrollProgress?: (progress: number) => void;
}

// Browser-like rendering of the original HTML in a sandboxed srcdoc iframe.
// The frame has an opaque origin and no Tauri API access. Styles, scripts,
// fonts and images load exactly as a browser would — including CDN
// resources — which is a deliberate exception to the app's local-only rule:
// this view exists to show the document as its author designed it. The
// injected CSP only hardens what the sandbox doesn't cover (no nested
// frames, plugins, <base> hijacking or form submission). The click handler
// makes #anchors scroll in place and posts http(s) links to the parent,
// which opens them in the external browser — matching card-view links.
const INJECT = `
<meta http-equiv="Content-Security-Policy" content="frame-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<script>
document.addEventListener("click", function (e) {
  var a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
  if (!a) return;
  var href = a.getAttribute("href") || "";
  e.preventDefault();
  if (href.charAt(0) === "#") {
    var id = decodeURIComponent(href.slice(1));
    var el = document.getElementById(id) || document.getElementsByName(id)[0];
    if (!el) {
      // AI-made TOCs often link to ids the headings never got — fall back
      // to the heading whose text equals the fragment.
      var hs = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
      for (var i = 0; i < hs.length; i++) {
        if (hs[i].textContent.trim() === id) { el = hs[i]; break; }
      }
    }
    if (el) el.scrollIntoView({ behavior: "smooth" });
  } else if (/^(https?:|mailto:)/i.test(href)) {
    if (e.isTrusted) parent.postMessage({ villarOpenUrl: href }, "*");
  } else if (!/^[a-z][a-z0-9+.-]*:/i.test(href)) {
    // Scheme-less relative link — likely a sibling document; let villar decide.
    if (e.isTrusted) parent.postMessage({ villarOpenDoc: href }, "*");
  }
  // Any other scheme (javascript:, file:, …) stays blocked.
}, true);
addEventListener("scroll", function () {
  var d = document.documentElement;
  var max = d.scrollHeight - d.clientHeight;
  var top = d.scrollTop || document.body.scrollTop;
  parent.postMessage({ villarScrollProgress: max > 0 ? Math.round((top / max) * 100) : 0 }, "*");
}, { passive: true });
</script>`;

// Rewrite relative src/href attributes (stylesheets, scripts, images, media)
// to asset-protocol URLs so files next to the document load. srcdoc frames
// inherit the app's base URL, so relative paths would otherwise 404.
export function resolveLocalResources(html: string, basePath: string | null): string {
  if (!basePath) return html;
  return html.replace(
    /(<(?:img|script|link|source|video|audio)\b[^>]*?\s(?:src|href)=")([^"]+)(")/gi,
    (match, pre: string, url: string, post: string) => {
      const resolved = resolveLocalUrl(url, basePath);
      return resolved ? pre + resolved + post : match;
    }
  );
}

export function injectIntoHead(html: string, snippet: string): string {
  const head = html.match(/<head[^>]*>/i);
  if (head?.index !== undefined) {
    const at = head.index + head[0].length;
    return html.slice(0, at) + snippet + html.slice(at);
  }
  const root = html.match(/<html[^>]*>/i);
  if (root?.index !== undefined) {
    const at = root.index + root[0].length;
    return html.slice(0, at) + snippet + html.slice(at);
  }
  return snippet + html;
}

export function OriginalHtmlView({ content, filePath, onScrollProgress }: OriginalHtmlViewProps) {
  const lastOpenRef = useRef(0);
  const srcDoc = useMemo(
    () => injectIntoHead(resolveLocalResources(content, filePath), INJECT),
    [content, filePath]
  );

  useEffect(() => {
    function onMessage(e: MessageEvent) {
      const data = e.data as {
        villarOpenUrl?: unknown;
        villarOpenDoc?: unknown;
        villarScrollProgress?: unknown;
      } | null;
      if (
        typeof data?.villarOpenUrl === "string" &&
        /^(https?:\/\/|mailto:)/i.test(data.villarOpenUrl)
      ) {
        // Rate-limit so a script inside the frame can't spam browser windows.
        const now = Date.now();
        if (now - lastOpenRef.current > 1000) {
          lastOpenRef.current = now;
          const url = data.villarOpenUrl;
          import("@tauri-apps/plugin-opener").then(({ openUrl }) => openUrl(url));
        }
      }
      if (typeof data?.villarOpenDoc === "string" && filePath) {
        const pathPart = decodeURIComponent(data.villarOpenDoc.split(/[?#]/)[0]);
        if (/\.(md|html?)$/i.test(pathPart)) {
          openMarkdownFileByPath(resolveRelativePath(filePath, pathPart));
        }
      }
      if (typeof data?.villarScrollProgress === "number") {
        onScrollProgress?.(data.villarScrollProgress);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [onScrollProgress, filePath]);

  return (
    <iframe
      sandbox="allow-scripts"
      srcDoc={srcDoc}
      title="Web"
      className="flex-1 w-full border-0 bg-white"
    />
  );
}
