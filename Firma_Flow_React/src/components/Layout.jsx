import { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import FloatingAIBubble from "./AIAssistant/FloatingAIBubble";
import AnnouncementBanner from "./AnnouncementBanner";
import AIAssistantChat from "./AIAssistant/AIAssistantChat";

const Layout = ({ children, onMenuClick }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Get initial state from localStorage
    const saved = localStorage.getItem("sidebar-collapsed");
    return saved === "true";
  });
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const { theme } = useTheme();

  // Persist collapse state to localStorage
  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", isCollapsed.toString());
  }, [isCollapsed]);

  // Expose function to parent components
  if (onMenuClick) {
    onMenuClick(() => setIsSidebarOpen(true));
  }

  return (
    <div className={`flex w-full h-screen ${theme.bgPrimary} overflow-hidden`}>
      <AnnouncementBanner />
      {/* Sidebar - Fixed, No Scroll */}
      <div className="h-screen">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* AI Assistant Bubble */}
      <FloatingAIBubble onOpenChat={() => setIsAIChatOpen(true)} />

      {/* AI Assistant Chat */}
      <AIAssistantChat
        isOpen={isAIChatOpen}
        onClose={() => setIsAIChatOpen(false)}
      />

      {/* Main Content - Scrollable - Expands when sidebar collapses */}
      <motion.div
        animate={{
          marginLeft: isCollapsed ? "0px" : "0px",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className="flex flex-1 flex-col gap-8 overflow-y-auto mt-0 md:p-2 p-5"
      >
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
              <div className="flex flex-col gap-2">
                <p className={`m-0 text-sm ${theme.textSecondary}`}>
                  © 2026 FirmaFlow Ledger. All rights reserved.
                </p>
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${theme.textSecondary}`}>Powered by</span>
                  <a 
                    href="https://sodatim.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent hover:from-purple-300 hover:to-blue-300 transition-all duration-300"
                    style={{
                      textShadow: '0 0 15px rgba(167, 139, 250, 0.4)',
                      filter: 'drop-shadow(0 0 6px rgba(167, 139, 250, 0.5))'
                    }}
                  >
                    SODATIM TECHNOLOGIES
                  </a>
                </div>
              </div>
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
      </motion.div>
    </div>
  );
};

export default Layout;
