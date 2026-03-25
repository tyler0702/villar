use notify::{Config, Event, RecommendedWatcher, RecursiveMode, Watcher};
use serde::{Deserialize, Serialize};
use std::fs::{self, OpenOptions};
use std::io::Write;
use std::path::Path;
use std::sync::Mutex;
use std::time::{Duration, Instant};
use tauri::{AppHandle, Emitter, Manager};

#[derive(Serialize)]
pub struct FileEntry {
    name: String,
    path: String,
}

#[derive(Serialize, Clone)]
struct FileChangedPayload {
    path: String,
}

struct WatcherState {
    _watcher: Option<RecommendedWatcher>,
}

#[tauri::command]
fn list_md_files(dir_path: String) -> Result<Vec<FileEntry>, String> {
    let path = Path::new(&dir_path);
    if !path.is_dir() {
        return Err("Not a directory".into());
    }

    let mut entries = Vec::new();
    collect_md_files(path, &mut entries).map_err(|e| e.to_string())?;
    entries.sort_by(|a, b| a.name.cmp(&b.name));
    Ok(entries)
}

fn collect_md_files(dir: &Path, entries: &mut Vec<FileEntry>) -> std::io::Result<()> {
    for entry in fs::read_dir(dir)? {
        let entry = entry?;
        let path = entry.path();
        if path.is_dir() {
            collect_md_files(&path, entries)?;
        } else if path.extension().is_some_and(|ext| ext == "md") {
            if let Some(name) = path.file_name() {
                entries.push(FileEntry {
                    name: name.to_string_lossy().into_owned(),
                    path: path.to_string_lossy().into_owned(),
                });
            }
        }
    }
    Ok(())
}

#[tauri::command]
fn read_file(file_path: String) -> Result<String, String> {
    fs::read_to_string(&file_path).map_err(|e| e.to_string())
}

#[tauri::command]
fn watch_folder(app_handle: AppHandle, dir_path: String) -> Result<(), String> {
    let state = app_handle.state::<Mutex<WatcherState>>();
    let handle = app_handle.clone();

    let debounce = Duration::from_millis(300);
    let last_emit = std::sync::Arc::new(Mutex::new(Instant::now() - debounce));

    let mut watcher = RecommendedWatcher::new(
        move |res: Result<Event, notify::Error>| {
            if let Ok(event) = res {
                // Only care about modify/create events
                if !event.kind.is_modify() && !event.kind.is_create() {
                    return;
                }

                for path in &event.paths {
                    if path.extension().is_some_and(|ext| ext == "md") {
                        let mut last = last_emit.lock().unwrap();
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
