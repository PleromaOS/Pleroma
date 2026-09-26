import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite is the tool that turns the React code into files a browser can run,
// and serves the app on your computer while you work on it (npm run dev).
export default defineConfig({
  plugins: [react()],
  server: { host: true }, // lets a phone on the same wifi open the dev app
});
