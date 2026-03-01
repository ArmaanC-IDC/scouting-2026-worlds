// In index.js

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// --- THIS IS THE KEY CHANGE ---
// Only register service worker in production builds
if (process.env.NODE_ENV === "production") {
  serviceWorkerRegistration.register({
    onUpdate: (registration) => {
      // Ask the user to refresh to get the new version.
      const waitingServiceWorker = registration.waiting;

      if (waitingServiceWorker) {
        // We use a confirm dialog, but you can use a more elegant UI element like a Snackbar.
        const userConfirmation = window.confirm(
          "A new version of the app is available. Refresh to update?"
        );
        if (userConfirmation) {
          waitingServiceWorker.postMessage({ type: "SKIP_WAITING" });
          // The page doesn't automatically reload after skipWaiting().
          // We need to reload it manually.
          window.location.reload();
        }
      }
    },
  });
} else {
  serviceWorkerRegistration.unregister();
}


// The rest of your index.js file (reportWebVitals etc.) remains the same.