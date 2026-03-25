// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TabBar } from "../TabBar/TabBar";
import { useAppStore, type Tab } from "../../stores/useAppStore";

function makeTab(name: string, path: string): Tab {
  return {
    file: { name, path },
    content: "# " + name,
    previousContent: null,
    changedSections: [],
    activeCardIndex: 0,
    scrollTop: 0,
  };
}

beforeEach(() => {
  useAppStore.setState({ tabs: [], activeTabIndex: 0 });
});

describe("TabBar", () => {
  it("renders nothing when there is only one tab", () => {
    useAppStore.setState({ tabs: [makeTab("only.md", "/only.md")], activeTabIndex: 0 });

    const { container } = render(<TabBar />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing when there are no tabs", () => {
    const { container } = render(<TabBar />);
    expect(container.innerHTML).toBe("");
  });

  it("renders tab names without .md extension", () => {
    useAppStore.setState({
      tabs: [makeTab("first.md", "/first.md"), makeTab("second.md", "/second.md")],
      activeTabIndex: 0,
    });

    render(<TabBar />);

    expect(screen.getByText("first")).toBeInTheDocument();
    expect(screen.getByText("second")).toBeInTheDocument();
  });

  it("switches active tab on click", async () => {
    useAppStore.setState({
      tabs: [makeTab("a.md", "/a.md"), makeTab("b.md", "/b.md")],
      activeTabIndex: 0,
    });

    render(<TabBar />);

    await userEvent.click(screen.getByText("b"));
    expect(useAppStore.getState().activeTabIndex).toBe(1);
  });

  it("closes a tab on close button click", async () => {
    useAppStore.setState({
      tabs: [makeTab("a.md", "/a.md"), makeTab("b.md", "/b.md"), makeTab("c.md", "/c.md")],
      activeTabIndex: 0,
    });

    render(<TabBar />);

    // Close the second tab - find the close button (×) within the "b" tab
    const bTab = screen.getByText("b").closest("div")!;
    const closeBtn = bTab.querySelector("button")!;
    await userEvent.click(closeBtn);

    const state = useAppStore.getState();
    expect(state.tabs).toHaveLength(2);
    expect(state.tabs.map((t) => t.file.name)).toEqual(["a.md", "c.md"]);
  });

  it("adjusts activeTabIndex when closing a tab before active", async () => {
    useAppStore.setState({
      tabs: [makeTab("a.md", "/a.md"), makeTab("b.md", "/b.md"), makeTab("c.md", "/c.md")],
      activeTabIndex: 2,
    });

    render(<TabBar />);

    // Close first tab
    const aTab = screen.getByText("a").closest("div")!;
    await userEvent.click(aTab.querySelector("button")!);

    expect(useAppStore.getState().activeTabIndex).toBe(1);
  });
});
