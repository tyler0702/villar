// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Outline } from "../Sidebar/Outline";
import type { ProcessedSection } from "../../hooks/useMarkdown";

function makeSection(title: string, subHeadings: { depth: number; title: string }[] = []): ProcessedSection {
  return { title, html: "", tldr: null, mermaidCodes: [], subHeadings, collapsed: [] };
}

describe("Outline", () => {
  it("renders nothing when sections are empty", () => {
    const { container } = render(<Outline docTitle={null} sections={[]} activeIndex={0} onSelect={() => {}} />);
    expect(container.innerHTML).toBe("");
  });

  it("renders section titles as buttons", () => {
    const sections = [makeSection("Introduction"), makeSection("Details"), makeSection("Conclusion")];

    render(<Outline docTitle={null} sections={sections} activeIndex={0} onSelect={() => {}} />);

    expect(screen.getByText("Introduction")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
    expect(screen.getByText("Conclusion")).toBeInTheDocument();
  });

  it("calls onSelect with correct index when clicked", async () => {
    const sections = [makeSection("First"), makeSection("Second")];
    const onSelect = vi.fn();

    render(<Outline docTitle={null} sections={sections} activeIndex={0} onSelect={onSelect} />);

    await userEvent.click(screen.getByText("Second"));
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it("shows subHeadings for the active section only", () => {
    const sections = [
      makeSection("Active", [{ depth: 3, title: "Sub A" }, { depth: 3, title: "Sub B" }]),
      makeSection("Inactive", [{ depth: 3, title: "Sub C" }]),
    ];

    render(<Outline docTitle={null} sections={sections} activeIndex={0} onSelect={() => {}} />);

    expect(screen.getByText("Sub A")).toBeInTheDocument();
    expect(screen.getByText("Sub B")).toBeInTheDocument();
    expect(screen.queryByText("Sub C")).not.toBeInTheDocument();
  });

  it("does not show subHeadings when active section has none", () => {
    const sections = [makeSection("No Subs"), makeSection("Has Subs", [{ depth: 3, title: "Sub X" }])];

    render(<Outline docTitle={null} sections={sections} activeIndex={0} onSelect={() => {}} />);

    expect(screen.queryByText("Sub X")).not.toBeInTheDocument();
  });
});
