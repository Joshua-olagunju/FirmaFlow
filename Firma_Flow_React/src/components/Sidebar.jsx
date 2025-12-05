import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, User, X } from "lucide-react";
import { pageData } from "./pageData";
import { useUserStore } from "../stores/useUserStore";
import { useTheme } from "../contexts/ThemeContext";
import ThemeToggle from "./ThemeToggle";
import LogoutModal from "./modals/LogoutModal";
import { useState } from "react";

const Sidebar = ({ isOpen, onClose }) => {
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
      <div
        className={`fixed md:relative flex flex-col w-[260px] h-screen max-h-screen text-center ${
          theme.shadow
        } rounded-lg ${
          theme.bgCard
        } items-start p-2 z-50 transition-transform duration-300 ease-in-out overflow-hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
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
            className={`flex gap-2 items-center justify-start group px-2 py-2 rounded-2xl w-full ease-out-in hover:bg-gradient-to-br ${
              theme.mode === "light"
                ? "from-[#eceef8] to-[#f9f7fa]"
                : "from-slate-700 to-slate-600"
            }`}
          >
            <div className={`${theme.bgSecondary} rounded-lg p-1`}>
              <img
                src="./firmaflow-logo.jpg"
                alt="logo"
                height={30}
                width={30}
              />
            </div>

            <div className="relative flex flex-col justify-center items-start leading-none after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-[#667eea] after:transition-all after:duration-300 group-hover:after:w-full">
              <p className="m-0 text-xl font-bold bg-gradient-to-br from-[#667eea] to-[#764ba2] bg-clip-text text-transparent">
                FirmaFlow
              </p>
              <p
                className={`m-0 ${theme.textTertiary} font-normal text-sm uppercase`}
              >
                Ledger
              </p>
            </div>
          </div>

          <ChevronLeft size={18} className={theme.textTertiary} />
        </div>
        <div className="flex-1 flex flex-col w-full overflow-y-auto min-h-0">
          {pageData.map((page, index) => {
            const isActive = location.pathname === page.path;
            return (
              <Link
                to={page.path}
                key={index}
                className={`group relative items-center justify-center flex p-2 w-full rounded-md ${
                  isActive
                    ? "bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white"
                    : `hover:bg-gradient-to-br ${
                        theme.mode === "light"
                          ? "from-[#f1f5f9] to-[#f9f7fa]"
                          : "from-slate-700 to-slate-600"
                      }`
                }`}
              >
                <div className="flex items-center justify-center w-full">
                  <p
                    className={`m-0 text-left ml-12 text-normal font-md flex-1 ${
                      isActive
                        ? "text-white font-semibold"
                        : `${theme.textPrimary} hover:font-semibold`
                    }`}
                  >
                    {page.name}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Theme Toggle Section */}
        <div
          className={`flex-shrink-0 w-full border-t ${theme.borderSecondary} py-3`}
        >
          <div className="flex items-center justify-between px-2">
            <span className={`text-sm font-medium ${theme.textPrimary}`}>
              Theme
            </span>
            <ThemeToggle />
          </div>
        </div>

        {/* User info and logout section */}
        <div
          className={`flex-shrink-0 w-full border-t ${theme.borderSecondary}`}
        >
          <div className="flex w-full justify-start items-center gap-3 py-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white flex items-center justify-center text-lg font-bold overflow-hidden">
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

            <div>
              <p className={`font-semibold ${theme.textPrimary}`}>
                {userData.name}
              </p>
              <p className={`font-normal ${theme.textTertiary}`}>
                {userData.company}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowLogoutModal(true)}
            className={`w-full text-center group/logout py-3 px-4 rounded-lg font-medium ${
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
      </div>

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
