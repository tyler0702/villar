use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Serialize, Clone)]
pub struct FsNode {
    name: String,
    path: String,
    is_dir: bool,
    children: Vec<FsNode>,
}

#[derive(Serialize, Clone)]
struct FileChangedPayload {
    path: String,
}

struct WatcherState {
    _watcher: Option<RecommendedWatcher>,
}

#[tauri::command]
fn list_md_files(dir_path: String) -> Result<Vec<FsNode>, String> {
    let path = Path::new(&dir_path);
    if !path.is_dir() {
        return Err("Not a directory".into());
    }

    let mut nodes = collect_tree(path).map_err(|e| e.to_string())?;
    nodes.sort_by(|a, b| match (a.is_dir, b.is_dir) {
        (true, false) => std::cmp::Ordering::Less,
        (false, true) => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(nodes)
}

fn collect_tree(dir: &Path) -> std::io::Result<Vec<FsNode>> {
    let mut nodes = Vec::new();
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        let name = path.file_name().unwrap_or_default().to_string_lossy().into_owned();

        if name.starts_with('.') {
            continue;
        }

        if path.is_dir() {
            let mut children = collect_tree(&path)?;
            // Only include folders that contain at least one .md (recursively)
            if !children.is_empty() {
                children.sort_by(|a, b| match (a.is_dir, b.is_dir) {
                    (true, false) => std::cmp::Ordering::Less,
                    (false, true) => std::cmp::Ordering::Greater,
                    _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
                });
                nodes.push(FsNode {
                    name,
                    path: path.to_string_lossy().into_owned(),
                    is_dir: true,
                    children,
                });
            }
        } else if path.extension().is_some_and(|ext| ext == "md") {
            nodes.push(FsNode {
                name,
                path: path.to_string_lossy().into_owned(),
                is_dir: false,
                children: vec![],
            });
        }
    }
    Ok(nodes)
}

#[tauri::command]
fn read_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[derive(Serialize)]
struct FileMeta {
    modified: Option<String>,
    created: Option<String>,
}

#[tauri::command]
fn get_file_meta(file_path: String) -> Result<FileMeta, String> {
    let meta = fs::metadata(&file_path).map_err(|e| e.to_string())?;

    let format_time = |t: std::io::Result<std::time::SystemTime>| -> Option<String> {
        let t = t.ok()?;
        let d = t.duration_since(std::time::UNIX_EPOCH).ok()?;
        let secs = d.as_secs() as i64;
        // Simple UTC formatting: YYYY/MM/DD HH:mm
        let days = secs / 86400;
        let time_of_day = secs % 86400;
        let hours = time_of_day / 3600;
        let minutes = (time_of_day % 3600) / 60;

        // Days since epoch to date (simplified)
        let mut y = 1970i64;
        let mut remaining = days;
        loop {
            let days_in_year = if y % 4 == 0 && (y % 100 != 0 || y % 400 == 0) { 366 } else { 365 };
            if remaining < days_in_year { break; }
            remaining -= days_in_year;
            y += 1;
        }
        let leap = y % 4 == 0 && (y % 100 != 0 || y % 400 == 0);
        let month_days = [31, if leap { 29 } else { 28 }, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let mut m = 0usize;
        for &md in &month_days {
            if remaining < md { break; }
            remaining -= md;
            m += 1;
        }
        Some(format!("{:04}/{:02}/{:02} {:02}:{:02}", y, m + 1, remaining + 1, hours, minutes))
    };

    Ok(FileMeta {
        modified: format_time(meta.modified()),
        created: format_time(meta.created()),
    })
}

#[tauri::command]
fn watch_folder(app_handle: AppHandle, dir_path: String) -> Result<(), String> {
    let state = app_handle.state::<Mutex<WatcherState>>();
    let handle = app_handle.clone();
    let watched_dir = dir_path.clone();

    let debounce = Duration::from_millis(300);
    let last_file_emit = std::sync::Arc::new(Mutex::new(Instant::now() - debounce));
    let last_tree_emit = std::sync::Arc::new(Mutex::new(Instant::now() - debounce));

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                let is_modify = event.kind.is_modify();
                let is_create = event.kind.is_create();
                let is_remove = event.kind.is_remove();

                if !is_modify && !is_create && !is_remove {
                    return;
                }

                // Tree structure changed (file added/removed) — refresh sidebar
                if is_create || is_remove {
                    let mut last = last_tree_emit.lock().unwrap();
                    if last.elapsed() >= debounce {
                        *last = Instant::now();
                        let _ = handle.emit(
                            "tree-changed",
                            FileChangedPayload {
                                path: watched_dir.clone(),
                            },
                        );
                    }
                }

                // File content changed — refresh current document
                if is_modify || is_create {
                    for path in &event.paths {
                        if path.extension().is_some_and(|ext| ext == "md") {
                            let mut last = last_file_emit.lock().unwrap();
                            if last.elapsed() >= debounce {
                                *last = Instant::now();
                                let _ = handle.emit(
                                    "file-changed",
                                    FileChangedPayload {
                                        path: path.to_string_lossy().into_owned(),
                                    },
                                );
                            }
                        }
                    }
                }
            }
        },
        Config::default(),
    )
    .map_err(|e| e.to_string())?;

    watcher
        .watch(Path::new(&dir_path), RecursiveMode::Recursive)
        .map_err(|e| e.to_string())?;

    let mut state = state.lock().unwrap();
    state._watcher = Some(watcher);

    Ok(())
}

#[derive(Serialize)]
struct SearchHit {
    file_name: String,
    file_path: String,
    line_number: usize,
    line_text: String,
}

#[tauri::command]
fn search_files(dir_path: String, query: String) -> Result<Vec<SearchHit>, String> {
    if query.is_empty() {
        return Ok(vec![]);
    }

    let path = Path::new(&dir_path);
    if !path.is_dir() {
        return Err("Not a directory".into());
    }

    let query_lower = query.to_lowercase();
    let mut hits = Vec::new();
    search_recursive(path, &query_lower, &mut hits).map_err(|e| e.to_string())?;
    hits.truncate(100); // Cap results
    Ok(hits)
}

fn search_recursive(dir: &Path, query: &str, hits: &mut Vec<SearchHit>) -> std::io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();

        if path.file_name().is_some_and(|n| n.to_string_lossy().starts_with('.')) {
            continue;
        }

        if path.is_dir() {
            search_recursive(&path, query, hits)?;
        } else if path.extension().is_some_and(|ext| ext == "md") {
            if let Ok(content) = fs::read_to_string(&path) {
                for (i, line) in content.lines().enumerate() {
                    if line.to_lowercase().contains(query) {
                        hits.push(SearchHit {
                            file_name: path.file_name().unwrap_or_default().to_string_lossy().into_owned(),
                            file_path: path.to_string_lossy().into_owned(),
                            line_number: i + 1,
                            line_text: line.chars().take(120).collect(),
                        });
                        if hits.len() >= 100 {
                            return Ok(());
                        }
                    }
                }
            }
        }
    }
    Ok(())
}

#[derive(Deserialize)]
struct LogEntry {
    event: String,
    data: serde_json::Value,
}

#[tauri::command]
fn write_log(app_handle: AppHandle, entry: LogEntry) -> Result<(), String> {
    let log_dir = app_handle
        .path()
        .app_log_dir()
        .map_err(|e| e.to_string())?;
    fs::create_dir_all(&log_dir).map_err(|e| e.to_string())?;

    let log_file = log_dir.join("villar-metrics.jsonl");
    let timestamp = chrono_lite_timestamp();

    let line = serde_json::json!({
        "ts": timestamp,
        "event": entry.event,
        "data": entry.data,
    });

    let mut file = OpenOptions::new()
        .create(true)
        .append(true)
        .open(&log_file)
        .map_err(|e| e.to_string())?;

    writeln!(file, "{}", line).map_err(|e| e.to_string())?;
    Ok(())
}

fn chrono_lite_timestamp() -> String {
    use std::time::SystemTime;
    let duration = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default();
    format!("{}", duration.as_secs())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(Mutex::new(WatcherState { _watcher: None }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![list_md_files, read_file, get_file_meta, watch_folder, search_files, write_log])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
