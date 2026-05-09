import type {
  Category,
  ErrorResponse,
  LoginResponse,
  Memo,
  SnippetAnalysis,
  SnippetDetail,
  SnippetSummary
} from "./types";

const TOKEN_KEY = "copybara-access-token";

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token == null) {
    window.localStorage.removeItem(TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(TOKEN_KEY, token);
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  const token = getStoredToken();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...init, headers });

  if (!response.ok) {
    const error = (await response.json().catch(() => null)) as ErrorResponse | null;
    throw new Error(error?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
  },
  signup(email: string, password: string, nickname: string) {
    return request("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password, nickname })
    });
  },
  getMe() {
    return request<{ memberId: number; email: string; nickname: string }>("/api/auth/me");
  },
  getCategories() {
    return request<Category[]>("/api/categories");
  },
  createCategory(name: string) {
    return request<Category>("/api/categories", {
      method: "POST",
      body: JSON.stringify({ name })
    });
  },
  updateCategory(categoryId: number, name: string) {
    return request<Category>(`/api/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify({ name })
    });
  },
  deleteCategory(categoryId: number) {
    return request<void>(`/api/categories/${categoryId}`, { method: "DELETE" });
  },
  getSnippets(params: { keyword?: string; tag?: string; categoryId?: number | null }) {
    const search = new URLSearchParams();
    if (params.keyword?.trim()) search.set("keyword", params.keyword.trim());
    if (params.tag?.trim()) search.set("tag", params.tag.trim());
    if (params.categoryId != null) search.set("categoryId", String(params.categoryId));
    const suffix = search.toString() ? `?${search.toString()}` : "";
    return request<SnippetSummary[]>(`/api/snippets${suffix}`);
  },
  getSnippet(snippetId: number) {
    return request<SnippetDetail>(`/api/snippets/${snippetId}`);
  },
  createSnippet(payload: {
    title: string;
    content: string;
    language: string;
    description: string;
    categoryId: number | null;
    tags: string[];
  }) {
    return request<SnippetDetail>("/api/snippets", {
      method: "POST",
      body: JSON.stringify(payload)
    });
  },
  updateSnippet(
    snippetId: number,
    payload: {
      title: string;
      content: string;
      language: string;
      description: string;
      categoryId: number | null;
      tags: string[];
    }
  ) {
    return request<SnippetDetail>(`/api/snippets/${snippetId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  deleteSnippet(snippetId: number) {
    return request<void>(`/api/snippets/${snippetId}`, { method: "DELETE" });
  },
  updateFavorite(snippetId: number, favorite: boolean) {
    return request<SnippetDetail>(`/api/snippets/${snippetId}/favorite`, {
      method: "PUT",
      body: JSON.stringify({ favorite })
    });
  },
  getMemos(snippetId: number) {
    return request<Memo[]>(`/api/snippets/${snippetId}/memos`);
  },
  createMemo(snippetId: number, content: string) {
    return request<Memo>(`/api/snippets/${snippetId}/memos`, {
      method: "POST",
      body: JSON.stringify({ content })
    });
  },
  updateMemo(snippetId: number, memoId: number, content: string) {
    return request<Memo>(`/api/snippets/${snippetId}/memos/${memoId}`, {
      method: "PUT",
      body: JSON.stringify({ content })
    });
  },
  deleteMemo(snippetId: number, memoId: number) {
    return request<void>(`/api/snippets/${snippetId}/memos/${memoId}`, { method: "DELETE" });
  },
  getAnalysis(snippetId: number) {
    return request<SnippetAnalysis>(`/api/snippets/${snippetId}/analysis`);
  },
  createAnalysis(snippetId: number) {
    return request<SnippetAnalysis>(`/api/snippets/${snippetId}/analysis`, { method: "POST" });
  }
};
