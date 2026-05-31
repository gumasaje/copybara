export type LoginResponse = {
  memberId: number;
  email: string;
  nickname: string;
  accessToken: string;
};

export type User = {
  memberId: number;
  email: string;
  nickname: string;
};

export type SnippetFormState = {
  title: string;
  content: string;
  language: string;
  categoryId: number | null;
  tagsText: string;
};

export type Category = {
  categoryId: number;
  name: string;
  sortOrder: number;
  snippetCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CategorySummary = {
  categoryId: number;
  name: string;
};

export type SnippetSummary = {
  snippetId: number;
  title: string;
  language: string;
  category: CategorySummary | null;
  favorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SnippetDetail = {
  snippetId: number;
  title: string;
  content: string;
  language: string;
  notes: string | null;
  category: CategorySummary | null;
  favorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type SnippetAnalysis = {
  analysisId: number;
  snippetId: number;
  summary: string;
  keyPoints: string[];
  suggestedTags: string[];
  provider: string;
  model: string;
  promptVersion: string;
  analyzedAt: string;
  createdAt: string;
};

export type ErrorResponse = {
  code: string;
  message: string;
};

export type SearchOverviewState = {
  title: string;
  caption: string;
  scope: string;
  snippets: SnippetSummary[];
};
