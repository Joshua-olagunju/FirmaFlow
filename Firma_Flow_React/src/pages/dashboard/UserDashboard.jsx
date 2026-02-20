import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import {
  Menu, Package, ShoppingCart, CreditCard, Users,
  TrendingUp, AlertTriangle, Search, ArrowRight, Plus, Eye
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useUser } from "../../contexts/UserContext";
import { buildApiUrl } from "../../config/api.config";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const UserDashboard = () => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const { user } = useUser();
  const navigate = useNavigate();
  const displayName = user?.name ||
    (user?.first_name
      ? `${user.first_name}${user.last_name ? " " + user.last_name : ""}`.trim()
      : "User");
  const openSidebarRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [productSearch, setProductSearch] = useState("");
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    todaySales: 0,
    todaySalesCount: 0,
    todayPayments: 0,
    pendingPayments: 0,
    recentActivity: [],
    lowStockItems: [],
    products: [],
    salesPerDay: [],
  });

  useEffect(() => {
    const fetchUserDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl("api/user_dashboard_stats.php"), {
          method: "GET",
          credentials: "include",
        });
        if (!response.ok) throw new Error("Failed to fetch dashboard data");
        const data = await response.json();
        if (data.success) {
          setStats({
            totalProducts: data.products_count || 0,
            lowStockCount: data.low_stock_count || 0,
            todaySales: data.today_sales || 0,
            todaySalesCount: data.today_sales_count || 0,
            todayPayments: data.today_payments || 0,
            pendingPayments: data.pending_payments || 0,
            recentActivity: data.recent_activity || [],
            lowStockItems: data.low_stock_items || [],
            products: data.products || [],
            salesPerDay: data.sales_per_day || [],
          });
        }
      } catch (err) {
        console.error("Error fetching user dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchUserDashboard();
  }, []);

  // Products filtered by search
  const filteredProducts = stats.products
    .filter((p) =>
      p.name?.toLowerCase().includes(productSearch.toLowerCase()) ||
      (p.sku || "").toLowerCase().includes(productSearch.toLowerCase())
    )
    .slice(0, 5);

  // Custom tooltip for chart
  const ChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-900 border border-purple-500/30 rounded-lg px-3 py-2 shadow-xl">
          <p className="text-purple-300 text-xs font-semibold mb-1">{label}</p>
          <p className="text-white text-sm font-bold">{formatCurrency(payload[0].value)}</p>
        </div>
      );
    }
    return null;
  };

  const statCards = [
    {
      label: "Today's Sales",
      value: formatCurrency(stats.todaySales),
      sub: `${stats.todaySalesCount} transaction${stats.todaySalesCount !== 1 ? "s" : ""}`,
      icon: ShoppingCart,
      accent: "border-l-emerald-500",
      iconBg: "bg-emerald-500/15",
      iconColor: "text-emerald-500",
    },
    {
      label: "Payments Received",
      value: formatCurrency(stats.todayPayments),
      sub: `${stats.pendingPayments} pending`,
      icon: CreditCard,
      accent: "border-l-blue-500",
      iconBg: "bg-blue-500/15",
      iconColor: "text-blue-500",
    },
    {
      label: "Products in Stock",
      value: stats.totalProducts,
      sub: "total SKUs",
      icon: Package,
      accent: "border-l-purple-500",
      iconBg: "bg-purple-500/15",
      iconColor: "text-purple-500",
    },
    {
      label: "Low Stock Alert",
      value: stats.lowStockCount,
      sub: "items need restock",
      icon: AlertTriangle,
      accent: "border-l-orange-500",
      iconBg: "bg-orange-500/15",
      iconColor: "text-orange-500",
      alert: stats.lowStockCount > 0,
    },
  ];

  const quickActions = [
    { label: "New Sale", icon: Plus, path: "/sales" },
    { label: "Customers", icon: Users, path: "/customers" },
    { label: "Payments", icon: CreditCard, path: "/payments" },
    { label: "Inventory", icon: Package, path: "/inventory" },
  ];

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full flex flex-col gap-6 pb-8">
        {/* Header Banner - matches admin dashboard style */}
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 md:p-6 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          <div>
            <h2 className="text-white font-bold text-2xl md:text-3xl">
              Welcome, {displayName}!
            </h2>
            <p className="text-slate-200 text-sm mt-1">
              Here's your sales overview for today.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 border border-white/30 rounded-md px-3 py-1.5">
              <TrendingUp size={15} className="text-white/80" />
              <span className="text-white text-sm">
                {stats.todaySalesCount} sale{stats.todaySalesCount !== 1 ? "s" : ""} today
              </span>
            </div>
            <button
              onClick={() => openSidebarRef.current?.()}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
            >
              <Menu size={22} className="text-white" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea]" />
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className={`${theme.bgCard} ${theme.shadow} rounded-xl border-l-4 ${card.accent} ${
                      card.alert ? "ring-1 ring-orange-500/30" : ""
                    } p-5`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-wider ${theme.textSecondary} mb-2`}>
                          {card.label}
                        </p>
                        <p className={`text-2xl font-bold ${theme.textPrimary}`}>{card.value}</p>
                        <p className={`text-xs mt-1 ${card.alert ? "text-orange-500 font-semibold" : theme.textSecondary}`}>
                          {card.sub}
                        </p>
                      </div>
                      <div className={`p-2.5 rounded-xl ${card.iconBg}`}>
                        <Icon size={22} className={card.iconColor} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sales Chart + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Sales Per Day Chart */}
              <div className={`lg:col-span-2 ${theme.bgCard} ${theme.shadow} rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className={`font-bold text-base ${theme.textPrimary}`}>Sales (Last 7 Days)</h3>
                    <p className={`text-xs ${theme.textSecondary}`}>Your daily revenue trend</p>
                  </div>
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-full">
                    <TrendingUp size={14} className="text-emerald-400" />
                    <span className="text-emerald-400 text-xs font-semibold">7-day view</span>
                  </div>
                </div>
                {stats.salesPerDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={stats.salesPerDay} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis
                        dataKey="label"
                        tick={{ fill: "#9ca3af", fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#9ca3af", fontSize: 11 }}
                        axisLine={false}
                        tickLine={false}
                        tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                      />
                      <Tooltip content={<ChartTooltip />} cursor={{ fill: "#ffffff08" }} />
                      <Bar
                        dataKey="total"
                        fill="url(#salesGrad)"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                      />
                      <defs>
                        <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#667eea" />
                          <stop offset="100%" stopColor="#764ba2" />
                        </linearGradient>
                      </defs>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className={`flex items-center justify-center h-[220px] ${theme.textSecondary} text-sm`}>
                    No sales data yet
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              <div className={`${theme.bgCard} ${theme.shadow} rounded-xl p-5 flex flex-col gap-2`}>
                <h3 className={`font-bold text-base ${theme.textPrimary} mb-1`}>Quick Actions</h3>
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.label}
                      onClick={() => navigate(action.path)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg ${theme.bgAccent} ${theme.textPrimary} hover:bg-[#667eea] hover:text-white transition-all duration-200 group`}
                    >
                      <Icon size={18} className="group-hover:text-white" />
                      <span className="font-medium text-sm flex-1 text-left">{action.label}</span>
                      <ArrowRight size={15} className="opacity-40 group-hover:opacity-100" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Products Search + Low Stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Products in Stock with Search */}
              <div className={`${theme.bgCard} ${theme.shadow} rounded-xl p-5`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-bold text-base ${theme.textPrimary}`}>Products in Stock</h3>
                  <button
                    onClick={() => navigate("/inventory")}
                    className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition"
                  >
                    View all <Eye size={13} />
                  </button>
                </div>
                {/* Search */}
                <div className="relative mb-3">
                  <Search size={15} className={`absolute left-3 top-1/2 -translate-y-1/2 ${theme.textSecondary}`} />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className={`w-full pl-8 pr-3 py-2 text-sm rounded-lg border ${theme.borderPrimary} ${theme.bgInput} ${theme.textPrimary} focus:outline-none focus:ring-2 focus:ring-purple-500/40`}
                  />
                </div>
                {/* Product List */}
                <div className="space-y-1.5">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((product) => (
                      <div
                        key={product.id}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${theme.bgAccent}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${theme.textPrimary} truncate`}>{product.name}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>
                            SKU: {product.sku || "—"}
                          </p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p
                            className={`text-sm font-semibold ${
                              (product.stock_quantity || 0) <= (product.reorder_level || 5)
                                ? "text-orange-500"
                                : theme.textGreen
                            }`}
                          >
                            {product.stock_quantity ?? 0} in stock
                          </p>
                          <p className={`text-xs ${theme.textSecondary}`}>
                            {formatCurrency(product.selling_price || 0)}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className={`text-center text-sm py-6 ${theme.textSecondary}`}>
                      {productSearch ? "No matching products" : "No products found"}
                    </p>
                  )}
                </div>
              </div>

              {/* Low Stock Alert */}
              <div className={`${theme.bgCard} ${theme.shadow} rounded-xl p-5 ${
                stats.lowStockItems.length > 0 ? "border-l-4 border-l-orange-500" : ""
              }`}>
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={18} className={stats.lowStockItems.length > 0 ? "text-orange-500" : theme.textSecondary} />
                  <h3 className={`font-bold text-base ${theme.textPrimary}`}>Low Stock Alert</h3>
                  {stats.lowStockItems.length > 0 && (
                    <span className="ml-auto bg-orange-500/20 text-orange-400 text-xs font-bold px-2 py-0.5 rounded-full">
                      {stats.lowStockItems.length}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
                  {stats.lowStockItems.length > 0 ? (
                    stats.lowStockItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg ${theme.bgAccent}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${theme.textPrimary} truncate`}>{item.name}</p>
                          <p className={`text-xs ${theme.textSecondary}`}>SKU: {item.sku || "—"}</p>
                        </div>
                        <div className="text-right shrink-0 ml-3">
                          <p className={`text-sm font-semibold ${
                            item.stock_quantity === 0 ? theme.textRed : "text-orange-500"
                          }`}>
                            {item.stock_quantity} left
                          </p>
                          <p className={`text-xs ${theme.textSecondary}`}>
                            Min: {item.reorder_level}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Package size={32} className={`${theme.textGreen} opacity-50`} />
                      <p className={`text-sm ${theme.textSecondary}`}>All items are well stocked</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default UserDashboard;
