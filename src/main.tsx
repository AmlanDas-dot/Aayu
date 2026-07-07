import { createRoot } from "react-dom/client";
import App from "@/app/App";
import ErrorBoundary from "@/app/ErrorBoundary";
import "./index.css";
import "./aayu.css";
import "./aayu-home.css";
import "./aayu-pages.css";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
