import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, User, X } from "lucide-react";
import { pageData } from "./pageData";
import { useUserStore } from "../stores/useUserStore";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import LogoutModal from "./modals/LogoutModal";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const logout = useUserStore((state) => state.logout);
  const { theme } = useTheme();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userData = {
    userIcon: <User size={20} className="text-white" />,
    name: user?.first_name
      ? `${user.first_name} ${user.last_name || ""}`
      : "User",
    company: user?.company_name || "FirmaFlow",
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();
    navigate("/login");
  };

  const getInitials = (name) => {
    if (!name) return "";
    const parts = name.split(" ");
    const initials = parts[0].charAt(0) + (parts[1] ? parts[1].charAt(0) : "");
    return initials.toUpperCase();
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          width: isCollapsed ? "80px" : "260px",
        }}
        transition={{
          duration: 0.3,
          ease: "easeInOut",
        }}
        className={`fixed md:relative flex flex-col w-[260px] md:w-auto h-screen max-h-screen text-center ${
          theme.shadow
        } rounded-lg ${
          theme.bgCard
        } items-start p-2 z-50 transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
        style={{ overflow: "visible" }}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 ${theme.bgHover} rounded-lg transition md:hidden z-10`}
        >
          <X size={20} className={theme.textSecondary} />
        </button>

        <div className="flex justify-between items-center w-full mb-4 flex-shrink-0">
          <div
            className={`flex gap-2 items-center justify-start group px-2 py-2 rounded-2xl w-full md:w-auto ${
              !isCollapsed ? "md:w-full" : ""
            } ease-out-in hover:bg-gradient-to-br ${
              theme.mode === "light"
                ? "from-[#eceef8] to-[#f9f7fa]"
                : "from-slate-700 to-slate-600"
            }`}
          >
            <div
              className={`${theme.bgSecondary} rounded-lg p-1 flex-shrink-0`}
            >
              <img
                src="./firmaflow-logo.jpg"
                alt="logo"
                height={30}
                width={30}
              />
            </div>

            {/* Always show on mobile, conditional on desktop */}
            <div className="md:hidden relative flex flex-col justify-center items-start leading-none">
              <p className="m-0 text-xl font-bold bg-gradient-to-br from-[#667eea] to-[#764ba2] bg-clip-text text-transparent whitespace-nowrap">
                FirmaFlow
              </p>
              <p
                className={`m-0 ${theme.textTertiary} font-normal text-sm uppercase whitespace-nowrap`}
              >
                Ledger
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  key="logo-text"
                  initial={false}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="hidden md:flex relative flex-col justify-center items-start leading-none after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#667eea] after:transition-all after:duration-300 group-hover:after:w-full overflow-hidden"
                >
                  <p className="m-0 text-xl font-bold bg-gradient-to-br from-[#667eea] to-[#764ba2] bg-clip-text text-transparent whitespace-nowrap">
                    FirmaFlow
                  </p>
                  <p
                    className={`m-0 ${theme.textTertiary} font-normal text-sm uppercase whitespace-nowrap`}
                  >
                    Ledger
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={onToggleCollapse}
            className={`hidden md:flex p-1.5 rounded-lg ${
              theme.bgHover
            } hover:bg-gradient-to-br ${
              theme.mode === "light"
                ? "from-[#eceef8] to-[#f9f7fa]"
                : "from-slate-700 to-slate-600"
            } transition-all duration-200 flex-shrink-0`}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <motion.div
              animate={{ rotate: isCollapsed ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronLeft size={18} className={theme.textTertiary} />
            </motion.div>
          </button>
        </div>

        {/* Scrollable Content Area - includes navigation, theme, and user info */}
        <div className="flex-1 flex flex-col w-full overflow-y-auto overflow-x-hidden min-h-0">
          {/* Navigation Items */}
          <div className="flex flex-col w-full mb-2">
            {pageData.map((page, index) => {
              const isActive = location.pathname === page.path;
              const Icon = page.icon;
              return (
                <Link
                  to={page.path}
                  key={index}
                  onClick={(e) => {
                    // Don't auto-expand on mobile when clicking a link
                    if (window.innerWidth < 768) {
                      onClose();
                    }
                    // Prevent auto-expand when collapsed on desktop
                  }}
                  className={`group relative items-center justify-start md:justify-center ${
                    !isCollapsed ? "md:justify-start" : ""
                  } flex p-2 w-full rounded-md mb-1 flex-shrink-0 ${
                    isActive
                      ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white"
                      : `hover:bg-gradient-to-br ${
                          theme.mode === "light"
                            ? "from-[#f1f5f9] to-[#f9f7fa]"
                            : "from-slate-700 to-slate-600"
                        }`
                  }`}
                >
                  <div
                    className={`flex items-center justify-start md:justify-center ${
                      !isCollapsed ? "md:justify-start" : ""
                    } w-full gap-3`}
                  >
                    {Icon && (
                      <Icon
                        size={20}
                        className={`flex-shrink-0 ${
                          isActive ? "text-white" : theme.textPrimary
                        }`}
                      />
                    )}
                    {/* Always show on mobile */}
                    <p
                      className={`md:hidden m-0 text-normal font-md flex-1 whitespace-nowrap overflow-hidden ${
                        isActive
                          ? "text-white font-semibold"
                          : `${theme.textPrimary}`
                      }`}
                    >
                      {page.name}
                    </p>
                    {/* Animated on desktop */}
                    <AnimatePresence mode="wait">
                      {!isCollapsed && (
                        <motion.p
                          key={`menu-${page.path}`}
                          initial={false}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`hidden md:block m-0 text-normal font-md flex-1 whitespace-nowrap overflow-hidden ${
                            isActive
                              ? "text-white font-semibold"
                              : `${theme.textPrimary} hover:font-semibold`
                          }`}
                        >
                          {page.name}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Tooltip for collapsed state - positioned outside sidebar */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity duration-200 whitespace-nowrap z-[9999] shadow-lg">
                      {page.name}
                      <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-gray-900"></div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>

          {/* Theme Toggle Section */}
          <div
            className={`flex-shrink-0 w-full border-t ${theme.borderSecondary} py-3 mt-auto`}
          >
            <div
              className={`flex items-center justify-between md:justify-center ${
                !isCollapsed ? "md:justify-between" : ""
              } px-2 md:px-0 ${!isCollapsed ? "md:px-2" : ""}`}
            >
              {/* Always show on mobile */}
              <span
                className={`md:hidden text-sm font-medium ${theme.textPrimary} whitespace-nowrap`}
              >
                Theme
              </span>
              {/* Animated on desktop */}
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    key="theme-label"
                    initial={false}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`hidden md:block text-sm font-medium ${theme.textPrimary} whitespace-nowrap`}
                  >
                    Theme
                  </motion.span>
                )}
              </AnimatePresence>
              <div className="flex-shrink-0">
                <ThemeToggle />
              </div>
            </div>
          </div>

          {/* User info and logout section */}
          <div
            className={`flex-shrink-0 w-full border-t ${theme.borderSecondary}`}
          >
            {/* Always show full content on mobile */}
            <div className="md:hidden">
              <div className="flex w-full justify-start items-center gap-3 py-3 px-2">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                  {userData.image ? (
                    <img
                      src={userData.image}
                      alt="user"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(userData.name)
                  )}
                </div>

                <div className="overflow-hidden flex-1 min-w-0">
                  <p
                    className={`font-semibold ${theme.textPrimary} whitespace-nowrap text-sm overflow-hidden text-ellipsis`}
                  >
                    {userData.name}
                  </p>
                  <p
                    className={`font-normal ${theme.textTertiary} text-xs whitespace-nowrap overflow-hidden text-ellipsis`}
                  >
                    {userData.company}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowLogoutModal(true)}
                className={`w-full text-center group/logout py-3 px-4 rounded-lg font-medium mb-2 ${
                  theme.textPrimary
                } hover:bg-gradient-to-br ${
                  theme.mode === "light"
                    ? "from-red-50 to-red-100"
                    : "from-red-900 to-red-800"
                } hover:text-red-600 transition-all duration-200 border border-transparent hover:border-red-200`}
              >
                Logout
              </button>
            </div>
            {/* Conditional content on desktop */}
            <div className="hidden md:block">
              {!isCollapsed ? (
                <>
                  <div className="flex w-full justify-start items-center gap-3 py-3 px-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                      {userData.image ? (
                        <img
                          src={userData.image}
                          alt="user"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        getInitials(userData.name)
                      )}
                    </div>

                    <motion.div
                      key="user-info"
                      initial={false}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden flex-1 min-w-0"
                    >
                      <p
                        className={`font-semibold ${theme.textPrimary} whitespace-nowrap text-sm overflow-hidden text-ellipsis`}
                      >
                        {userData.name}
                      </p>
                      <p
                        className={`font-normal ${theme.textTertiary} text-xs whitespace-nowrap overflow-hidden text-ellipsis`}
                      >
                        {userData.company}
                      </p>
                    </motion.div>
                  </div>

                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className={`w-full text-center group/logout py-3 px-4 rounded-lg font-medium mb-2 ${
                      theme.textPrimary
                    } hover:bg-gradient-to-br ${
                      theme.mode === "light"
                        ? "from-red-50 to-red-100"
                        : "from-red-900 to-red-800"
                    } hover:text-red-600 transition-all duration-200 border border-transparent hover:border-red-200`}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center py-3 gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center text-lg font-bold overflow-hidden flex-shrink-0">
                    {userData.image ? (
                      <img
                        src={userData.image}
                        alt="user"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getInitials(userData.name)
                    )}
                  </div>
                  <button
                    onClick={() => setShowLogoutModal(true)}
                    className={`p-2 rounded-lg flex-shrink-0 ${
                      theme.textPrimary
                    } hover:bg-gradient-to-br ${
                      theme.mode === "light"
                        ? "from-red-50 to-red-100"
                        : "from-red-900 to-red-800"
                    } hover:text-red-600 transition-all duration-200`}
                    title="Logout"
                  >
                    <User size={20} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleLogout}
        isLoggingOut={isLoggingOut}
      />
    </>
  );
};

export default Sidebar;
