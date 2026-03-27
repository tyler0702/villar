// Injected via page.addInitScript — runs before the app loads.
// Mocks window.__TAURI_INTERNALS__ so Tauri API calls don't throw.

(() => {
  const callbacks = new Map();

  function registerCallback(callback, once = false) {
    const id = crypto.getRandomValues(new Uint32Array(1))[0];
    callbacks.set(id, (data) => {
      if (once) callbacks.delete(id);
      return callback && callback(data);
    });
    return id;
  }

  function unregisterCallback(id) {
    callbacks.delete(id);
  }

  function runCallback(id, data) {
    const cb = callbacks.get(id);
    if (cb) cb(data);
  }

  // Event listeners for plugin:event|listen / emit
  const listeners = new Map();

  async function invoke(cmd, args) {
    // Handle event plugin internally
    if (cmd === "plugin:event|listen") {
      if (!listeners.has(args.event)) listeners.set(args.event, []);
      listeners.get(args.event).push(args.handler);
      return args.handler;
    }
    if (cmd === "plugin:event|emit") {
      for (const handler of listeners.get(args.event) || []) {
        runCallback(handler, args);
      }
      return null;
    }
    if (cmd === "plugin:event|unlisten") {
      const arr = listeners.get(args.event);
      if (arr) {
        const idx = arr.indexOf(args.id);
        if (idx !== -1) arr.splice(idx, 1);
      }
      return null;
    }

    // Check for user-defined overrides (set via __TAURI_MOCK_DATA__)
    const mockData = window.__TAURI_MOCK_DATA__ || {};

    switch (cmd) {
      case "list_md_files":
        return mockData.files || [];
      case "read_file":
        return (mockData.fileContents || {})[args?.filePath] || "";
      case "watch_folder":
        return null;
      case "search_files":
        return mockData.searchResults || [];
      case "update_menu":
        return null;
      case "write_log":
        return null;
      default:
        console.warn(`[tauri-mock] unhandled invoke: ${cmd}`, args);
        return null;
    }
  }

  window.__TAURI_INTERNALS__ = {
    invoke,
    transformCallback: registerCallback,
    unregisterCallback,
    runCallback,
    callbacks,
    convertFileSrc(filePath, protocol = "asset") {
      return `${protocol}://localhost/${encodeURIComponent(filePath)}`;
    },
    metadata: {
      currentWindow: { label: "main" },
      currentWebview: { windowLabel: "main", label: "main" },
    },
  };

  window.__TAURI_EVENT_PLUGIN_INTERNALS__ = {
    unregisterListener(event, id) {
      unregisterCallback(id);
    },
  };
})();
