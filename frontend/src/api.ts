import type {
  Category,
  ErrorResponse,
  LoginResponse,
  SnippetAnalysis,
  SnippetDetail,
  SnippetSummary
} from "./types";

const TOKEN_KEY = "copybara-access-token";
const SESSION_EXPIRED_EVENT = "copybara:session-expired";

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
  if (init?.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(path, { ...init, headers });

  if (!response.ok) {
    if (response.status === 401 && !isPublicAuthPath(path)) {
      setStoredToken(null);
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT));
      throw new Error("세션이 만료되었습니다. 다시 로그인해 주세요.");
    }

    const error = (await response.json().catch(() => null)) as ErrorResponse | null;
    throw new Error(error?.message ?? "요청 처리 중 오류가 발생했습니다.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function isPublicAuthPath(path: string) {
  return path === "/api/auth/login" || path === "/api/auth/signup";
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
  reorderCategories(orderedCategoryIds: number[]) {
    return request<void>("/api/categories/order", {
      method: "PATCH",
      body: JSON.stringify({ orderedCategoryIds })
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
  getTrashSnippets() {
    return request<SnippetSummary[]>("/api/snippets/trash");
  },
  getTrashSnippet(snippetId: number) {
    return request<SnippetDetail>(`/api/snippets/trash/${snippetId}`);
  },
  createSnippet(payload: {
    title: string;
    content: string;
    language: string;
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
      categoryId: number | null;
      tags: string[];
    }
  ) {
    return request<SnippetDetail>(`/api/snippets/${snippetId}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    });
  },
  moveSnippetCategory(snippetId: number, categoryId: number | null) {
    return request<SnippetDetail>(`/api/snippets/${snippetId}/category`, {
      method: "PATCH",
      body: JSON.stringify({ categoryId })
    });
  },
  deleteSnippet(snippetId: number) {
    return request<void>(`/api/snippets/${snippetId}`, { method: "DELETE" });
  },
  restoreSnippet(snippetId: number) {
    return request<SnippetDetail>(`/api/snippets/${snippetId}/restore`, { method: "PATCH" });
  },
  deleteSnippetPermanently(snippetId: number) {
    return request<void>(`/api/snippets/${snippetId}/permanent`, { method: "DELETE" });
  },
  updateFavorite(snippetId: number, favorite: boolean) {
    return request<SnippetDetail>(`/api/snippets/${snippetId}/favorite`, {
      method: "PUT",
      body: JSON.stringify({ favorite })
    });
  },
  updateNotes(snippetId: number, content: string) {
    return request<{ snippetId: number; notes: string | null; updatedAt: string }>(`/api/snippets/${snippetId}/notes`, {
      method: "PUT",
      body: JSON.stringify({ content })
    });
  },
  getAnalysis(snippetId: number) {
    return request<SnippetAnalysis>(`/api/snippets/${snippetId}/analysis`);
  },
  createAnalysis(snippetId: number) {
    return request<SnippetAnalysis>(`/api/snippets/${snippetId}/analysis`, { method: "POST" });
  }
};
