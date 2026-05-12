import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("@codemirror/lang-java")) {
            return "editor-lang-java";
          }
          if (id.includes("@codemirror/lang-javascript")) {
            return "editor-lang-javascript";
          }
          if (id.includes("@codemirror/lang-python")) {
            return "editor-lang-python";
          }
          if (id.includes("@codemirror/lang-sql")) {
            return "editor-lang-sql";
          }
          if (
            id.includes("@uiw/react-codemirror") ||
            id.includes("@codemirror") ||
            id.includes("@lezer")
          ) {
            return "editor-core";
          }
        }
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  }
});
