import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { OverviewListView } from "./OverviewListView";
import type { SnippetSummary } from "../types";

const snippets: SnippetSummary[] = [
  {
    snippetId: 1,
    title: "Older pinned",
    language: "Java",
    category: { categoryId: 1, name: "Backend" },
    favorite: true,
    tags: [],
    createdAt: "2026-05-09T09:00:00.000Z",
    updatedAt: "2026-05-10T09:00:00.000Z",
    deletedAt: null
  },
  {
    snippetId: 2,
    title: "Recent regular",
    language: "TypeScript",
    category: null,
    favorite: false,
    tags: [],
    createdAt: "2026-05-09T09:00:00.000Z",
    updatedAt: "2026-05-11T09:00:00.000Z",
    deletedAt: null
  }
];

describe("OverviewListView", () => {
  it("shows pinned snippets before more recent unpinned snippets in all mode", () => {
    render(
      <OverviewListView
        mode="all"
        allSnippets={snippets}
        trashSnippets={[]}
        onSelectSnippet={vi.fn()}
        onRestoreSnippet={vi.fn()}
        onDeleteSnippet={vi.fn()}
      />
    );

    const titles = screen.getAllByRole("heading", { level: 3 }).map((node) => node.textContent);
    expect(titles).toEqual(["Older pinned", "Recent regular"]);
  });

  it("triggers restore without selecting the row in trash mode", () => {
    const onSelectSnippet = vi.fn();
    const onRestoreSnippet = vi.fn();

    render(
      <OverviewListView
        mode="trash"
        allSnippets={[]}
        trashSnippets={[{ ...snippets[1], deletedAt: "2026-05-12T09:00:00.000Z" }]}
        onSelectSnippet={onSelectSnippet}
        onRestoreSnippet={onRestoreSnippet}
        onDeleteSnippet={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Restore snippet" }));
    expect(onRestoreSnippet).toHaveBeenCalledWith(2);
    expect(onSelectSnippet).not.toHaveBeenCalled();
  });
});
