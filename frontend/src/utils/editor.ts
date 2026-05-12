import type { Extension } from "@codemirror/state";

export const LANGUAGE_OPTIONS = ["Java", "JavaScript", "TypeScript", "Python", "SQL", "Text"];

export async function loadExtensions(language: string): Promise<Extension[]> {
  switch (language.toLowerCase()) {
    case "java":
      return import("@codemirror/lang-java").then(({ java }) => [java()]);
    case "javascript":
      return import("@codemirror/lang-javascript").then(({ javascript }) => [javascript()]);
    case "typescript":
      return import("@codemirror/lang-javascript").then(({ javascript }) => [javascript({ typescript: true })]);
    case "python":
      return import("@codemirror/lang-python").then(({ python }) => [python()]);
    case "sql":
      return import("@codemirror/lang-sql").then(({ sql }) => [sql()]);
    default:
      return [];
  }
}
