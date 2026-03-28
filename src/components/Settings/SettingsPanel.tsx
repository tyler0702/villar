import { useAppStore } from "../../stores/useAppStore";
import type { ContentWidth, MermaidDefault, VscodeThemeColors } from "../../stores/useAppStore";
import { BUILTIN_THEMES } from "../../themes/builtin";
import { FONT_OPTIONS } from "../../themes/fonts";
import { LANGUAGES } from "../../i18n/translations";
import { useTranslation } from "../../i18n/useTranslation";

const SHORTCUT_KEYS = [
  { key: "\u2190 \u2192", tKey: "shortcut.navigate" },
  { key: "Home / End", tKey: "shortcut.firstLast" },
  { key: "Space", tKey: "shortcut.scrollPage" },
  { key: "F", tKey: "shortcut.focusMode" },
  { key: "\u2318K", tKey: "shortcut.search" },
  { key: "\u2318F", tKey: "shortcut.find" },
  { key: "\u2318W", tKey: "shortcut.closeTab" },
  { key: "\u2318+/\u2318-", tKey: "shortcut.zoomInOut" },
  { key: "\u23180", tKey: "shortcut.resetZoom" },
  { key: "\u2318\u21E7N", tKey: "shortcut.newWindow" },
  { key: "\u2318,", tKey: "shortcut.settings" },
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
          className={`flex-1 px-2 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap leading-tight ${
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

function ThemeItem({
  theme,
  isDefault,
  isActive,
  activeLabel,
  onSelect,
}: {
  theme: VscodeThemeColors;
  isDefault: boolean;
  isActive: boolean;
  activeLabel: string;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors ${
        isActive
          ? "bg-accent-100 dark:bg-accent-900 ring-1 ring-accent-300 dark:ring-accent-700"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
    >
      {isDefault ? (
        <div className="flex gap-0.5 shrink-0">
          <div className="w-3 h-3 rounded-sm bg-surface-50 border border-gray-200" />
          <div className="w-3 h-3 rounded-sm bg-surface-900 border border-gray-700" />
        </div>
      ) : (
        <div className="flex gap-0.5 shrink-0">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.bg, border: `1px solid ${theme.border}` }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.headingColor }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.linkColor }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.codeBg, border: `1px solid ${theme.border}` }} />
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.accent }} />
        </div>
      )}
      <span className={`text-[11px] truncate ${isActive ? "font-medium" : ""}`}>
        {theme.name}
      </span>
      {isActive ? <span className="text-[9px] text-accent-500 ml-auto shrink-0">{activeLabel}</span> : null}
    </button>
  );
}

export function SettingsPanel({ width, onRestartTutorial }: { width?: number; onRestartTutorial?: () => void }) {
  const settings = useAppStore((s) => s.settings);
  const update = useAppStore((s) => s.updateSettings);
  const t = useTranslation();

  return (
    <aside style={{ fontSize: "16px", width: width ?? 256 }} className="shrink-0 border-l border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm overflow-y-auto flex flex-col">
      <div className="px-4 pt-3 pb-2">
        <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{t("settings.title")}</span>
      </div>

      <div className="px-4 py-3 space-y-5 flex-1">
        <Section title={t("settings.display")}>
          <Row label={t("settings.language")}>
            <select
              value={settings.language}
              onChange={(e) => update({ language: e.target.value })}
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1 outline-none cursor-pointer w-28"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </Row>
          <Row label={t("settings.font")}>
            <select
              value={settings.fontFamily}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg px-2 py-1 outline-none cursor-pointer w-28"
            >
              <optgroup label="Sans-serif">
                {FONT_OPTIONS.filter((f) => f.category === "sans").map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
              <optgroup label="Serif">
                {FONT_OPTIONS.filter((f) => f.category === "serif").map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
              <optgroup label="Monospace">
                {FONT_OPTIONS.filter((f) => f.category === "mono").map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
              <optgroup label="Japanese">
                {FONT_OPTIONS.filter((f) => f.category === "jp").map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
              <optgroup label="Chinese">
                {FONT_OPTIONS.filter((f) => f.category === "zh").map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
              <optgroup label="Korean">
                {FONT_OPTIONS.filter((f) => f.category === "ko").map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
              <optgroup label="Arabic">
                {FONT_OPTIONS.filter((f) => f.category === "ar").map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
              <optgroup label="International">
                {FONT_OPTIONS.filter((f) => f.category === "intl").map((f) => (
                  <option key={f.id} value={f.id}>{f.label}</option>
                ))}
              </optgroup>
            </select>
          </Row>
          <Row label={t("settings.fontSize")}>
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
          <Row label={t("settings.lineHeight")}>
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
          <Row label={t("settings.letterSpacing")}>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={-50}
                max={200}
                step={10}
                value={settings.letterSpacing}
                onChange={(e) => update({ letterSpacing: Number(e.target.value) })}
                className="w-20 accent-accent-500"
              />
              <span className="text-[10px] text-gray-400 w-8 text-right tabular-nums">{settings.letterSpacing}</span>
            </div>
          </Row>
          <Row label={t("settings.width")}>
            <SegmentControl<ContentWidth>
              value={settings.contentWidth}
              options={[
                { value: "narrow", label: t("settings.width.narrow") },
                { value: "medium", label: t("settings.width.mid") },
                { value: "wide", label: t("settings.width.wide") },
              ]}
              onChange={(v) => update({ contentWidth: v })}
            />
          </Row>
        </Section>

        <Section title={t("settings.reading")}>
          <Row label={t("settings.paragraphSpacing")}>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min={100}
                max={300}
                step={10}
                value={settings.paragraphSpacing}
                onChange={(e) => update({ paragraphSpacing: Number(e.target.value) })}
                className="w-20 accent-accent-500"
              />
              <span className="text-[10px] text-gray-400 w-8 text-right tabular-nums">{settings.paragraphSpacing}%</span>
            </div>
          </Row>
          <Row label={t("settings.focusOpacity")}>
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
          <Row label={t("settings.tldr")}>
            <SegmentControl
              value={settings.tldrExpanded ? "open" : "closed"}
              options={[
                { value: "open", label: t("settings.tldr.open") },
                { value: "closed", label: t("settings.tldr.closed") },
              ]}
              onChange={(v) => update({ tldrExpanded: v === "open" })}
            />
          </Row>
          <Row label={t("settings.mermaid")}>
            <SegmentControl<MermaidDefault>
              value={settings.mermaidDefault}
              options={[
                { value: "step", label: t("settings.mermaid.steps") },
                { value: "diagram", label: t("settings.mermaid.diagram") },
              ]}
              onChange={(v) => update({ mermaidDefault: v })}
            />
          </Row>
          <Row label={t("settings.foldLists")}>
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
          <Row label={t("settings.foldCode")}>
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

        <Section title={t("settings.colorTheme")}>
          <div className="space-y-1.5 max-h-52 overflow-y-auto">
            {BUILTIN_THEMES.map((theme) => {
              const isVillarDefault = theme.name.startsWith("villar ");
              const isActive = settings.vscodeTheme
                ? settings.vscodeTheme.name === theme.name
                : !settings.vscodeTheme && theme.name === "villar Light";
              return (
                <ThemeItem
                  key={theme.name}
                  theme={theme}
                  isDefault={isVillarDefault}
                  isActive={isActive}
                  activeLabel={t("settings.theme.active")}
                  onSelect={() => update({ vscodeTheme: theme })}
                />
              );
            })}
          </div>
        </Section>

        <Section title={t("settings.general")}>
          <Row label={t("settings.restoreSession")}>
            <Toggle value={settings.restoreSession} onChange={(v) => update({ restoreSession: v })} />
          </Row>
          {onRestartTutorial ? (
            <Row label={t("settings.tutorial")}>
              <button
                onClick={() => { onRestartTutorial(); useAppStore.getState().setSettingsOpen(false); }}
                className="px-3 py-1 text-[11px] font-medium rounded-lg bg-accent-100 dark:bg-accent-900 hover:bg-accent-200 dark:hover:bg-accent-800 text-accent-700 dark:text-accent-200 transition-colors"
                data-testid="restart-onboarding"
              >
                &#9654;
              </button>
            </Row>
          ) : null}
        </Section>

        <Section title={t("settings.shortcuts")}>
          <div className="space-y-0.5">
            {SHORTCUT_KEYS.map((s) => (
              <div key={s.key} className="flex items-center justify-between">
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{t(s.tKey)}</span>
                <kbd className="text-[10px] font-mono text-gray-400 dark:text-gray-500">{s.key}</kbd>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}
