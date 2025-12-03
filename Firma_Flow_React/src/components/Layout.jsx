import { useState } from "react";
import Sidebar from "./Sidebar";
import { useTheme } from "../contexts/ThemeContext";

const Layout = ({ children, onMenuClick }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { theme } = useTheme();

  // Expose function to parent components
  if (onMenuClick) {
    onMenuClick(() => setIsSidebarOpen(true));
  }

  return (
    <div className={`flex w-full h-screen ${theme.bgPrimary} overflow-hidden`}>
      {/* Sidebar - Fixed, No Scroll */}
      <div className="h-screen">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex flex-1 flex-col gap-8 overflow-y-auto mt-0 md:p-2 p-5">
        <div className="flex-1 md:ml-8">{children}</div>
        <div
          className={`flex md:ml-6 ${theme.shadowSm} ${theme.bgAccent} border-t-2 border-[#764ba2] md:mr-6`}
        >
          <div className="w-full flex flex-col gap-5 items-center">
            <div className="w-full md:flex justify-between items-center mt-3 align-top px-3">
              <div
                className={`flex items-center justify-start gap-5 ${theme.bgHover} hover:rounded-lg px-2 py-2 transition-shadow ease-in-out duration-300`}
              >
                <img
                  src="./firmaflow-logo.jpg"
                  alt="logo"
                  width={30}
                  height={30}
                  className="rounded-lg"
                />
                <div className="flex flex-col gap-0">
                  <p className="m-0 text-xl font-bold bg-gradient-to-br from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                    FirmaFlow Ledger
                  </p>
                  <p
                    className={`m-0 text-sm font-normal uppercase ${theme.textTertiary}`}
                  >
                    Business Management Excellence
                  </p>
                </div>
              </div>
              <p className={`m-0 text-sm ${theme.textSecondary}`}>
                © 2025 FirmaFlow Ledger. All rights reserved.
              </p>
            </div>
            <div
              className={`flex items-center justify-center w-full border-t-2 ${theme.borderPrimary} mt-3 py-2 gap-6 ${theme.textSecondary}`}
            >
              <p>Secure</p>
              <p>• Real-time </p>
              <p>• Friendly</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;
