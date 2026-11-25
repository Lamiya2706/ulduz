import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./i18n";
import "./index.css";
import App from "./App";
import { captureInstallPrompt } from "./lib/install";

captureInstallPrompt();
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);

// Offline app shell + push notifications. Not in dev, where it would cache Vite's live modules.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { scope: import.meta.env.BASE_URL }).catch(() => {});
  });
}
