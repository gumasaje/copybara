import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SnippetDetailView } from "./SnippetDetailView";
import type { SnippetDetail } from "../types";

vi.mock("@uiw/react-codemirror", () => ({
  default: ({ value }: { value: string }) => <pre data-testid="code-viewer">{value}</pre>
}));

vi.mock("../utils/editor", () => ({
  loadExtensions: vi.fn().mockResolvedValue([])
}));

const activeSnippet: SnippetDetail = {
  snippetId: 1,
  title: "JWT filter",
  content: "class JwtFilter {}",
  language: "Java",
  notes: null,
  category: { categoryId: 10, name: "Backend" },
  favorite: false,
  tags: ["Spring"],
  createdAt: "2026-05-10T09:00:00.000Z",
  updatedAt: "2026-05-10T09:00:00.000Z",
  deletedAt: null
};

function renderDetail(overrides: Partial<SnippetDetail> = {}) {
  const props = {
    snippetDetail: { ...activeSnippet, ...overrides },
    snippetAnalysis: null,
    copyStatus: "idle" as const,
    notesDraft: overrides.notes ?? "",
    notesStatus: null,
    isSavingNotes: false,
    isAnalyzing: false,
    onToggleFavorite: vi.fn(),
    onEditSnippet: vi.fn(),
    onDeleteSnippet: vi.fn(),
    onRestoreSnippet: vi.fn(),
    onCopySnippet: vi.fn(),
    onAnalyze: vi.fn(),
    onNotesDraftChange: vi.fn(),
    onSaveNotes: vi.fn()
  };

  render(<SnippetDetailView {...props} />);
  return props;
}

function notesSection() {
  const heading = screen.getByRole("heading", { name: "Notes" });
  const section = heading.closest("section");
  if (section == null) {
    throw new Error("Notes section not found");
  }
  return within(section);
}

describe("SnippetDetailView notes", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows a compact add state before editing empty notes", () => {
    renderDetail();

    const notes = notesSection();
    expect(notes.getByText("No note yet.")).toBeInTheDocument();
    expect(notes.queryByRole("textbox")).not.toBeInTheDocument();

    fireEvent.click(notes.getByRole("button", { name: "Add note" }));

    expect(notes.getByRole("textbox")).toBeInTheDocument();
  });

  it("renders saved notes as markdown and opens links in a new tab", () => {
    renderDetail({ notes: "See https://example.com\n\n- official docs" });

    const notes = notesSection();
    const link = notes.getByRole("link", { name: "https://example.com" });

    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noreferrer");
    expect(notes.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("keeps deleted snippets in read-only notes state", () => {
    renderDetail({ deletedAt: "2026-05-12T09:00:00.000Z", notes: null });

    const notes = notesSection();

    expect(notes.getByText("Restore this snippet to edit notes.")).toBeInTheDocument();
    expect(notes.queryByRole("button", { name: "Add note" })).not.toBeInTheDocument();
    expect(notes.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
