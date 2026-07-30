import { createRoot } from "react-dom/client";
import App from "@/app/App";
import ErrorBoundary from "@/app/ErrorBoundary";
import "./index.css";
import "./aayu.css";

import { HealthContextProvider } from "@/contexts/HealthContext";
import { ToastProvider } from "@/contexts/ToastContext";

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <ToastProvider>
      <HealthContextProvider>
        <App />
      </HealthContextProvider>
    </ToastProvider>
  </ErrorBoundary>
);
