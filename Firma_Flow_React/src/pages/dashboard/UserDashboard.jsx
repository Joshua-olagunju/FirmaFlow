import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/Layout";
import { Menu, TrendingUp, Package, ShoppingCart, CreditCard, Users } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { useUser } from "../../contexts/UserContext";
import { buildApiUrl } from "../../config/api.config";

const UserDashboard = () => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const { user } = useUser();
  const navigate = useNavigate();
  const openSidebarRef = useRef(null);
  
  // Dashboard data state
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalProducts: 0,
    todaySales: 0,
    monthSales: 0,
    recentActivity: [],
    lowStockItems: []
  });

  // Fetch user dashboard data
  useEffect(() => {
    const fetchUserDashboard = async () => {
      try {
        setLoading(true);
        const response = await fetch(buildApiUrl("api/user_dashboard_stats.php"), {
          method: "GET",
          credentials: "include",
        });
        
        if (!response.ok) {
          throw new Error("Failed to fetch dashboard data");
        }
        
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
            lowStockItems: data.low_stock_items || []
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

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full flex flex-col gap-6 px-4 pb-8">
        {/* Header */}
        <div className="w-full flex justify-between items-center rounded-b-lg align-top p-6 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          <div>
            <h2 className="text-white font-bold text-3xl flex items-center gap-2">
              Welcome, {user?.first_name || "User"}!
            </h2>
            <p className="m-0 text-base font-medium text-slate-200 mt-1">
              Here's your dashboard overview
            </p>
          </div>
          <button
            onClick={() => openSidebarRef.current?.()}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition"
          >
            <Menu size={24} className="text-white" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#667eea]"></div>
          </div>
        ) : (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Total Products */}
              <div className={`${theme.cardBg} rounded-xl shadow-lg p-6 border ${theme.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <Package className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                  {stats.totalProducts || 0}
                </h3>
                <p className={`text-sm ${theme.textSecondary}`}>Products in Stock</p>
              </div>

              {/* Low Stock Items */}
              <div className={`${theme.cardBg} rounded-xl shadow-lg p-6 border ${theme.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                    <Package className="text-orange-600 dark:text-orange-400" size={24} />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                  {stats.lowStockCount || 0}
                </h3>
                <p className={`text-sm ${theme.textSecondary}`}>Low Stock Alert</p>
              </div>

              {/* Today's Sales */}
              <div className={`${theme.cardBg} rounded-xl shadow-lg p-6 border ${theme.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ShoppingCart className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                  {formatCurrency(stats.todaySales || 0)}
                </h3>
                <p className={`text-sm ${theme.textSecondary}`}>Today's Sales ({stats.todaySalesCount || 0})</p>
              </div>

              {/* Today's Payments */}
              <div className={`${theme.cardBg} rounded-xl shadow-lg p-6 border ${theme.border}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <CreditCard className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                </div>
                <h3 className={`text-2xl font-bold ${theme.text} mb-1`}>
                  {formatCurrency(stats.todayPayments || 0)}
                </h3>
                <p className={`text-sm ${theme.textSecondary}`}>Payments Received</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className={`${theme.cardBg} rounded-xl shadow-lg p-6 border ${theme.border}`}>
              <h3 className={`text-xl font-bold ${theme.text} mb-4`}>Recent Activity</h3>
              <div className="space-y-3">
                {stats.recentActivity && stats.recentActivity.length > 0 ? (
                  stats.recentActivity.map((activity, index) => (
                    <div key={index} className={`flex items-start gap-3 p-3 rounded-lg ${theme.bgSecondary}`}>
                      <div className="flex-1">
                        <p className={`${theme.text} font-medium`}>{activity.description}</p>
                        <p className={`text-sm ${theme.textSecondary}`}>{activity.time}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className={`text-center py-8 ${theme.textSecondary}`}>
                    No recent activity
                  </p>
                )}
              </div>
            </div>

            {/* Low Stock Alert */}
            {stats.lowStockItems && stats.lowStockItems.length > 0 && (
              <div className={`${theme.cardBg} rounded-xl shadow-lg p-6 border ${theme.border} border-orange-500`}>
                <h3 className={`text-xl font-bold ${theme.text} mb-4 flex items-center gap-2`}>
                  <Package className="text-orange-600" size={24} />
                  Low Stock Alert
                </h3>
                <div className="space-y-3">
                  {stats.lowStockItems.map((product, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${theme.bgSecondary}`}>
                      <div>
                        <p className={`font-medium ${theme.text}`}>{product.name}</p>
                        <p className={`text-sm ${theme.textSecondary}`}>SKU: {product.sku || 'N/A'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-orange-600 font-bold">{product.stock_quantity} left</p>
                        <p className={`text-sm ${theme.textSecondary}`}>Min: {product.reorder_level || 5}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                onClick={() => navigate("/customers")}
                className="p-6 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg transition-all hover:scale-105"
              >
                <Users size={32} className="mb-2" />
                <h4 className="text-lg font-bold">Manage Customers</h4>
                <p className="text-sm opacity-90 mt-1">View and add customers</p>
              </button>

              <button
                onClick={() => navigate("/inventory")}
                className="p-6 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg transition-all hover:scale-105"
              >
                <Package size={32} className="mb-2" />
                <h4 className="text-lg font-bold">Check Inventory</h4>
                <p className="text-sm opacity-90 mt-1">View stock levels</p>
              </button>

              <button
                onClick={() => navigate("/sales")}
                className="p-6 rounded-xl bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg transition-all hover:scale-105"
              >
                <ShoppingCart size={32} className="mb-2" />
                <h4 className="text-lg font-bold">Create Sale</h4>
                <p className="text-sm opacity-90 mt-1">Process new transaction</p>
              </button>

              <button
                onClick={() => navigate("/payments")}
                className="p-6 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg transition-all hover:scale-105"
              >
                <CreditCard size={32} className="mb-2" />
                <h4 className="text-lg font-bold">View Payments</h4>
                <p className="text-sm opacity-90 mt-1">Track received payments</p>
              </button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default UserDashboard;
