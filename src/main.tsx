import { createRoot } from "react-dom/client";
import App from "@/app/App";
import ErrorBoundary from "@/app/ErrorBoundary";
import "./index.css";
import "./aayu.css";
import "./aayu-home.css";
import "./aayu-pages.css";
import "./signup.css";

import { HealthContextProvider } from "@/contexts/HealthContext";
import { runHardeningMigration } from "@/services/migrationService";

// TEMPORARY: Run the database migration once.
// Remove this block after the migration completes successfully.
(async () => {
  try {
    console.log("====================================");
    console.log("Starting AAYU Hardening Migration...");
    console.log("====================================");

    await runHardeningMigration();

    console.log("====================================");
    console.log("Migration completed successfully!");
    console.log("====================================");
  } catch (error) {
    console.error("Migration failed:", error);
  }
})();

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <HealthContextProvider>
      <App />
    </HealthContextProvider>
  </ErrorBoundary>
);