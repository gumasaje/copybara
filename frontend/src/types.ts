export type LoginResponse = {
  memberId: number;
  email: string;
  nickname: string;
  accessToken: string;
};

export type Category = {
  categoryId: number;
  name: string;
  snippetCount: number;
  createdAt: string;
  updatedAt: string;
};

export type CategorySummary = {
  categoryId: number;
  name: string;
};

export type Attachment = {
  attachmentId: number;
  originalName: string;
  storedName: string;
  contentType: string;
  fileSize: number;
  uploadedAt: string;
};

export type Memo = {
  memoId: number;
  snippetId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type SnippetSummary = {
  snippetId: number;
  title: string;
  language: string;
  description: string;
  category: CategorySummary | null;
  favorite: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

export type SnippetDetail = {
  snippetId: number;
  title: string;
  content: string;
  language: string;
  description: string;
  category: CategorySummary | null;
  favorite: boolean;
  tags: string[];
  attachments: Attachment[];
  createdAt: string;
  updatedAt: string;
};

export type SnippetAnalysis = {
  analysisId: number;
  snippetId: number;
  summary: string;
  keyPoints: string[];
  suggestedTags: string[];
  createdAt: string;
};

export type ErrorResponse = {
  code: string;
  message: string;
};
