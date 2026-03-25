// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { invoke } from "@tauri-apps/api/core";
import { FileTree } from "../Sidebar/FileTree";
import { useAppStore, type FsNode } from "../../stores/useAppStore";

const mockInvoke = vi.mocked(invoke);

const fileNodes: FsNode[] = [
  { name: "readme.md", path: "/docs/readme.md", is_dir: false, children: [] },
  { name: "guide.md", path: "/docs/guide.md", is_dir: false, children: [] },
];

const treeWithFolder: FsNode[] = [
  {
    name: "docs",
    path: "/docs",
    is_dir: true,
    children: [
      { name: "intro.md", path: "/docs/intro.md", is_dir: false, children: [] },
    ],
  },
  { name: "notes.md", path: "/notes.md", is_dir: false, children: [] },
];

beforeEach(() => {
  mockInvoke.mockReset();
  useAppStore.setState({ tabs: [], activeTabIndex: 0 });
});

describe("FileTree", () => {
  it("renders file names without .md extension", () => {
    render(<FileTree nodes={fileNodes} selectedPath={null} />);

    expect(screen.getByText("readme")).toBeInTheDocument();
    expect(screen.getByText("guide")).toBeInTheDocument();
  });

  it("highlights the selected file", () => {
    render(<FileTree nodes={fileNodes} selectedPath="/docs/readme.md" />);

    const selected = screen.getByText("readme").closest("button")!;
    expect(selected.className).toContain("bg-accent-100");
  });

  it("opens file on click by invoking read_file and updating store", async () => {
    mockInvoke.mockResolvedValue("# Hello");

    render(<FileTree nodes={fileNodes} selectedPath={null} />);

    await userEvent.click(screen.getByText("readme"));

    expect(mockInvoke).toHaveBeenCalledWith("read_file", { filePath: "/docs/readme.md" });

    // Wait for store update
    await vi.waitFor(() => {
      const state = useAppStore.getState();
      expect(state.tabs).toHaveLength(1);
      expect(state.tabs[0].file.path).toBe("/docs/readme.md");
      expect(state.tabs[0].content).toBe("# Hello");
    });
  });

  it("renders folder with toggle", async () => {
    render(<FileTree nodes={treeWithFolder} selectedPath={null} depth={0} />);

    // Top-level folder starts expanded (depth=0)
    expect(screen.getByText("docs")).toBeInTheDocument();
    expect(screen.getByText("intro")).toBeInTheDocument();

    // Toggle folder closed
    await userEvent.click(screen.getByText("docs"));
    expect(screen.queryByText("intro")).not.toBeInTheDocument();

    // Toggle folder open again
    await userEvent.click(screen.getByText("docs"));
    expect(screen.getByText("intro")).toBeInTheDocument();
  });

  it("renders nested folder collapsed when depth > 0", () => {
    const nested: FsNode[] = [
      {
        name: "parent",
        path: "/parent",
        is_dir: true,
        children: [
          {
            name: "child",
            path: "/parent/child",
            is_dir: true,
            children: [
              { name: "deep.md", path: "/parent/child/deep.md", is_dir: false, children: [] },
            ],
          },
        ],
      },
    ];

    render(<FileTree nodes={nested} selectedPath={null} depth={0} />);

    // Parent expanded (depth 0), child collapsed (depth 1)
    expect(screen.getByText("parent")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
    expect(screen.queryByText("deep")).not.toBeInTheDocument();
  });
});
