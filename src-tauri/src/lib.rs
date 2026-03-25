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
        .invoke_handler(tauri::generate_handler![list_md_files, read_file, watch_folder, write_log])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
