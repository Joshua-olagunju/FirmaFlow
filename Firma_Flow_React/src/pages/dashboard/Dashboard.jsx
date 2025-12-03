import { useState, useRef } from "react";
import Layout from "../../components/Layout";
import { ChevronDown, User, Menu } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from "recharts";
import DashboardModal from "../../components/modals/DashboardModal";
import { useTheme } from "../../contexts/ThemeContext";

// Sample data matching your design
const salesData = [
  { name: "Mon", amount: 4000 },
  { name: "Tue", amount: 3000 },
  { name: "Wed", amount: 2000 },
  { name: "Thu", amount: 2780 },
  { name: "Fri", amount: 1890 },
  { name: "Sat", amount: 2390 },
  { name: "Sun", amount: 3490 },
];

const productData = [
  { name: "Product A", value: 40 },
  { name: "Product B", value: 30 },
  { name: "Product C", value: 20 },
  { name: "Product D", value: 10 },
];

// const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];
const COLORS = ["#667eea"];
const user = {
  userIcon: <User size={16} className="text-white" />,
  name: "Chris Mike",
  company: "Admin",
};

const Dashboard = () => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const openSidebarRef = useRef(null);

  const toggleDropdown = () => setOpen(!open);
  const [modalopen, setModalOpen] = useState(true);

  const getInitials = (name) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase();
  };

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      {modalopen && (
        <DashboardModal type="install" onClose={() => setModalOpen(false)} />
      )}
      <div className="w-full md:flex flex-col flex-1 items-center justify-center gap-8">
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          {/* Left Side - Title */}
          <div className="flex-col items-center pb-4 flex-1">
            <h2 className="text-white font-bold text-2xl md:text-3xl">
              Administrator Dashboard
            </h2>
            <p className="m-0 text-sm md:text-normal font-500 text-slate-200">
              Complete business overview and management insights for
              administrators.
            </p>
          </div>

          {/* Right Side - User Menu & Hamburger */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* User Dropdown - Always visible, compact on mobile */}
            <div className="relative">
              {/* Desktop: Full user info, Mobile: Just avatar */}
              <div
                className="flex items-center gap-2 md:gap-3 md:w-[160px] md:h-[55px] py-1 md:py-0.5 px-1 md:px-2 md:border border-white rounded-md cursor-pointer select-none hover:bg-white/10 transition"
                onClick={toggleDropdown}
              >
                <div className="w-8 h-8 md:w-8 md:h-8 shadow-lg rounded-full bg-white text-[#667eea] flex items-center justify-center text-sm md:text-lg font-bold overflow-hidden">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt="user"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(user.name)
                  )}
                </div>

                <div className="flex-1 hidden md:block">
                  <p className="font-semibold text-slate-100 text-sm">
                    {user.name}
                  </p>
                  <p className="font-normal text-slate-800 text-sm">
                    {user.company}
                  </p>
                </div>

                <ChevronDown
                  className={`hidden md:block transition-transform duration-200 ${
                    open ? "rotate-180" : ""
                  }`}
                  size={16}
                  color="white"
                />
              </div>

              {/* Dropdown section - Responsive positioning */}
              {open && (
                <div className="absolute right-0 md:right-auto top-full mt-2 w-[160px] bg-white shadow-lg rounded-md p-2 z-50">
                  <div className="hover:bg-gray-100 p-2 rounded cursor-pointer">
                    Subscription
                  </div>
                  <div className="hover:bg-gray-100 p-2 rounded cursor-pointer">
                    Contact Support
                  </div>
                  <div className="hover:bg-gray-100 p-2 rounded cursor-pointer border-t border-b border-slate-300">
                    Switch Accounts
                  </div>
                  <div className="hover:bg-gray-100 p-2 rounded cursor-pointer">
                    Settings
                  </div>
                  <div className="hover:bg-gray-100 p-2 rounded cursor-pointer text-red-400">
                    Logout
                  </div>
                </div>
              )}
            </div>

            {/* Hamburger Menu - Only visible on mobile */}
            <button
              onClick={() => openSidebarRef.current?.()}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
            >
              <Menu size={24} className="text-white" />
            </button>
          </div>
        </div>

        <div className="md:flex items-center justify-between w-full">
          <div
            className={`flex ${theme.shadow} rounded-lg items-center justify-center ${theme.bgCard} md:p-4 mb-4 mt-4`}
          >
            <div className="flex p-3 items-center gap-4">
              <div className="flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6"></div>
              <div className="flex flex-col gap-2">
                <p className={`m-0 font-bold ${theme.textPrimary} text-3xl`}>
                  0
                </p>
                <p
                  className={`m-0 font-normal ${theme.textSecondary} text-normal`}
                >
                  Total Customer
                </p>
                <p className={`font-normal text-sm ${theme.textSecondary}`}>
                  0
                </p>
              </div>
            </div>
          </div>
          <div
            className={`flex ${theme.shadow} rounded-lg items-center justify-center ${theme.bgCard} p-4 mb-4`}
          >
            <div className="flex p-3 items-center gap-4">
              <div className="flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6"></div>
              <div className="flex flex-col gap-2">
                <p className={`m-0 font-bold ${theme.textPrimary} text-3xl`}>
                  0
                </p>
                <p
                  className={`m-0 font-normal ${theme.textSecondary} text-normal`}
                >
                  Products
                </p>
                <p className={`font-normal text-sm ${theme.textSecondary}`}>
                  0
                </p>
              </div>
            </div>
          </div>

          <div
            className={`flex ${theme.shadow} rounded-lg items-center justify-center ${theme.bgCard} p-4 mb-4`}
          >
            <div className="flex p-3 items-center gap-4">
              <div className="flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6"></div>
              <div className="flex flex-col gap-2">
                <p className={`m-0 font-bold ${theme.textPrimary} text-3xl`}>
                  ₦0.00
                </p>
                <p
                  className={`m-0 font-normal ${theme.textSecondary} text-normal`}
                >
                  Total Sales
                </p>
                <p className={`font-normal text-sm ${theme.textSecondary}`}>
                  ₦0.00
                </p>
              </div>
            </div>
          </div>

          <div
            className={`relative flex ${theme.shadow} rounded-lg items-center justify-center ${theme.bgCard} p-4 mr-2`}
          >
            <div className="flex p-3 items-center gap-4">
              <div className="flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-6"></div>
              <div className="flex flex-col gap-2">
                <p className={`m-0 font-bold ${theme.textPrimary} text-3xl`}>
                  0
                </p>
                <p
                  className={`m-0 font-normal ${theme.textSecondary} text-normal`}
                >
                  Low Stock Items
                </p>
                <p className={`font-normal text-sm ${theme.textSecondary}`}>
                  0
                </p>
              </div>
            </div>
            <div className="absolute text-normal text-sm text-blue-400 top-0 right-0 p-2">
              View
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {/* SALES TREND CARD - Takes 2/3 of the space */}
          <div
            className={`${
              theme.bgCard
            } relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-24 after:mb-2 after:${
              theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
            } after:z-0 rounded-2xl ${theme.shadow} p-6 md:col-span-2`}
          >
            <div className="flex justify-between items-center py-4 mb-4 relative z-10">
              <h2 className={`text-3xl font-semibold ${theme.textPrimary}`}>
                Sales Trend (Last 7 Days)
              </h2>
              <p className={`text-sm ${theme.textSecondary}`}>
                Updated: {new Date().toLocaleString()}
              </p>
            </div>

            <div className="w-full" style={{ height: "300px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesData}>
                  <CartesianGrid stroke="#e5e7eb" />
                  <XAxis dataKey="name" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#6172F3"
                    strokeWidth={3}
                    dot={{
                      stroke: "#6172F3",
                      strokeWidth: 2,
                      r: 5,
                      fill: "#fff",
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* TOP 10 PRODUCTS CARD - Takes 1/3 of the space */}
          <div
            className={`${theme.bgCard} md:mr-2 rounded-2xl ${
              theme.shadow
            } p-4 relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-24 after:mb-8 after:${
              theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
            } after:z-0`}
          >
            <h2
              className={`text-2xl items-center font-semibold ${theme.textPrimary} mb-4 relative z-10 w-4/5 md:ml-5`}
            >
              Top 10 Products (Last 30 Days)
            </h2>

            <div className="flex flex-col items-center">
              {/* Smaller chart container */}
              <div className="w-48" style={{ height: "200px" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={productData}
                      cx="50%"
                      cy="50%"
                      innerRadius="60%"
                      outerRadius="80%"
                      paddingAngle={2}
                      dataKey="value"
                      // label={({ name, value }) => `${name}: ${value}%`}
                      labelLine={true}
                    >
                      {productData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Smaller center text */}
              <div className="relative -top-24 text-center">
                <div className={`text-lg font-bold ${theme.textPrimary}`}>
                  Total
                </div>
                <div className={`text-md ${theme.textSecondary}`}>
                  {productData.reduce((sum, item) => sum + item.value, 0)}%
                </div>
              </div>

              {/* Compact legend */}
              <div className="mt-1 grid grid-cols-1 gap-1">
                {productData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: COLORS[index % COLORS.length] }}
                    ></span>
                    <span className={`text-xs ${theme.textSecondary}`}>
                      {entry.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          className={`${theme.bgCard} mr-2 rounded-2xl ${
            theme.shadow
          } p-4 relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-14 after:mb-8 after:${
            theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
          } after:z-0 w-full`}
        >
          <h2
            className={`relative z-10 font-semibold text-3xl ${theme.textPrimary}`}
          >
            Quick Actions
          </h2>
          <div className="md:mt-8 md:flex items-center gap-2 w-full">
            <button className="items-center px-4 py-2 rounded-md border-none bg-gradient-to-br from-[#667eea] to-[#764ba2] text-slate-50 md:m-0 m-2">
              New Sales
            </button>
            <button className="items-center px-4 py-2 rounded-md border border-[#667eea] text-[#667eea] hover:bg-[#0d6efd] hover:text-white md:m-0 m-2">
              Manage Customers
            </button>
            <button className="items-center px-4 py-2 rounded-md border border-[#667eea] text-[#667eea] hover:bg-[#0d6efd] hover:text-white md:m-0 m-2">
              Products
            </button>
            <button className="items-center px-4 py-2 rounded-md border border-[#6c757d] text-[#6c757d] hover:bg-[#6c757d] hover:text-white md:m-0 m-2">
              Reports
            </button>
            <button className="items-center px-4 py-2 rounded-md border border-[#6c757d] text-[#6c757d] hover:bg-[#6c757d] hover:text-white md:m-0 m-2">
              Settings
            </button>
          </div>
        </div>
        <div className="md:flex w-full items-center gap-8">
          <div
            className={`${theme.bgCard} md:mr-2 rounded-2xl ${
              theme.shadow
            } p-4 relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-18 after:mb-8 after:${
              theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
            } after:z-0 w-full`}
          >
            <div className="flex w-full items-center justify-between relative z-10">
              <h2 className={`font-semibold text-3xl ${theme.textPrimary}`}>
                Recent Sales
              </h2>
              <button className="flex items-center px-3 py-2 border border-[#667eea] text-[#667eea] text-sm rounded-md">
                View All
              </button>
            </div>
            <div className="flex flex-col items-center justify-center mt-5 gap-2 p-16">
              <p className={`${theme.textSecondary} font-semibold text-xl`}>
                No recent sales
              </p>
              <p className={theme.textSecondary}>
                Sales will appear here once you start making transactions
              </p>
              <button className="mt-5 flex bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-md px-2 py-1 text-sm text-slate-100">
                Renew Subscription
              </button>
            </div>
          </div>
          <div
            className={`${theme.bgCard} md:mr-2 rounded-2xl ${
              theme.shadow
            } p-4 relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-18 after:mb-8 after:${
              theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
            } after:z-0 w-[400px]`}
          >
            <h2
              className={`relative z-10 font-semibold text-3xl ${theme.textPrimary}`}
            >
              Top Customers
            </h2>
            <div className="flex flex-col items-center justify-center w-full mt-5 gap-2 py-14">
              <p className={`${theme.textSecondary} font-semibold text-xl`}>
                {" "}
                No customer data
              </p>
              <p className={`flex text-center ${theme.textSecondary}`}>
                Top customers will appear here based on purchase history
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
