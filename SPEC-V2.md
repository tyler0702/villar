# villar 実装指示書 V2（Claude Code向け）

この指示書に従って実装する。指示にないことは実装しない。機能追加の提案もしない。

## プロダクト概要

villar（ヴィラー） AIが書いたMarkdownを、人間が読める形に再構成するローカルビューア。

## 絶対に守る原則

- 元のmdファイルには一切書き込まない
- 外部サーバーへの送信は一切しない
- 編集機能は作らない
- 指示にない機能を勝手に追加しない
- 実装中に「〇〇も追加しましょうか？」と提案しない

## 技術スタック

| レイヤー | 選定 |
|---|---|
| フレームワーク | Tauri v2 |
| フロントエンド | React 19 + TypeScript |
| Markdown | remark + rehype |
| Mermaid | mermaid.js + LRUキャッシュ |
| ファイル監視 | Rust側（Tauri）+ debounce |
| スタイル | Tailwind CSS v4 |
| 状態管理 | Zustand |

---

## 実装フェーズ

### Phase 1 — 読書体験の基盤

#### 1-1. フォルダ選択 & ファイル一覧

- Tauriのダイアログでローカルフォルダを選択
- 配下の `.md` ファイルを左サイドバーにツリー表示（フォルダ階層を保持）
- フォルダはファイルより先にソート、各グループ内はcase-insensitiveアルファベット順
- 隠しディレクトリ・隠しファイル（`.`始まり）は除外
- ファイル名クリックでタブに表示

ファイル一覧に表示する情報：

```
file-name.md
更新日：2025/03/26 14:32
```

- 更新日（mtime）を表示
- 取得はRust側（Tauri）で `std::fs::metadata` を使用
- フォーマット：`YYYY/MM/DD HH:mm`

Linux環境の注意：
- ctimeはLinuxでは「メタデータ変更日」になるため、ファイル一覧には更新日（mtime）のみ表示する
- macOS / Windowsでは作成日（birthtime）も取得可能

#### 1-2. Markdownレンダリング

remark/rehype pipelineの構成：

```
remark-parse
  └─ remark-gfm         // GitHub Flavored Markdown（テーブル・取り消し線等）
  └─ remark-section     // H2セクション分割（カスタム）
  └─ remark-tldr        // TL;DRカード生成（カスタム・Phase 2）
  └─ remark-collapse    // 自動折りたたみ（カスタム・Phase 2）
  └─ remark-rehype
  └─ rehype-highlight   // シンタックスハイライト
  └─ rehype-stringify
```

後処理（HTML文字列に対して順次適用）：
- `collapseHtml` — 長いリスト・コードブロックをプレースホルダーに置換
- `addCopyButtonsToHtml` — `<pre>` ブロックにコピーボタン（`<button data-copy>`）を挿入
- `resolveImagePaths` — 相対画像パスをTauri `file://` URLに変換

Mermaidコードブロックはパイプライン前に抽出し、プレースホルダーに置換する。`SectionContent` でプレースホルダー位置に `MermaidBlock` を描画（Phase 3）。

Phase 1では `remark-section` と `rehype-highlight` と `remark-gfm` を有効化する。他のpluginはスタブとして用意しておく（後から差し込める設計）。

#### 1-3. H2ベースのカード表示

- H2単位でセクションを分割しカード化する
- カード間を「← 前」「次 →」でナビゲーション
- 現在のカード位置を「2 / 5 · 40%」形式で表示
- カードサムネイルを下部に表示

H2なし文書の救済：

```
H2が存在しない場合：
  → H1直下の段落を5段落ごとに暫定分割してカード化
  → H1もない場合は単一セクション "Document" として表示
  → サムネイルに「(自動分割)」と小さく表示
```

#### 1-4. ファイルヘッダー

ファイル表示エリアの最上部に表示：

```
architecture.md
作成日：2025/03/20 09:15  |  更新日：2025/03/26 14:32
```

- 作成日（birthtime）：macOS / Windowsのみ表示
- 更新日（mtime）：全OS表示
- Linuxの場合は「更新日：YYYY/MM/DD HH:mm」のみ表示
- 取得はRust側（Tauri）で行い、フロントに渡す

#### 1-5. フォーカスモード

- アクティブカード：opacity 100%・フル表示
- 非アクティブカード：デフォルト opacity 30%・縮小表示
- 設定パネルでフォーカス時opacity調整可能（10–50%、デフォルト30%）
- キーボードショートカット：`←` `→` でカード移動、`Home` `End` で先頭・末尾
- `F` キーでフォーカスモード切替

#### 1-6. テーマ

25種のビルトインカラーテーマ + システム設定連動：

- Dracula, One Dark Pro, Nord, Monokai Pro, GitHub Dark/Light, Solarized Dark/Light, Tokyo Night, Catppuccin Mocha/Latte, Rosé Pine/Dawn, Gruvbox Dark/Light, Ayu Dark/Light, Palenight, Synthwave '84, Cobalt2, Panda, Everforest Dark/Light, Kanagawa, villar Light/Dark

テーマ実装方式：
- CSS custom properties（`--vs-bg`, `--vs-fg`, `--vs-accent`, `--vs-sidebar-bg`, `--vs-sidebar-fg`, `--vs-editor-bg`, `--vs-editor-fg`, `--vs-border`, `--vs-selection`）
- `[data-vscode-theme]` 属性でセレクタ切替
- Dark/Lightはbackground輝度から自動判定
- テーマはMermaidダイアグラムにも反映（mermaid "base" theme + custom themeVariables）

#### 1-7. アウトライン

- H1/H2/H3を左サイドバーに自動抽出
- クリックで該当カードにジャンプ
- 現在のカードをハイライト

#### 1-8. タブシステム

- 複数ファイルを同時にタブで開く
- 各タブが独立して `content`, `activeCardIndex`, `scrollTop` を保持
- タブのドラッグ並び替え対応
- 右クリックコンテキストメニュー：「Open in Split Right」「Close Others」「Close」
- タブ閉じ時はアクティブインデックスを適切に調整

#### 1-9. スプリットビュー

- 2タブ以上ある場合にヘッダーの「Split」ボタンで切替
- 左ペイン：アクティブタブ、右ペイン：選択したタブ
- ドラッグでリサイズ可能なスプリッター
- スプリット幅は設定に永続化

#### 1-10. 読書設定

設定パネルで以下を調整可能：

- **フォントファミリー**：system, sans-serif, serif, monospace（デフォルト：system）
- **フォントスケール**：50–150%（デフォルト：100%）— CSS `zoom` で適用、ヘッダー/設定パネルは除外
- **行間**：100–250%（デフォルト：165%）— `--reading-line-height` CSS変数
- **コンテンツ幅**：Narrow (max-w-2xl) / Medium (max-w-4xl) / Wide (max-w-none)（デフォルト：Medium）
- 全設定は `localStorage` に永続化

#### 1-11. 全文検索

- Rust側で全 `.md` ファイルに対するcase-insensitive grep（結果上限100件）
- 結果表示：ファイル名、行番号、先頭120文字
- フロントエンド側200msデバウンス
- `Cmd+K` で検索パネルを開閉
- 結果クリックで該当ファイルをタブで開く

#### 1-12. 文書内検索（FindBar）

- 現在開いている文書内のテキスト検索
- ハイライト表示

#### 1-13. セッション復元

- フォルダパス + 開いているタブリストを `localStorage` に保存
- 次回起動時に復元（設定で「Restore Session」トグルによりON/OFF可能）

#### 1-14. ドラッグ＆ドロップ

- ファイルやフォルダのドラッグ＆ドロップによるファイルオープン対応

---

### Phase 2 — 理解支援レイヤー

#### 2-1. TL;DRカード

各カードの先頭に自動生成して表示する。

生成ロジック（ルールベース・AI不要）：

```
概要：H2配下の最初のpタグ（先頭1〜2文）
ポイント：箇条書きの先頭3件
キーワード：太字テキスト（**xxx**）を抽出（重複排除）
結論：「結論」「まとめ」「つまり」で始まる行
```

非表示条件（以下のいずれかを満たす場合）：

```
・概要候補（最初のpタグ）が取れない
・抽出文字数が50文字未満
・概要・ポイント・結論のうち、有効な要素が1つ未満
```

壊れたTL;DRより空白の方がいい。非表示にする。

表示形式：

```
┌─────────────────────────────────────┐
│ TL;DR                               │
│ 概要：この章はXXXについて説明する   │
│ ・ポイント1                         │
│ ・ポイント2                         │
│ キーワード：#AAA #BBB               │
└─────────────────────────────────────┘
```

#### 2-2. Rust側ファイル監視

- `notify` crateを使用（chokidarは使わない）
- debounce：300ms
- イベント種別：`file-changed`（内容変更）、`tree-changed`（構造変更）
- ファイル変更検知 → 該当ファイルのみ再レンダリング
- スクロール位置・カード位置を保持したまま更新
- 変更セクション検知：H2単位で差分を比較し、変更されたセクションにアンバー色リング + 「Changed」ラベルを表示（5秒後に自動消去）

#### 2-3. 自動折りたたみ

- 長いリスト（デフォルト5項目超）→ 先頭3件＋「もっと見る」ボタン
- コードブロック（デフォルト20行超）→ 先頭10行＋展開ボタン
- 折りたたみ閾値は設定パネルで変更可能：
  - リスト閾値：3–20項目（デフォルト5）
  - コードブロック閾値：5–50行（デフォルト20）
- 実装：HTML `<details>` は使用しない（Tauri WebView互換性問題）。プレースホルダーマーカー + React `CollapsibleBlock` コンポーネントで実装

#### 2-4. 既読トラッキング

- セクションごとの既読状態を `Set<string>`（キー：`"filePath:sectionIndex"`）で管理
- セクションクリック時に既読マーク
- 既読セクションにチェックマーク表示

---

### Phase 3 — Mermaid変換（最小構成）

#### 3-1. 変換対象

flowchartの直線構造のみ。それ以外は全てフォールバック。

#### 3-2. 変換判定ロジック

ASTの深い処理は不要。以下の構造条件だけを見る。

```
flowchartの構造情報を解析し、
全ノードが以下を満たす場合のみステップUIへ変換する：

・全ノードの出次数 ≤ 1（分岐なし）
・全ノードの入次数 ≤ 1（合流なし）
・開始ノードが正確に1つ（入次数 = 0）
・切断されたノードがない
・ループなし

→ 条件を満たす: ステップUI変換
→ 条件を満たさない: 元のMermaid図にフォールバック
```

#### 3-3. エラー処理（二段階フォールバック）

```
Step 1: 変換解析を試みる
Step 2: 変換不能 → 元のMermaid図で表示を試みる
Step 3: 元図レンダリングも失敗 → 「表示できません」＋元テキスト表示
```

変換解析の失敗と描画の失敗は別。必ず二段階で試みる。

#### 3-4. UI要件

- Step / Diagram / Raw の3モード切替ボタンを表示
- mermaid.js は動的インポート（~1MB、オンデマンド読み込み）
- LRUキャッシュでレンダリング結果を保持（最大50エントリ、キー：`"${themeName}:${code}"`）
- タイムアウト：1秒
- テーマカラーはmermaid "base" テーマ + custom themeVariablesで適用

#### 3-5. WebWorker化（条件付き）

- 100KBファイル・Mermaidブロック3個の条件でベンチマーク実施
- メインスレッドブロックが体感できるレベルであればWebWorkerに移行
- そうでなければ現状のメインスレッド実行＋LRUキャッシュ＋タイムアウトで十分

---

## 信頼性ポリシー

```
変換に自信がない → 必ず元のMermaidを表示する
TL;DR構成要素が不足 → 非表示（空白）
元ファイルへの書き込み → 絶対にしない
```

## パフォーマンス予算

計測前提：
- ファイルサイズ：50KB以上のmd
- Mermaidブロック：3個以内
- 実行環境：一般的な開発用ノートPC

| 指標 | 目標値 |
|---|---|
| 初回表示（フルパイプライン） | 500ms以内 |
| セクション分割 | 50ms以内 |
| TL;DR生成（セクションあたり） | 10ms以内 |
| Mermaid線形チェック | 5ms以内 |
| カード遷移 | 100ms以内 |
| ファイル更新反映 | 300ms以内 |
| Mermaid変換タイムアウト | 1秒 |

## 観測用ログ

ローカルログファイル（JSONL形式）に記録する。外部送信なし。`write_log` Tauriコマンドで書き込み。

計測項目：
- 開かれたファイル数・頻度
- TL;DR生成成功率
- Mermaid変換成功率
- フォールバック率
- 平均レンダリング時間

## 画面構成

```
┌──────────────────────────────────────────────────────┐
│  [フォルダ選択]  フォルダ名 / ファイル名             │
│  [検索] [スプリット] [フォーカス] [⚙設定]           │
├──────────────┬───────────────────────────────────────┤
│              │  [Tab1] [Tab2] [Tab3]                 │
│  ファイル    │  architecture.md                      │
│  ツリー      │  作成日：2025/03/20  更新日：03/26    │
│              │  ───────────────────────────────────  │
│  file-a.md  │  ┌───────────────────────────┐        │
│  03/26 14:32│  │ TL;DR                     │        │
│  file-b.md  │  │ 概要：XXX  ・P1  ・P2     │        │
│  03/25 09:10│  └───────────────────────────┘        │
│              │                                        │
│  ─────────  │  ## 章タイトル  [Step|Diagram|Raw]     │
│  アウトライン│                                        │
│  ## 章1     │  本文テキスト...                       │
│  ## 章2 ←  │                                        │
│  ## 章3     │  [STEP1]→[STEP2]→[STEP3]              │
│              │                                        │
│              │  ─────────────────────────────        │
│              │  [← 前]  2 / 5 · 40%  [次 →]         │
│              │  [□][■][□][□][□] ← サムネイル        │
└──────────────┴───────────────────────────────────────┘
```

## 主要パターン

- **CSS変数によるテーマ適用** — `[data-vscode-theme] .vs-card { ... }` パターン
- **読書設定のCSS変数適用** — `.reading-root` に `--reading-font`, `--reading-line-height` を設定
- **コピーボタン埋め込み** — `addCopyButtonsToHtml` で `<pre>` に `<button data-copy>` を注入、`HtmlBlock` でイベント委譲
- **折りたたみはReactで実装** — HTML `<details>` は不使用（Tauri WebView問題）。プレースホルダーマーカー + `CollapsibleBlock` コンポーネント
- **フォントスケールはCSS zoom** — sidebar + mainに `style={{ zoom }}` で適用、header/settingsは除外
- **Mermaid抽出** — HTMLレンダリング前にコードブロックを抽出→プレースホルダー置換→ `SectionContent` でプレースホルダー位置に `MermaidBlock` を描画

## 状態管理（Zustand）

`useAppStore` で管理する状態：

- `folderPath`, `tree` — フォルダパスとファイルツリー
- `tabs[]`, `activeTabIndex` — タブシステム（各タブ：file, content, previousContent, changedSections, activeCardIndex, scrollTop）
- `settings` — 全読書・表示設定（localStorage永続化）
- `focusMode` — フォーカスモードON/OFF
- `settingsOpen`, `findOpen` — パネル開閉状態
- `readSections` — 既読セクションSet
- `splitMode`, `splitTabIndex` — スプリットビュー状態

セッション永続化：
- セッション情報（フォルダ + タブリスト）：`"villar-session"` localStorage
- 設定：`"villar-settings"` localStorage

## Rust バックエンド（src-tauri/src/lib.rs）

全コマンド：

- `list_md_files(dir_path)` — `FsNode` ツリーを返す（name, path, is_dir, children, **mtime**）。フォルダ→ファイル順、隠しディレクトリ除外
- `read_file(file_path)` — ファイル内容読み取り
- `search_files(dir_path, query)` — case-insensitive grep、結果上限100件
- `watch_folder(dir_path)` — `notify` crate、300msデバウンス、`file-changed` / `tree-changed` イベント発火
- `write_log(entry)` — アプリログディレクトリにJSONL追記

## 実装しないもの（このリストにあるものは作らない）

- react-virtual（初期不要。大量カード時に後で検討）
- H3/長さベース動的分割
- sequenceDiagram / classDiagram / stateDiagram変換
- 読書フローガイド
- 密度ヒートマップ
- セピアテーマ
- AI連携・外部API接続
- 編集機能
- ノート管理・同期
- ファイル間リンク（v2スコープ外）
- 個人最適化（v2スコープ外）
- 深いネスト折りたたみ（3階層超）

## 参考

- Tauri: https://tauri.app
- remark: https://github.com/remarkjs/remark
- mermaid.js: https://mermaid.js.org
- Tauri FS Watch: https://tauri.app/plugin/fs/
