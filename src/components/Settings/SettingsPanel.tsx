import { useAppStore } from "../../stores/useAppStore";
import type { FontSize, LineHeight, ContentWidth, MermaidDefault } from "../../stores/useAppStore";

const SHORTCUTS = [
  { key: "Arrow Left/Right", action: "Navigate cards" },
  { key: "Home / End", action: "First / Last card" },
  { key: "F", action: "Toggle focus mode" },
  { key: "T", action: "Cycle theme" },
  { key: "Cmd+K", action: "Search" },
  { key: "Cmd+,", action: "Settings" },
];

function SegmentControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex rounded-lg bg-gray-100 dark:bg-gray-800 p-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors ${
            value === opt.value
              ? "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 shadow-sm"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-sm text-gray-600 dark:text-gray-300 shrink-0">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-9 h-5 rounded-full transition-colors relative ${
        value ? "bg-accent-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${
          value ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function SettingsPanel() {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const close = () => useAppStore.getState().setSettingsOpen(false);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[10vh] bg-black/30 backdrop-blur-sm" onClick={close}>
      <div
        className="w-full max-w-md bg-white dark:bg-surface-800 rounded-xl shadow-2xl border border-gray-200/60 dark:border-gray-700/40 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.key === "Escape" && close()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/60 dark:border-gray-700/40">
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">Settings</span>
          <button onClick={close} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">&times;</button>
        </div>

        <div className="px-5 py-4 space-y-6 max-h-[65vh] overflow-y-auto">
          {/* Display */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Display</h3>
            <Row label="Theme">
              <SegmentControl
                value={settings.theme}
                options={[
                  { value: "system", label: "Auto" },
                  { value: "light", label: "Light" },
                  { value: "dark", label: "Dark" },
                ]}
                onChange={(v) => update({ theme: v })}
              />
            </Row>
            <Row label="Font Size">
              <SegmentControl<FontSize>
                value={settings.fontSize}
                options={[
                  { value: "sm", label: "S" },
                  { value: "base", label: "M" },
                  { value: "lg", label: "L" },
                ]}
                onChange={(v) => update({ fontSize: v })}
              />
            </Row>
            <Row label="Line Height">
              <SegmentControl<LineHeight>
                value={settings.lineHeight}
                options={[
                  { value: "tight", label: "Tight" },
                  { value: "normal", label: "Normal" },
                  { value: "relaxed", label: "Relaxed" },
                ]}
                onChange={(v) => update({ lineHeight: v })}
              />
            </Row>
            <Row label="Content Width">
              <SegmentControl<ContentWidth>
                value={settings.contentWidth}
                options={[
                  { value: "narrow", label: "Narrow" },
                  { value: "medium", label: "Medium" },
                  { value: "wide", label: "Wide" },
                ]}
                onChange={(v) => update({ contentWidth: v })}
              />
            </Row>
          </section>

          {/* Reading */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Reading</h3>
            <Row label="Focus Opacity">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={10}
                  max={50}
                  step={5}
                  value={settings.focusOpacity}
                  onChange={(e) => update({ focusOpacity: Number(e.target.value) })}
                  className="w-24 accent-accent-500"
                />
                <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{settings.focusOpacity}%</span>
              </div>
            </Row>
            <Row label="TL;DR Default">
              <SegmentControl
                value={settings.tldrExpanded ? "open" : "closed"}
                options={[
                  { value: "open", label: "Open" },
                  { value: "closed", label: "Closed" },
                ]}
                onChange={(v) => update({ tldrExpanded: v === "open" })}
              />
            </Row>
            <Row label="Mermaid Default">
              <SegmentControl<MermaidDefault>
                value={settings.mermaidDefault}
                options={[
                  { value: "step", label: "Steps" },
                  { value: "diagram", label: "Diagram" },
                ]}
                onChange={(v) => update({ mermaidDefault: v })}
              />
            </Row>
            <Row label="Collapse Lists >">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={3}
                  max={20}
                  step={1}
                  value={settings.collapseListThreshold}
                  onChange={(e) => update({ collapseListThreshold: Number(e.target.value) })}
                  className="w-24 accent-accent-500"
                />
                <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{settings.collapseListThreshold}</span>
              </div>
            </Row>
            <Row label="Collapse Code >">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={5}
                  max={50}
                  step={5}
                  value={settings.collapseCodeThreshold}
                  onChange={(e) => update({ collapseCodeThreshold: Number(e.target.value) })}
                  className="w-24 accent-accent-500"
                />
                <span className="text-xs text-gray-400 w-8 text-right tabular-nums">{settings.collapseCodeThreshold}L</span>
              </div>
            </Row>
          </section>

          {/* General */}
          <section className="space-y-3">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">General</h3>
            <Row label="Restore Last Session">
              <Toggle value={settings.restoreSession} onChange={(v) => update({ restoreSession: v })} />
            </Row>
          </section>

          {/* Shortcuts */}
          <section className="space-y-2">
            <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Keyboard Shortcuts</h3>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {SHORTCUTS.map((s) => (
                <div key={s.key} className="contents">
                  <kbd className="text-[10px] font-mono text-gray-500 dark:text-gray-400 text-right">{s.key}</kbd>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{s.action}</span>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
