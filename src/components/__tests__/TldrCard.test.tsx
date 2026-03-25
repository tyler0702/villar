// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TldrCard } from "../CardView/TldrCard";
import { useAppStore } from "../../stores/useAppStore";
import type { TldrData } from "../../plugins/remark-tldr";

const baseTldr: TldrData = {
  summary: "This is a test summary.",
  points: ["Point one", "Point two"],
  keywords: ["react", "testing"],
  conclusion: "Final conclusion here.",
};

beforeEach(() => {
  useAppStore.setState({
    settings: { ...useAppStore.getState().settings, tldrExpanded: true, vscodeTheme: null },
  });
});

describe("TldrCard", () => {
  it("renders summary, points, keywords, and conclusion when expanded", () => {
    render(<TldrCard tldr={baseTldr} />);

    expect(screen.getByText("This is a test summary.")).toBeInTheDocument();
    expect(screen.getByText("Point one")).toBeInTheDocument();
    expect(screen.getByText("Point two")).toBeInTheDocument();
    expect(screen.getByText("react")).toBeInTheDocument();
    expect(screen.getByText("testing")).toBeInTheDocument();
    expect(screen.getByText("Final conclusion here.")).toBeInTheDocument();
  });

  it("hides content when collapsed by default", () => {
    useAppStore.setState({
      settings: { ...useAppStore.getState().settings, tldrExpanded: false },
    });

    render(<TldrCard tldr={baseTldr} />);

    expect(screen.getByText("TL;DR")).toBeInTheDocument();
    expect(screen.queryByText("This is a test summary.")).not.toBeInTheDocument();
  });

  it("toggles expansion on button click", async () => {
    useAppStore.setState({
      settings: { ...useAppStore.getState().settings, tldrExpanded: false },
    });

    render(<TldrCard tldr={baseTldr} />);
    expect(screen.queryByText("This is a test summary.")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button"));
    expect(screen.getByText("This is a test summary.")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("This is a test summary.")).not.toBeInTheDocument();
  });

  it("renders without optional fields", () => {
    const minimal: TldrData = {
      summary: null,
      points: [],
      keywords: [],
      conclusion: null,
    };

    render(<TldrCard tldr={minimal} />);
    expect(screen.getByText("TL;DR")).toBeInTheDocument();
  });

  it("renders only points when no summary/conclusion/keywords", () => {
    const pointsOnly: TldrData = {
      summary: null,
      points: ["Only point"],
      keywords: [],
      conclusion: null,
    };

    render(<TldrCard tldr={pointsOnly} />);
    expect(screen.getByText("Only point")).toBeInTheDocument();
  });
});
