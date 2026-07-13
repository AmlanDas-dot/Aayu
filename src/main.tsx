import { createRoot } from "react-dom/client";
import App from "@/app/App";
import ErrorBoundary from "@/app/ErrorBoundary";
import "./index.css";
import "./aayu.css";
import "./aayu-home.css";
import "./aayu-pages.css";

import { HealthContextProvider } from "@/contexts/HealthContext";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <HealthContextProvider>
      <App />
    </HealthContextProvider>
  </ErrorBoundary>
);
