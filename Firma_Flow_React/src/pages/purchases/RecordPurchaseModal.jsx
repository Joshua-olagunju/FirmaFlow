import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import { buildApiUrl } from "../../config/api.config";

const RecordPurchaseModal = ({ isOpen, onClose, onSuccess, purchase }) => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const isEditMode = !!purchase;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [referenceNumber, setReferenceNumber] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [purchaseDate, setPurchaseDate] = useState("");
  const [taxRateId, setTaxRateId] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("cash");

  // Data from API
  const [suppliers, setSuppliers] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [products, setProducts] = useState([]);

  // Purchase items
  const [items, setItems] = useState([
    {
      item_type: "existing",
      product_id: "",
      description: "",
      quantity: 1,
      unit: "Pieces",
      unit_cost: 0,
      total: 0,
      // For new product creation
      new_product_name: "",
      new_product_sku: "",
      new_product_selling_price: 0,
    },
  ]);

  // Payment methods
  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cheque", label: "Cheque" },
    { value: "card", label: "Credit Card" },
  ];

  // Item types
  const itemTypes = [
    { value: "existing", label: "Existing Product" },
    { value: "new", label: "Create New Product" },
    { value: "expense", label: "One-time Expense" },
  ];

  // Unit options
  const unitOptions = [
    { value: "Pieces", label: "Pieces" },
    { value: "Kilograms", label: "Kilograms" },
    { value: "Pounds", label: "Pounds" },
    { value: "Liters", label: "Liters" },
    { value: "Meters", label: "Meters" },
    { value: "Boxes", label: "Boxes" },
    { value: "Cartons", label: "Cartons" },
  ];

  // Fetch initial data
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && purchase) {
        // Load purchase data for editing
        loadPurchaseData();
      } else {
        // New purchase - set defaults
        setPurchaseDateToToday();
        generateReferenceNumber();
        setItems([
          {
            item_type: "existing",
            product_id: "",
            description: "",
            quantity: 1,
            unit: "Pieces",
            unit_cost: 0,
            total: 0,
            new_product_name: "",
            new_product_sku: "",
            new_product_selling_price: 0,
          },
        ]);
      }
      fetchSuppliersAndTaxes();
      fetchProducts();
    }
  }, [isOpen, purchase]);

  const fetchProducts = async () => {
    try {
      const response = await fetch(buildApiUrl("api/products.php"), {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.data) {
        setProducts(data.data);
      } else if (Array.isArray(data)) {
        setProducts(data);
      }
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const loadPurchaseData = async () => {
    if (!purchase?.id) return;

    try {
      const response = await fetch(
        buildApiUrl(`api/purchases.php?id=${purchase.id}`),
        {
          method: "GET",
          credentials: "include",
        }
      );
      const data = await response.json();

      if (response.ok && data) {
        setReferenceNumber(data.reference || data.reference_number || "");
        setSupplierId(data.supplier_id || "");
        setPurchaseDate(data.bill_date || "");
        setTaxRateId(data.tax_rate_id || "");
        setPaymentMethod(data.payment_method || "cash");

        // Load items with proper unit field
        if (data.lines && data.lines.length > 0) {
          const loadedItems = data.lines.map((line) => ({
            item_type: line.product_id ? "existing" : "expense",
            product_id: line.product_id || "",
            description: line.description || "",
            quantity: parseFloat(line.quantity) || 1,
            unit: line.unit || "Pieces", // Load unit from database
            unit_cost: parseFloat(line.unit_cost) || 0,
            total:
              (parseFloat(line.quantity) || 1) *
              (parseFloat(line.unit_cost) || 0),
            new_product_name: "",
            new_product_sku: "",
            new_product_selling_price: 0,
          }));
          setItems(loadedItems);
        }
      }
    } catch (err) {
      console.error("Error loading purchase data:", err);
      setError("Failed to load purchase data");
    }
  };

  const fetchSuppliersAndTaxes = async () => {
    try {
      // Fetch suppliers
      const suppliersRes = await fetch(buildApiUrl("api/suppliers.php"), {
        method: "GET",
        credentials: "include",
      });
      const suppliersData = await suppliersRes.json();
      if (suppliersData.success) {
        setSuppliers(suppliersData.data || []);
      } else if (Array.isArray(suppliersData)) {
        setSuppliers(suppliersData);
      }

      // Fetch taxes from accounting_settings
      try {
        const taxesRes = await fetch(
          buildApiUrl("api/accounting_settings.php?type=taxes"),
          {
            method: "GET",
            credentials: "include",
          }
        );
        const taxesData = await taxesRes.json();
        if (taxesData.success) {
          setTaxes(taxesData.data || []);
        }
      } catch {
        // Silently fail for taxes
      }
    } catch (err) {
      console.error("Error fetching suppliers:", err);
    }
  };

  const generateReferenceNumber = async () => {
    try {
      const response = await fetch(buildApiUrl("api/purchase_numbers.php"), {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.next_number) {
        setReferenceNumber(data.next_number);
      } else if (data.success && data.purchase_number) {
        setReferenceNumber(data.purchase_number);
      } else {
        // Fallback
        const randomNum = Math.floor(Math.random() * 1000000)
          .toString()
          .padStart(6, "0");
        setReferenceNumber(`PUR${randomNum}`);
      }
    } catch {
      const randomNum = Math.floor(Math.random() * 1000000)
        .toString()
        .padStart(6, "0");
      setReferenceNumber(`PUR${randomNum}`);
    }
  };

  const setPurchaseDateToToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setPurchaseDate(today);
  };

  const handleTaxChange = (taxId) => {
    setTaxRateId(taxId);
    const selectedTax = taxes.find((t) => t.id === parseInt(taxId));
    if (selectedTax) {
      setTaxRate(parseFloat(selectedTax.rate) || 0);
    } else {
      setTaxRate(0);
    }
  };

  // Auto-generate SKU in format: TOP-QOM (3 chars - 3 chars from name)
  const generateSKU = (name) => {
    if (!name) return "";

    // Remove special chars and split into words
    const words = name
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, "")
      .split(" ")
      .filter((w) => w.length > 0);

    if (words.length === 0) return "";

    // Get first 3 characters from first word
    const firstPart = words[0].substring(0, 3).padEnd(3, "X");

    // Get first 3 characters from second word (or use part of first word)
    let secondPart;
    if (words.length > 1) {
      secondPart = words[1].substring(0, 3).padEnd(3, "X");
    } else {
      // Use remaining chars from first word or repeat
      secondPart = words[0].substring(3, 6).padEnd(3, words[0].charAt(0));
    }

    return `${firstPart}-${secondPart}`;
  };

  // Item handlers
  const addItem = () => {
    setItems([
      ...items,
      {
        item_type: "existing",
        product_id: "",
        description: "",
        quantity: 1,
        unit: "Pieces",
        unit_cost: 0,
        total: 0,
        new_product_name: "",
        new_product_sku: "",
        new_product_selling_price: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleItemTypeChange = (index, itemType) => {
    const newItems = [...items];
    newItems[index] = {
      ...newItems[index],
      item_type: itemType,
      product_id: "",
      description: "",
      new_product_name: "",
      new_product_sku: "",
      new_product_selling_price: 0,
    };

    // Keep quantity and unit_cost if switching types
    setItems(newItems);
  };

  const handleProductSelect = (index, productId) => {
    const newItems = [...items];
    const selectedProduct = products.find((p) => p.id === parseInt(productId));

    if (selectedProduct) {
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        description: selectedProduct.name,
        unit_cost: parseFloat(
          selectedProduct.cost_price || selectedProduct.selling_price || 0
        ),
      };

      // Recalculate total
      const qty = parseFloat(newItems[index].quantity) || 0;
      const cost = parseFloat(newItems[index].unit_cost) || 0;
      newItems[index].total = qty * cost;
    }

    setItems(newItems);
  };

  const updateItem = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;

    // Auto-generate SKU when new_product_name changes
    if (field === "new_product_name") {
      newItems[index].new_product_sku = generateSKU(value);
    }

    // Recalculate total if quantity or unit_cost changes
    if (field === "quantity" || field === "unit_cost") {
      const qty = parseFloat(newItems[index].quantity) || 0;
      const cost = parseFloat(newItems[index].unit_cost) || 0;
      newItems[index].total = qty * cost;
    }

    setItems(newItems);
  };

  // Check if item has valid data based on its type
  const isItemValid = (item) => {
    if (item.item_type === "existing") {
      return item.product_id && item.quantity > 0;
    } else if (item.item_type === "new") {
      return item.new_product_name && item.quantity > 0 && item.unit_cost > 0;
    } else if (item.item_type === "expense") {
      return item.description && item.quantity > 0 && item.unit_cost > 0;
    }
    return false;
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.total || 0), 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const total = subtotal + taxAmount;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!supplierId) {
      setError("Please select a supplier");
      return;
    }

    // Validate items based on their type
    const hasValidItem = items.some((item) => isItemValid(item));
    if (!hasValidItem) {
      setError("Please add at least one valid item with all required fields");
      return;
    }

    setIsLoading(true);

    try {
      const purchaseData = {
        supplier_id: supplierId,
        bill_date: purchaseDate,
        due_date: purchaseDate,
        tax_rate_id: taxRateId,
        payment_method: paymentMethod,
        items: items
          .filter((item) => isItemValid(item))
          .map((item) => ({
            item_type: item.item_type,
            product_id: item.product_id,
            description:
              item.item_type === "new"
                ? item.new_product_name
                : item.description,
            quantity: item.quantity,
            unit: item.unit || "Pieces",
            unit_cost: item.unit_cost,
            tax_rate: taxRate,
            ...(item.item_type === "new" && {
              new_product_name: item.new_product_name,
              new_product_sku: item.new_product_sku,
              new_product_selling_price:
                item.new_product_selling_price || item.unit_cost * 1.3,
            }),
          })),
      };

      if (isEditMode) {
        purchaseData.id = purchase.id;
      }

      const response = await fetch(buildApiUrl("api/purchases.php"), {
        method: isEditMode ? "PUT" : "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(purchaseData),
      });

      const data = await response.json();

      if (response.ok && (data.success || data.id)) {
        onSuccess?.();
        onClose();
      } else {
        setError(data.error || data.message || "Failed to record purchase");
      }
    } catch (err) {
      console.error("Error recording purchase:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-4xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">
            {isEditMode ? "Edit Purchase" : "Record Purchase"}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-full p-1 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* First Row: Reference, Supplier, Date, Tax */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Reference Number */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Reference #
              </label>
              <div
                className={`px-4 py-2.5 border ${theme.borderPrimary} rounded-lg ${theme.bgAccent} ${theme.textSecondary} font-mono`}
              >
                {referenceNumber || "Generating..."}
              </div>
            </div>

            {/* Supplier */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Supplier <span className="text-red-500">*</span>
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
              >
                <option value="">Select Supplier</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Purchase Date */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
              />
            </div>

            {/* Tax Rate */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Tax Rate
              </label>
              <select
                value={taxRateId}
                onChange={(e) => handleTaxChange(e.target.value)}
                className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
              >
                <option value="">No Tax</option>
                {taxes.map((tax) => (
                  <option key={tax.id} value={tax.id}>
                    {tax.name} ({tax.rate}%)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className={`w-full md:w-1/4 px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
            >
              {paymentMethods.map((method) => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <h3 className={`text-sm font-semibold ${theme.textPrimary}`}>
              Items
            </h3>

            {/* Items Table Header */}
            <div
              className={`hidden md:grid grid-cols-12 gap-2 px-4 py-2 ${theme.bgAccent} rounded-lg text-sm font-medium ${theme.textSecondary}`}
            >
              <div className="col-span-2">Item Type</div>
              <div className="col-span-4">Product/Description</div>
              <div className="col-span-2">Quantity</div>
              <div className="col-span-2">Unit Cost</div>
              <div className="col-span-1">Total</div>
              <div className="col-span-1">Action</div>
            </div>

            {/* Items List */}
            {items.map((item, index) => (
              <div
                key={index}
                className={`p-4 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} space-y-3`}
              >
                {/* First Row: Item Type and Product/Description */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                  {/* Item Type */}
                  <div className="md:col-span-2">
                    <label
                      className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
                    >
                      Item Type
                    </label>
                    <select
                      value={item.item_type}
                      onChange={(e) =>
                        handleItemTypeChange(index, e.target.value)
                      }
                      className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgCard} ${theme.textPrimary} text-sm focus:ring-2 focus:ring-[#667eea]`}
                    >
                      {itemTypes.map((type) => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Product/Description - Dynamic based on item type */}
                  <div className="md:col-span-4">
                    <label
                      className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
                    >
                      {item.item_type === "existing"
                        ? "Select Product"
                        : item.item_type === "new"
                        ? "New Product Name"
                        : "Expense Description"}
                    </label>

                    {item.item_type === "existing" ? (
                      <select
                        value={item.product_id}
                        onChange={(e) =>
                          handleProductSelect(index, e.target.value)
                        }
                        className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgCard} ${theme.textPrimary} text-sm focus:ring-2 focus:ring-[#667eea]`}
                      >
                        <option value="">Select a product...</option>
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}{" "}
                            {product.sku ? `(${product.sku})` : ""}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={
                          item.item_type === "new"
                            ? item.new_product_name
                            : item.description
                        }
                        onChange={(e) =>
                          item.item_type === "new"
                            ? updateItem(
                                index,
                                "new_product_name",
                                e.target.value
                              )
                            : updateItem(index, "description", e.target.value)
                        }
                        placeholder={
                          item.item_type === "new"
                            ? "Enter product name"
                            : "Enter expense description"
                        }
                        className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgCard} ${theme.textPrimary} text-sm focus:ring-2 focus:ring-[#667eea]`}
                      />
                    )}
                  </div>

                  {/* Quantity */}
                  <div className="md:col-span-2">
                    <label
                      className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity === 0 ? "" : item.quantity}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === "") {
                          updateItem(index, "quantity", "");
                        } else {
                          const numValue = parseInt(value);
                          updateItem(
                            index,
                            "quantity",
                            isNaN(numValue) ? "" : numValue
                          );
                        }
                      }}
                      onBlur={(e) => {
                        // Ensure minimum value on blur
                        const value = e.target.value;
                        if (value === "" || parseInt(value) < 1) {
                          updateItem(index, "quantity", 1);
                        }
                      }}
                      className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgCard} ${theme.textPrimary} text-sm focus:ring-2 focus:ring-[#667eea]`}
                    />
                  </div>

                  {/* Unit */}
                  <div className="md:col-span-2">
                    <label
                      className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
                    >
                      Unit
                    </label>
                    {isEditMode &&
                    item.item_type === "existing" &&
                    item.product_id ? (
                      <div
                        className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgAccent} ${theme.textSecondary} text-sm font-medium`}
                        title="Unit cannot be changed when editing existing products"
                      >
                        {item.unit}
                      </div>
                    ) : (
                      <select
                        value={item.unit}
                        onChange={(e) =>
                          updateItem(index, "unit", e.target.value)
                        }
                        className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgCard} ${theme.textPrimary} text-sm focus:ring-2 focus:ring-[#667eea]`}
                      >
                        {unitOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Unit Cost */}
                  <div className="md:col-span-2">
                    <label
                      className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
                    >
                      Unit Cost
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={item.unit_cost}
                      onChange={(e) =>
                        updateItem(
                          index,
                          "unit_cost",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgCard} ${theme.textPrimary} text-sm focus:ring-2 focus:ring-[#667eea]`}
                    />
                  </div>

                  {/* Total */}
                  <div className="md:col-span-1">
                    <label
                      className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
                    >
                      Total
                    </label>
                    <div
                      className={`px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgAccent} ${theme.textPrimary} text-sm font-semibold`}
                    >
                      {formatCurrency(item.total)}
                    </div>
                  </div>

                  {/* Action */}
                  <div className="md:col-span-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                      className={`p-2 rounded-lg transition ${
                        items.length === 1
                          ? "text-gray-300 cursor-not-allowed"
                          : "text-red-500 hover:bg-red-50"
                      }`}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Additional fields for Create New Product */}
                {item.item_type === "new" && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-dashed border-slate-200">
                    <div>
                      <label
                        className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
                      >
                        SKU (Auto-generated)
                      </label>
                      <div
                        className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgAccent} ${theme.textSecondary} text-sm font-mono`}
                      >
                        {item.new_product_sku || "Enter product name..."}
                      </div>
                    </div>
                    <div>
                      <label
                        className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
                      >
                        Selling Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.new_product_selling_price}
                        onChange={(e) =>
                          updateItem(
                            index,
                            "new_product_selling_price",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        placeholder="0.00"
                        className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgCard} ${theme.textPrimary} text-sm focus:ring-2 focus:ring-[#667eea]`}
                      />
                    </div>
                    <div className="flex items-end">
                      <p className={`text-xs ${theme.textSecondary} italic`}>
                        This product will be added to your inventory
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Add Item Button */}
            <button
              type="button"
              onClick={addItem}
              className={`flex items-center gap-2 px-4 py-2 border-2 border-dashed ${theme.borderSecondary} rounded-lg ${theme.textSecondary} hover:border-[#667eea] hover:text-[#667eea] transition`}
            >
              <Plus size={18} />
              Add Item
            </button>
          </div>

          {/* Totals Section */}
          <div className="flex justify-end">
            <div
              className={`w-full md:w-80 ${
                theme.mode === "light" ? "bg-slate-50" : "bg-slate-700/30"
              } rounded-lg p-4 space-y-3 border ${theme.borderPrimary}`}
            >
              {/* Subtotal */}
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${theme.textSecondary}`}>
                  Subtotal:
                </span>
                <span className={`text-sm font-semibold ${theme.textPrimary}`}>
                  {formatCurrency(subtotal)}
                </span>
              </div>

              {/* Tax */}
              <div className="flex justify-between items-center">
                <span className={`text-sm font-medium ${theme.textSecondary}`}>
                  Tax ({taxRate}%):
                </span>
                <span className={`text-sm font-semibold ${theme.textPrimary}`}>
                  {formatCurrency(taxAmount)}
                </span>
              </div>

              {/* Total */}
              <div
                className={`flex justify-between items-center pt-3 border-t ${theme.borderSecondary}`}
              >
                <span className={`text-base font-bold ${theme.textPrimary}`}>
                  Total:
                </span>
                <span className="text-lg font-bold text-[#667eea]">
                  {formatCurrency(total)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 ${theme.bgCard} border ${theme.borderPrimary} rounded-lg ${theme.textPrimary} hover:bg-slate-100 transition font-medium`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg hover:opacity-90 transition font-medium shadow-lg ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading
                ? isEditMode
                  ? "Updating..."
                  : "Recording..."
                : isEditMode
                ? "Update Purchase"
                : "Record Purchase"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RecordPurchaseModal;
