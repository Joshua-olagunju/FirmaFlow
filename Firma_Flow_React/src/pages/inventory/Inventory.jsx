import { useState, useEffect, useRef } from "react";
import Layout from "../../components/Layout";
import {
  Search,
  Plus,
  Package,
  TrendingUp,
  Menu,
  Settings,
  FileText,
} from "lucide-react";
import ProductTable from "./ProductTable";
import AddProductModal from "./AddProductModal";
import EditProductModal from "./EditProductModal";
import { buildApiUrl } from "../../config/api.config";
import { useTheme } from "../../contexts/ThemeContext";
import { useNavigate } from "react-router-dom";

const Inventory = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const openSidebarRef = useRef(null);

  // Fetch products from API on component mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      setError("");
      try {
        const filter = activeTab === "all" ? "" : `&filter=${activeTab}`;
        const response = await fetch(
          buildApiUrl(`api/products.php?search=${searchQuery}${filter}`),
          {
            method: "GET",
            credentials: "include",
          }
        );

        const data = await response.json();

        if (response.ok && data.success) {
          // Map API fields to match frontend field names
          const mappedProducts = data.data.map((product) => ({
            id: product.id,
            sku: product.sku,
            name: product.name,
            description: product.description || "",
            unit: product.unit || "Pieces",
            costPrice: parseFloat(product.cost_price) || 0,
            sellingPrice: parseFloat(product.selling_price) || 0,
            stockQuantity: parseInt(product.stock_quantity) || 0,
            reorderLevel: parseInt(product.reorder_level) || 0,
            trackInventory: product.track_inventory == 1,
            isActive: product.is_active == 1,
            status: product.is_active == 1 ? "Active" : "Inactive",
          }));
          setProducts(mappedProducts);
        } else {
          setError(data.error || "Failed to fetch products");
        }
      } catch (err) {
        console.error("Error fetching products:", err);
        setError("Network error. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [activeTab, searchQuery]);

  // Manual refresh function
  const refreshProducts = async () => {
    setIsLoading(true);
    setError("");
    try {
      const filter = activeTab === "all" ? "" : `&filter=${activeTab}`;
      const response = await fetch(
        buildApiUrl(`api/products.php?search=${searchQuery}${filter}`),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const mappedProducts = data.data.map((product) => ({
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description || "",
          unit: product.unit || "Pieces",
          costPrice: parseFloat(product.cost_price) || 0,
          sellingPrice: parseFloat(product.selling_price) || 0,
          stockQuantity: parseInt(product.stock_quantity) || 0,
          reorderLevel: parseInt(product.reorder_level) || 0,
          trackInventory: product.track_inventory == 1,
          isActive: product.is_active == 1,
          status: product.is_active == 1 ? "Active" : "Inactive",
        }));
        setProducts(mappedProducts);
      } else {
        setError(data.error || "Failed to fetch products");
      }
    } catch (err) {
      console.error("Error fetching products:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProduct = async (productData) => {
    try {
      const response = await fetch(buildApiUrl("api/products.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          sku: productData.sku,
          name: productData.name,
          description: productData.description,
          unit: productData.unit,
          cost_price: productData.costPrice,
          selling_price: productData.sellingPrice,
          stock_quantity: productData.stockQuantity,
          reorder_level: productData.reorderLevel,
          track_inventory: productData.trackInventory ? 1 : 0,
          is_active: productData.isActive ? 1 : 0,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        await refreshProducts();
        return true;
      } else {
        alert(data.error || "Failed to add product");
        return false;
      }
    } catch (err) {
      console.error("Error adding product:", err);
      alert("Network error. Please try again.");
      return false;
    }
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsEditModalOpen(true);
  };

  const handleUpdateProduct = async (productData) => {
    try {
      const response = await fetch(
        buildApiUrl(`api/products.php?id=${selectedProduct.id}`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            sku: productData.sku,
            name: productData.name,
            description: productData.description,
            unit: productData.unit,
            cost_price: productData.costPrice,
            selling_price: productData.sellingPrice,
            stock_quantity: productData.stockQuantity,
            reorder_level: productData.reorderLevel,
            track_inventory: productData.trackInventory ? 1 : 0,
            is_active: productData.isActive ? 1 : 0,
          }),
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await refreshProducts();
        return true;
      } else {
        alert(data.error || "Failed to update product");
        return false;
      }
    } catch (err) {
      console.error("Error updating product:", err);
      alert("Network error. Please try again.");
      return false;
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(
        buildApiUrl(`api/products.php?id=${productId}`),
        {
          method: "DELETE",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        await refreshProducts();
      } else {
        alert(data.error || "Failed to delete product");
      }
    } catch (err) {
      console.error("Error deleting product:", err);
      alert("Network error. Please try again.");
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description &&
        product.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "instock" &&
        product.stockQuantity > product.reorderLevel) ||
      (activeTab === "lowstock" &&
        product.stockQuantity > 0 &&
        product.stockQuantity <= product.reorderLevel) ||
      (activeTab === "outofstock" && product.stockQuantity === 0);

    return matchesSearch && matchesTab;
  });

  return (
    <Layout onMenuClick={(fn) => (openSidebarRef.current = fn)}>
      <div className="w-full md:flex flex-col flex-1 items-center justify-center gap-8">
        {/* Page Header */}
        <div className="w-full flex justify-between items-start rounded-b-lg align-top p-4 bg-gradient-to-br from-[#667eea] to-[#764ba2] mt-0">
          {/* Left Side - Title */}
          <div className="flex-col items-center flex-1">
            <h1 className="text-white font-bold text-2xl md:text-3xl">
              Inventory
            </h1>
            <p className="m-0 text-sm md:text-normal font-500 text-slate-200">
              Manage your product inventory and stock levels
            </p>
          </div>

          {/* Right Side - Hamburger Menu (Mobile Only) */}
          <button
            onClick={() => openSidebarRef.current?.()}
            className="md:hidden p-2 hover:bg-white/10 rounded-lg transition flex-shrink-0"
          >
            <Menu size={24} className="text-white" />
          </button>
        </div>

        {/* Top Row: Currency + Counts + Add Product Button */}
        <div className="flex justify-between items-center flex-wrap gap-4 mb-6 mt-4 w-full">
          <div className="flex items-center gap-3">
            <span
              className={`text-sm ${theme.bgAccent} ${theme.textPrimary} px-4 py-2 rounded-lg font-medium border ${theme.borderSecondary}`}
            >
              Currency: NGN
            </span>

            <span className="flex items-center gap-2 text-sm bg-green-100 text-green-700 px-4 py-2 rounded-lg font-medium border border-green-200">
              <Package size={16} />
              {products.length} product{products.length !== 1 ? "s" : ""}
            </span>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-10 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
          >
            <Plus size={18} />
            Add Product
          </button>
        </div>

        {/* Inventory Management Container */}
        <div
          className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6 mr-2 w-full mb-6`}
        >
          <h2 className={`text-2xl font-semibold ${theme.textPrimary} mb-6`}>
            Inventory Management
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => navigate("/inventory-settings")}
              className={`flex items-center justify-center gap-3 px-6 py-4 ${theme.bgAccent} ${theme.textPrimary} rounded-lg border ${theme.borderSecondary} ${theme.bgHover} transition font-medium`}
            >
              <Settings size={20} />
              Inventory Settings
            </button>

            <button
              onClick={() => navigate("/inventory-reports")}
              className={`flex items-center justify-center gap-3 px-6 py-4 ${theme.bgAccent} ${theme.textPrimary} rounded-lg border ${theme.borderSecondary} ${theme.bgHover} transition font-medium`}
            >
              <FileText size={20} />
              Inventory Reports
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          className={`flex w-full gap-4 border-b ${theme.borderSecondary} mb-6`}
        >
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "all"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : `${theme.textSecondary} hover:text-[#667eea]`
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => setActiveTab("in_stock")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "in_stock"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : `${theme.textSecondary} hover:text-[#667eea]`
            }`}
          >
            In Stock
          </button>
          <button
            onClick={() => setActiveTab("low_stock")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "low_stock"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : `${theme.textSecondary} hover:text-[#667eea]`
            }`}
          >
            Low Stock
          </button>
          <button
            onClick={() => setActiveTab("out_of_stock")}
            className={`pb-3 px-4 font-medium transition-all ${
              activeTab === "out_of_stock"
                ? "border-b-2 border-[#667eea] text-[#667eea]"
                : `${theme.textSecondary} hover:text-[#667eea]`
            }`}
          >
            Out of Stock
          </button>
        </div>

        {/* Product Directory Section */}
        <div
          className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6 mr-2 w-full`}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className={`text-2xl font-semibold ${theme.textPrimary}`}>
              Product Directory
            </h2>
            <div
              className={`flex items-center gap-2 text-sm ${theme.textTertiary}`}
            >
              <TrendingUp size={16} />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <Search
              className={`absolute left-4 top-1/2 transform -translate-y-1/2 ${theme.textTertiary}`}
              size={20}
            />
            <input
              type="text"
              placeholder="Search products by name, SKU, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${theme.bgInput} ${theme.textPrimary} border ${theme.borderSecondary} rounded-lg pl-12 pr-4 py-3 focus:outline-none focus:ring-2 ${theme.ring} focus:border-transparent transition`}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#667eea]"></div>
              <p className={`mt-2 ${theme.textSecondary}`}>
                Loading products...
              </p>
            </div>
          )}

          {/* Product Table or Empty State */}
          {!isLoading && filteredProducts.length > 0 ? (
            <ProductTable
              products={filteredProducts}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
            />
          ) : products.length === 0 ? (
            /* Empty State */
            <div
              className={`text-center py-16 ${theme.bgAccent} rounded-lg border-1 ${theme.borderSecondary}`}
            >
              <div className="w-20 h-20 bg-gradient-to-br from-[#667eea] to-[#764ba2] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Package size={40} className="text-white" />
              </div>

              <p className={`${theme.textPrimary} text-xl font-semibold mb-2`}>
                No products yet
              </p>
              <p className={`${theme.textSecondary} mb-6 max-w-md mx-auto`}>
                Start building your product catalog by adding your first
                product. Track inventory, manage stock levels, and streamline
                your operations.
              </p>

              <button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2 mx-auto px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition"
              >
                <Plus size={18} />
                Add First Product
              </button>
            </div>
          ) : (
            /* No Search Results */
            <div className="text-center py-16">
              <p className={`${theme.textSecondary} text-lg`}>
                No products match your search criteria
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddProduct}
      />

      <EditProductModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleUpdateProduct}
        product={selectedProduct}
      />
    </Layout>
  );
};

export default Inventory;
