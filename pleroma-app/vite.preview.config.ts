import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// Builds ONE self-contained file of the app in demo-only mode, for sharing a
// clickable preview (it never talks to the backend). Not the real app.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  define: { "import.meta.env.VITE_PREVIEW_BUILD": JSON.stringify("1") },
  build: { outDir: "dist-preview" },
});
