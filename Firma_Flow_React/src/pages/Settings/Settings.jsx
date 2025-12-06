import { useState, useRef } from "react";
import Layout from "../../components/Layout";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  Settings as SettingsIcon,
  Building2,
  DollarSign,
  Tag,
  Receipt,
  Package,
  Monitor,
  Lock,
  FileText,
  File,
  Database,
  Users,
  ArrowLeft,
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import GeneralSettings from "./GeneralSettings";
import CompanyInfo from "./CompanyInfo";
import AccountingSettings from "./AccountingSettings";
import TagsManagement from "./TagsManagement/TagsManagement";
import TaxSettings from "./TaxSettings/TaxSettings";
import InventorySettings from "./InventorySettings";
import SecuritySettings from "./SecuritySettings";
import InvoiceTemplates from "./InvoiceTemplates/InvoiceTemplates";
import ReceiptTemplates from "./ReceiptTemplates/ReceiptTemplates";

const Settings = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("general");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const openSidebarRef = useRef(null);

  const settingsSections = [
    { id: "general", label: "General Settings", icon: SettingsIcon },
    { id: "company", label: "Company Info", icon: Building2 },
    { id: "accounting", label: "Accounting Settings", icon: DollarSign },
    { id: "tags", label: "Tags Management", icon: Tag },
    { id: "tax", label: "Tax Settings", icon: Receipt },
    { id: "inventory", label: "Inventory Settings", icon: Package },

    { id: "security", label: "Security Settings", icon: Lock },
    { id: "invoice-templates", label: "Invoice Templates", icon: FileText },
    { id: "receipt-templates", label: "Receipt Templates", icon: File },
    { id: "backup", label: "Backup & Data", icon: Database },
    { id: "users", label: "User Management", icon: Users },
  ];

  const renderContent = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSettings />;
      case "company":
        return <CompanyInfo />;
      case "accounting":
        return <AccountingSettings />;
      case "tags":
        return <TagsManagement />;
      case "tax":
        return <TaxSettings />;
      case "inventory":
        return <InventorySettings />;

      case "security":
        return <SecuritySettings />;
      case "invoice-templates":
        return <InvoiceTemplates />;
      case "receipt-templates":
        return <ReceiptTemplates />;
      case "backup":
        return (
          <div className={`${theme.textPrimary}`}>
            Backup & Data - Coming Soon
          </div>
        );
      case "users":
        return (
          <div className={`${theme.textPrimary}`}>
            User Management - Coming Soon
          </div>
        );
      default:
        return <GeneralSettings />;
    }
  };

  const handleSectionClick = (sectionId) => {
    setActiveSection(sectionId);
    // Close mobile sidebar when item is clicked
    setIsMobileSidebarOpen(false);
  };

  return (
    <Layout>
      <div className={`min-h-screen ${theme.bgPrimary} p-2 md:p-1`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className={`p-2 ${theme.bgCard} ${theme.textPrimary} rounded-lg border ${theme.borderSecondary} ${theme.bgHover} transition`}
              title="Go back"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="text-center">
              <h1
                className={`text-2xl md:text-3xl font-bold ${theme.textPrimary} flex items-center gap-2`}
              >
                <SettingsIcon size={28} className="hidden md:block" />
                <SettingsIcon size={24} className="md:hidden" />
                Settings
              </h1>
              <p className={`${theme.textSecondary} mt-1 text-sm md:text-base`}>
                Manage your application settings and preferences
              </p>
            </div>

            <button
              ref={openSidebarRef}
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className={`lg:hidden p-2 ${theme.bgCard} ${theme.textPrimary} rounded-lg border ${theme.borderSecondary} ${theme.bgHover} transition`}
            >
              <Menu size={20} />
            </button>
          </div>
        </div>

        <div className="flex gap-4 md:gap-6 overflow-hidden">
          {/* Desktop Sidebar - Always visible on large screens */}
          <div
            className={`hidden lg:block w-64 flex-shrink-0 ${theme.bgCard} ${theme.shadow} rounded-xl p-4 h-fit sticky top-6`}
          >
            <nav className="space-y-1">
              {settingsSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                      activeSection === section.id
                        ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                        : `${theme.textPrimary} ${theme.bgHover}`
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium text-sm">{section.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile Sidebar - Slide from right */}
          {isMobileSidebarOpen && (
            <div
              className={`lg:hidden fixed right-0 top-0 bottom-0 z-50 ${theme.bgCard} w-72 h-full overflow-y-auto p-6 shadow-2xl`}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className={`text-xl font-bold ${theme.textPrimary}`}>
                  Settings Menu
                </h2>
                <button
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`p-2 ${theme.textSecondary} hover:${theme.textPrimary} transition`}
                >
                  ✕
                </button>
              </div>
              <nav className="space-y-1">
                {settingsSections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => handleSectionClick(section.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                        activeSection === section.id
                          ? "bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white"
                          : `${theme.textPrimary} ${theme.bgHover}`
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium text-sm">
                        {section.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0 overflow-x-hidden">
            {renderContent()}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Settings;
