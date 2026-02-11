import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import { UserProvider } from "./contexts/UserContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { SettingsProvider } from "./contexts/SettingsContext.jsx";
import { SubscriptionProvider } from "./contexts/SubscriptionContext.jsx";
import { SuperAdminProvider } from "./contexts/SuperAdminContext.jsx";
import { StaffProvider } from "./contexts/StaffContext.jsx";

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <BrowserRouter>
        <SuperAdminProvider>
          <StaffProvider>
            <UserProvider>
              <SubscriptionProvider>
                <ThemeProvider>
                  <SettingsProvider>
                    <App />
                  </SettingsProvider>
                </ThemeProvider>
              </SubscriptionProvider>
            </UserProvider>
          </StaffProvider>
        </SuperAdminProvider>
      </BrowserRouter>
    </StrictMode>
  );
}
