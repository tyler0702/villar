import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";
import { Header } from "./components/Header/Header";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { CardView } from "./components/CardView/CardView";
import { useAppStore } from "./stores/useAppStore";
import { useMarkdown } from "./hooks/useMarkdown";
import { useTheme } from "./hooks/useTheme";

function App() {
  useTheme();
  const fileContent = useAppStore((s) => s.fileContent);
  const selectedFile = useAppStore((s) => s.selectedFile);
  const setFileContent = useAppStore((s) => s.setFileContent);
  const sections = useMarkdown(fileContent);

  // Listen for file changes from Rust watcher
  useEffect(() => {
    const unlisten = listen<{ path: string }>("file-changed", async (event) => {
      if (selectedFile && event.payload.path === selectedFile.path) {
        const content = await invoke<string>("read_file", { filePath: selectedFile.path });
        setFileContent(content);
      }
    });

    return () => {
      unlisten.then((fn) => fn());
    };
  }, [selectedFile, setFileContent]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar sections={sections} />
        <main className="flex-1 overflow-hidden">
          {sections.length > 0 ? (
            <CardView sections={sections} />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              Select a file to view
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
