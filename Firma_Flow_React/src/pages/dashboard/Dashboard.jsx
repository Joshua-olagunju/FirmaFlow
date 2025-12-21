import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import {
  ChevronDown,
  User,
  Menu,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
} from "lucide-react";
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
import { useSettings } from "../../contexts/SettingsContext";
import { useUser } from "../../contexts/UserContext";

const COLORS = [
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#4facfe",
  "#00f2fe",
  "#43e97b",
  "#38f9d7",
  "#fa709a",
  "#fee140",
  "#30cfd0",
];

const API_ENDPOINT = "http://localhost/FirmaFlow/api/admin_dashboard_stats.php";

const Dashboard = () => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const { user } = useUser();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const openSidebarRef = useRef(null);
  const [modalopen, setModalOpen] = useState(true);

  // Dashboard data state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const toggleDropdown = () => setOpen(!open);

  const getInitials = (name) => {
    if (!name) return "";
    return name.charAt(0).toUpperCase();
  };

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(API_ENDPOINT, {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch dashboard data: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to load dashboard data");
        }

        setDashboardData(data);
      } catch (err) {
        console.error("Dashboard data fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Process sales trend data for chart
  const salesData =
    dashboardData?.sales_trend?.map((day) => ({
      name: new Date(day.date).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      amount: parseFloat(day.total_sales || 0),
      date: day.date,
    })) || [];

  // Process top products data for pie chart
  const productData =
    dashboardData?.top_products?.slice(0, 10).map((product) => ({
      name: product.product_name,
      value: parseFloat(product.total_revenue || 0),
      quantity: parseInt(product.total_quantity || 0),
    })) || [];

  // Loading state
  if (loading) {
    return (
      <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea] mx-auto mb-4"></div>
            <p className={theme.textSecondary}>Loading dashboard data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
        <div className="flex items-center justify-center h-screen">
          <div
            className={`${theme.bgCard} p-8 rounded-lg ${theme.shadow} max-w-md text-center`}
          >
            <AlertTriangle className="mx-auto mb-4 text-red-500" size={48} />
            <h3 className={`text-xl font-bold ${theme.textPrimary} mb-2`}>
              Error Loading Dashboard
            </h3>
            <p className={theme.textSecondary}>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white rounded-md"
            >
              Retry
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  const userName = user?.name || user?.email || "User";
  const userRole = user?.role || "Admin";

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      {modalopen && (
        <DashboardModal type="install" onClose={() => setModalOpen(false)} />
      )}
      <div className="w-full flex flex-col flex-1 gap-4 md:gap-8 px-2 md:px-4">
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 md:p-6 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          {/* Left Side - Title */}
          <div className="flex-col items-center pb-2 md:pb-4 flex-1">
            <h1 className="text-white font-bold text-2xl md:text-3xl">
              Administrator Dashboard
            </h1>
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
                <div className="w-8 h-8 md:w-10 md:h-10 shadow-lg rounded-full bg-white text-[#667eea] flex items-center justify-center text-sm md:text-lg font-bold overflow-hidden">
                  {user?.image ? (
                    <img
                      src={user.image}
                      alt="user"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(userName)
                  )}
                </div>

                <div className="flex-1 hidden md:block">
                  <p className="font-semibold text-slate-100 text-sm">
                    {userName}
                  </p>
                  <p className="font-normal text-slate-200 text-xs">
                    {userRole}
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
                  <div
                    onClick={() => navigate("/subscription")}
                    className="hover:bg-gray-100 p-2 rounded cursor-pointer"
                  >
                    Subscription
                  </div>
                  <div className="hover:bg-gray-100 p-2 rounded cursor-pointer">
                    Contact Support
                  </div>
                  <div className="hover:bg-gray-100 p-2 rounded cursor-pointer border-t border-b border-slate-300">
                    Switch Accounts
                  </div>
                  <div
                    onClick={() => navigate("/settings")}
                    className="hover:bg-gray-100 p-2 rounded cursor-pointer"
                  >
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

        {/* Stats Cards - Mobile Responsive Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
          {/* Total Customers Card */}
          <div
            className={`flex ${theme.shadow} rounded-lg items-center ${theme.bgCard} p-3 md:p-4`}
          >
            <div className="flex items-center gap-3 md:gap-4 w-full">
              <div className="flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4 md:p-6 flex-shrink-0"></div>
              <div className="flex flex-col gap-1 min-w-0">
                <p
                  className={`m-0 font-bold ${theme.textPrimary} text-2xl md:text-3xl truncate`}
                >
                  {dashboardData?.customers?.total_customers || 0}
                </p>
                <p
                  className={`m-0 font-normal ${theme.textSecondary} text-sm md:text-base`}
                >
                  Total Customers
                </p>
                <p className={`font-normal text-xs ${theme.textSecondary}`}>
                  +{dashboardData?.customers?.new_customers_30d || 0} this month
                </p>
              </div>
            </div>
          </div>

          {/* Products Card */}
          <div
            className={`flex ${theme.shadow} rounded-lg items-center ${theme.bgCard} p-3 md:p-4`}
          >
            <div className="flex items-center gap-3 md:gap-4 w-full">
              <div className="flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4 md:p-6 flex-shrink-0"></div>
              <div className="flex flex-col gap-1 min-w-0">
                <p
                  className={`m-0 font-bold ${theme.textPrimary} text-2xl md:text-3xl truncate`}
                >
                  {dashboardData?.products?.total_products || 0}
                </p>
                <p
                  className={`m-0 font-normal ${theme.textSecondary} text-sm md:text-base`}
                >
                  Products
                </p>
                <p className={`font-normal text-xs ${theme.textSecondary}`}>
                  {dashboardData?.products?.low_stock_products || 0} low stock
                </p>
              </div>
            </div>
          </div>

          {/* Total Sales Card */}
          <div
            className={`flex ${theme.shadow} rounded-lg items-center ${theme.bgCard} p-3 md:p-4`}
          >
            <div className="flex items-center gap-3 md:gap-4 w-full">
              <div className="flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4 md:p-6 flex-shrink-0"></div>
              <div className="flex flex-col gap-1 min-w-0">
                <p
                  className={`m-0 font-bold ${theme.textPrimary} text-xl md:text-2xl truncate`}
                >
                  {formatCurrency(
                    parseFloat(dashboardData?.sales?.total_sales || 0)
                  )}
                </p>
                <p
                  className={`m-0 font-normal ${theme.textSecondary} text-sm md:text-base`}
                >
                  Total Sales
                </p>
                <p className={`font-normal text-xs ${theme.textSecondary}`}>
                  {formatCurrency(
                    parseFloat(dashboardData?.sales?.today_sales || 0)
                  )}{" "}
                  today
                </p>
              </div>
            </div>
          </div>

          {/* Low Stock Items Card */}
          <div
            className={`relative flex ${theme.shadow} rounded-lg items-center ${theme.bgCard} p-3 md:p-4`}
          >
            <div className="flex items-center gap-3 md:gap-4 w-full">
              <div className="flex shadow-lg rounded-lg items-center justify-center bg-gradient-to-br from-[#667eea] to-[#764ba2] p-4 md:p-6 flex-shrink-0"></div>
              <div className="flex flex-col gap-1 min-w-0">
                <p
                  className={`m-0 font-bold ${theme.textPrimary} text-2xl md:text-3xl truncate`}
                >
                  {dashboardData?.products?.low_stock_products || 0}
                </p>
                <p
                  className={`m-0 font-normal ${theme.textSecondary} text-sm md:text-base`}
                >
                  Low Stock Items
                </p>
                <p className={`font-normal text-xs ${theme.textSecondary}`}>
                  {dashboardData?.products?.out_of_stock_products || 0} out of
                  stock
                </p>
              </div>
            </div>
            <div className="absolute text-xs md:text-sm text-blue-400 top-2 right-2 cursor-pointer hover:underline">
              View
            </div>
          </div>
        </div>

        {/* Charts Section - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          {/* SALES TREND CARD - Takes 2/3 on desktop, full width on mobile */}
          <div
            className={`${
              theme.bgCard
            } relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-20 md:after:h-24 after:mb-2 after:${
              theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
            } after:z-0 rounded-2xl ${theme.shadow} p-4 md:p-6 lg:col-span-2`}
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center py-2 md:py-4 mb-4 relative z-10 gap-2">
              <h2
                className={`text-xl md:text-3xl font-semibold ${theme.textPrimary}`}
              >
                Sales Trend (Last 7 Days)
              </h2>
              <p className={`text-xs md:text-sm ${theme.textSecondary}`}>
                Updated: {new Date().toLocaleTimeString()}
              </p>
            </div>

            <div className="w-full" style={{ height: "250px" }}>
              {salesData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={salesData}>
                    <CartesianGrid stroke="#e5e7eb" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(value) =>
                        `${formatCurrency(value).replace(/\.\d+$/, "")}`
                      }
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor:
                          theme.mode === "light" ? "#fff" : "#1f2937",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#6172F3"
                      strokeWidth={3}
                      dot={{
                        stroke: "#6172F3",
                        strokeWidth: 2,
                        r: 4,
                        fill: "#fff",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className={theme.textSecondary}>No sales data available</p>
                </div>
              )}
            </div>
          </div>

          {/* TOP 10 PRODUCTS CARD - Takes 1/3 on desktop, full width on mobile */}
          <div
            className={`${theme.bgCard} rounded-2xl ${
              theme.shadow
            } p-4 md:p-6 relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-20 md:after:h-24 after:mb-8 after:${
              theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
            } after:z-0`}
          >
            <h2
              className={`text-lg md:text-2xl font-semibold ${theme.textPrimary} mb-4 relative z-10`}
            >
              Top 10 Products (Last 30 Days)
            </h2>

            {productData.length > 0 ? (
              <div className="flex flex-col items-center">
                {/* Chart */}
                <div className="w-40 md:w-48" style={{ height: "180px" }}>
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
                      >
                        {productData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value) => formatCurrency(value)}
                        contentStyle={{
                          backgroundColor:
                            theme.mode === "light" ? "#fff" : "#1f2937",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Center text */}
                <div className="relative -top-20 md:-top-24 text-center">
                  <div
                    className={`text-base md:text-lg font-bold ${theme.textPrimary}`}
                  >
                    Total
                  </div>
                  <div className={`text-sm ${theme.textSecondary}`}>
                    {formatCurrency(
                      productData.reduce((sum, item) => sum + item.value, 0)
                    )}
                  </div>
                </div>

                {/* Legend */}
                <div className="mt-1 grid grid-cols-1 gap-1 max-h-32 overflow-y-auto w-full px-2">
                  {productData.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ background: COLORS[index % COLORS.length] }}
                      ></span>
                      <span
                        className={`text-xs ${theme.textSecondary} truncate`}
                      >
                        {entry.name}
                      </span>
                      <span
                        className={`text-xs ${theme.textSecondary} ml-auto flex-shrink-0`}
                      >
                        {entry.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-48">
                <p className={`${theme.textSecondary} text-center`}>
                  No product sales data
                </p>
              </div>
            )}
          </div>
        </div>
        {/* Quick Actions - Mobile Responsive */}
        <div
          className={`${theme.bgCard} rounded-2xl ${
            theme.shadow
          } p-4 md:p-6 relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-12 md:after:h-14 after:mb-8 after:${
            theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
          } after:z-0 w-full`}
        >
          <h2
            className={`relative z-10 font-semibold text-xl md:text-3xl ${theme.textPrimary} mb-4`}
          >
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2 md:gap-3 w-full">
            <button className="flex-1 min-w-[140px] sm:flex-none px-3 md:px-4 py-2 rounded-md border-none bg-gradient-to-br from-[#667eea] to-[#764ba2] text-slate-50 text-sm md:text-base hover:opacity-90 transition">
              New Sales
            </button>
            <button className="flex-1 min-w-[140px] sm:flex-none px-3 md:px-4 py-2 rounded-md border border-[#667eea] text-[#667eea] hover:bg-[#667eea] hover:text-white text-sm md:text-base transition">
              Manage Customers
            </button>
            <button className="flex-1 min-w-[140px] sm:flex-none px-3 md:px-4 py-2 rounded-md border border-[#667eea] text-[#667eea] hover:bg-[#667eea] hover:text-white text-sm md:text-base transition">
              Products
            </button>
            <button className="flex-1 min-w-[140px] sm:flex-none px-3 md:px-4 py-2 rounded-md border border-[#6c757d] text-[#6c757d] hover:bg-[#6c757d] hover:text-white text-sm md:text-base transition">
              Reports
            </button>
            <button className="flex-1 min-w-[140px] sm:flex-none px-3 md:px-4 py-2 rounded-md border border-[#6c757d] text-[#6c757d] hover:bg-[#6c757d] hover:text-white text-sm md:text-base transition">
              Settings
            </button>
          </div>
        </div>

        {/* Recent Sales and Top Customers - Mobile Responsive */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          {/* Recent Sales - Takes 2/3 on desktop */}
          <div
            className={`${theme.bgCard} rounded-2xl ${
              theme.shadow
            } p-4 md:p-6 relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-16 md:after:h-18 after:mb-8 after:${
              theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
            } after:z-0 lg:col-span-2`}
          >
            <div className="flex w-full items-center justify-between relative z-10 mb-4">
              <h2
                className={`font-semibold text-xl md:text-3xl ${theme.textPrimary}`}
              >
                Recent Sales
              </h2>
              <button className="flex items-center px-2 md:px-3 py-1.5 md:py-2 border border-[#667eea] text-[#667eea] text-xs md:text-sm rounded-md hover:bg-[#667eea] hover:text-white transition">
                View All
              </button>
            </div>

            {dashboardData?.recent_sales &&
            dashboardData.recent_sales.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr
                      className={`border-b ${
                        theme.mode === "light"
                          ? "border-gray-200"
                          : "border-gray-700"
                      }`}
                    >
                      <th
                        className={`text-left py-2 px-2 text-xs md:text-sm ${theme.textSecondary}`}
                      >
                        Date
                      </th>
                      <th
                        className={`text-left py-2 px-2 text-xs md:text-sm ${theme.textSecondary}`}
                      >
                        Customer
                      </th>
                      <th
                        className={`text-right py-2 px-2 text-xs md:text-sm ${theme.textSecondary}`}
                      >
                        Amount
                      </th>
                      <th
                        className={`text-center py-2 px-2 text-xs md:text-sm ${theme.textSecondary}`}
                      >
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recent_sales
                      .slice(0, 8)
                      .map((sale, index) => (
                        <tr
                          key={index}
                          className={`border-b ${
                            theme.mode === "light"
                              ? "border-gray-100"
                              : "border-gray-800"
                          }`}
                        >
                          <td
                            className={`py-2 px-2 text-xs md:text-sm ${theme.textPrimary}`}
                          >
                            {new Date(sale.date).toLocaleDateString()}
                          </td>
                          <td
                            className={`py-2 px-2 text-xs md:text-sm ${theme.textPrimary} truncate max-w-[150px]`}
                          >
                            {sale.customer_name || "Walk-in Customer"}
                          </td>
                          <td
                            className={`py-2 px-2 text-xs md:text-sm ${theme.textPrimary} text-right font-semibold`}
                          >
                            {formatCurrency(parseFloat(sale.total))}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <span
                              className={`px-2 py-1 rounded-full text-xs ${
                                sale.payment_status === "paid" ||
                                sale.payment_status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : sale.payment_status === "partial"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {sale.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 md:py-16">
                <p
                  className={`${theme.textSecondary} font-semibold text-base md:text-xl`}
                >
                  No recent sales
                </p>
                <p
                  className={`${theme.textSecondary} text-xs md:text-sm text-center px-4`}
                >
                  Sales will appear here once you start making transactions
                </p>
                <button className="mt-3 md:mt-5 flex bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-md px-3 py-1.5 text-xs md:text-sm text-slate-100">
                  Create First Sale
                </button>
              </div>
            )}
          </div>

          {/* Top Customers */}
          <div
            className={`${theme.bgCard} rounded-2xl ${
              theme.shadow
            } p-4 md:p-6 relative after:content-[''] after:absolute after:top-0 after:left-0 after:w-full after:h-16 md:after:h-18 after:mb-8 after:${
              theme.mode === "light" ? "bg-slate-100" : "bg-slate-800"
            } after:z-0`}
          >
            <h2
              className={`relative z-10 font-semibold text-xl md:text-3xl ${theme.textPrimary} mb-4`}
            >
              Top Customers
            </h2>

            {dashboardData?.top_customers &&
            dashboardData.top_customers.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.top_customers
                  .slice(0, 5)
                  .map((customer, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        theme.mode === "light" ? "bg-gray-50" : "bg-gray-800"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#667eea] to-[#764ba2] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {index + 1}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={`${theme.textPrimary} text-sm font-medium truncate`}
                          >
                            {customer.customer_name}
                          </p>
                          <p className={`${theme.textSecondary} text-xs`}>
                            {customer.total_invoices || customer.total_orders}{" "}
                            orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className={`${theme.textPrimary} text-sm font-bold`}>
                          {formatCurrency(parseFloat(customer.total_spent))}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center w-full gap-2 py-8 md:py-14">
                <p
                  className={`${theme.textSecondary} font-semibold text-base md:text-xl`}
                >
                  No customer data
                </p>
                <p
                  className={`${theme.textSecondary} text-xs md:text-sm text-center px-4`}
                >
                  Top customers will appear here based on purchase history
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
