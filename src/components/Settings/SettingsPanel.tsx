import { useAppStore } from "../../stores/useAppStore";
import type { ContentWidth, MermaidDefault } from "../../stores/useAppStore";
import { parseVscodeTheme } from "../../hooks/useVscodeTheme";

const SHORTCUTS = [
  { key: "\u2190 \u2192", action: "Navigate cards" },
  { key: "Home / End", action: "First / Last" },
  { key: "F", action: "Focus mode" },
  { key: "T", action: "Cycle theme" },
  { key: "\u2318K", action: "Search" },
  { key: "\u2318,", action: "Settings" },
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
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-gray-600 dark:text-gray-300 shrink-0">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`w-10 h-[22px] rounded-full transition-colors relative shrink-0 ${
        value ? "bg-accent-500" : "bg-gray-300 dark:bg-gray-600"
      }`}
    >
      <span
        className={`absolute left-0.5 top-[3px] w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
          value ? "translate-x-[18px]" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2.5">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

export function SettingsPanel({ width }: { width?: number }) {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const close = () => useAppStore.getState().setSettingsOpen(false);

  return (
    <aside style={{ fontSize: "16px", width: width ?? 256 }} className="shrink-0 border-l border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm overflow-y-auto flex flex-col">
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">Settings</span>
        <button
          onClick={close}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm leading-none"
        >
          &times;
        </button>
      </div>

      <div className="px-4 py-3 space-y-5 flex-1">
        <Section title="Display">
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
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={50}
                max={150}
                step={5}
                value={settings.fontScale}
                onChange={(e) => update({ fontScale: Number(e.target.value) })}
                className="w-20 accent-accent-500"
              />
              <span className="text-[10px] text-gray-400 w-8 text-right tabular-nums">{settings.fontScale}%</span>
            </div>
          </Row>
          <Row label="Line Height">
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={100}
                max={250}
                step={10}
                value={settings.lineHeight}
                onChange={(e) => update({ lineHeight: Number(e.target.value) })}
                className="w-20 accent-accent-500"
              />
              <span className="text-[10px] text-gray-400 w-8 text-right tabular-nums">{settings.lineHeight}%</span>
            </div>
          </Row>
          <Row label="Width">
            <SegmentControl<ContentWidth>
              value={settings.contentWidth}
              options={[
                { value: "narrow", label: "Narrow" },
                { value: "medium", label: "Mid" },
                { value: "wide", label: "Wide" },
              ]}
              onChange={(v) => update({ contentWidth: v })}
            />
          </Row>
        </Section>

        <Section title="Reading">
          <Row label="Focus Opacity">
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={settings.focusOpacity}
                onChange={(e) => update({ focusOpacity: Number(e.target.value) })}
                className="w-20 accent-accent-500"
              />
              <span className="text-[10px] text-gray-400 w-7 text-right tabular-nums">{settings.focusOpacity}%</span>
            </div>
          </Row>
          <Row label="TL;DR">
            <SegmentControl
              value={settings.tldrExpanded ? "open" : "closed"}
              options={[
                { value: "open", label: "Open" },
                { value: "closed", label: "Closed" },
              ]}
              onChange={(v) => update({ tldrExpanded: v === "open" })}
            />
          </Row>
          <Row label="Mermaid">
            <SegmentControl<MermaidDefault>
              value={settings.mermaidDefault}
              options={[
                { value: "step", label: "Steps" },
                { value: "diagram", label: "Diagram" },
              ]}
              onChange={(v) => update({ mermaidDefault: v })}
            />
          </Row>
          <Row label="Fold Lists >">
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={3}
                max={20}
                step={1}
                value={settings.collapseListThreshold}
                onChange={(e) => update({ collapseListThreshold: Number(e.target.value) })}
                className="w-20 accent-accent-500"
              />
              <span className="text-[10px] text-gray-400 w-5 text-right tabular-nums">{settings.collapseListThreshold}</span>
            </div>
          </Row>
          <Row label="Fold Code >">
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={settings.collapseCodeThreshold}
                onChange={(e) => update({ collapseCodeThreshold: Number(e.target.value) })}
                className="w-20 accent-accent-500"
              />
              <span className="text-[10px] text-gray-400 w-5 text-right tabular-nums">{settings.collapseCodeThreshold}</span>
            </div>
          </Row>
        </Section>

        <Section title="Theme File">
          <div className="space-y-2">
            {settings.vscodeTheme ? (
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 truncate">{settings.vscodeTheme.name}</span>
                <button
                  onClick={() => update({ vscodeTheme: null })}
                  className="text-[10px] text-red-500 hover:text-red-400"
                >
                  Remove
                </button>
              </div>
            ) : null}
            <label className="block">
              <span className="text-[10px] text-gray-400">Import VSCode .json theme</span>
              <input
                type="file"
                accept=".json"
                className="block w-full text-[10px] text-gray-500 mt-1 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:bg-gray-100 dark:file:bg-gray-700 file:text-gray-600 dark:file:text-gray-300 cursor-pointer"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    const text = await file.text();
                    const json = JSON.parse(text);
                    const theme = parseVscodeTheme(json);
                    if (theme) update({ vscodeTheme: theme });
                  } catch { /* ignore invalid files */ }
                  e.target.value = "";
                }}
              />
            </label>
            {settings.vscodeTheme ? (
              <div className="flex gap-1 flex-wrap">
                {Object.entries(settings.vscodeTheme)
                  .filter(([k, v]) => k !== "name" && typeof v === "string" && v.startsWith("#"))
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center gap-1" title={k}>
                      <div className="w-3 h-3 rounded-sm border border-gray-300 dark:border-gray-600" style={{ backgroundColor: v as string }} />
                    </div>
                  ))}
              </div>
            ) : null}
          </div>
        </Section>

        <Section title="General">
          <Row label="Restore Session">
            <Toggle value={settings.restoreSession} onChange={(v) => update({ restoreSession: v })} />
          </Row>
        </Section>

        <Section title="Shortcuts">
          <div className="space-y-0.5">
            {SHORTCUTS.map((s) => (
              <div key={s.key} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{s.action}</span>
                <kbd className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{s.key}</kbd>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}
