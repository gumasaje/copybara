import { java } from "@codemirror/lang-java";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { sql } from "@codemirror/lang-sql";

export const LANGUAGE_OPTIONS = ["Java", "JavaScript", "TypeScript", "Python", "SQL", "Text"];

export function getExtensions(language: string) {
  switch (language.toLowerCase()) {
    case "java":
      return [java()];
    case "javascript":
    case "typescript":
      return [javascript({ typescript: language.toLowerCase() === "typescript" })];
    case "python":
      return [python()];
    case "sql":
      return [sql()];
    default:
      return [];
  }
}
