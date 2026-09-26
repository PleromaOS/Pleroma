import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite is the tool that turns the React code into files a browser can run,
// and serves the app on your computer while you work on it (npm run dev).
//
// base: the app lives under pleromaos.nl/consult/, next to the marketing site,
// so every file it loads is looked up under /consult/.
export default defineConfig({
  base: "/consult/",
  plugins: [react()],
  server: { host: true }, // lets a phone on the same wifi open the dev app
});
