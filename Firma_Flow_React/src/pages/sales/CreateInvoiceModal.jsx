import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { buildApiUrl } from "../../config/api.config";
import InvoiceItems from "./InvoiceItems";
import InvoiceTotals from "./InvoiceTotals";

const CreateInvoiceModal = ({ isOpen, onClose, onSuccess }) => {
  const { theme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [invoiceDate, setInvoiceDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxId, setTaxId] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [notes, setNotes] = useState("");
  const [selectedTags, setSelectedTags] = useState("");
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);

  // Data from API
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);

  // Invoice items
  const [items, setItems] = useState([
    {
      product_id: "", // Empty string for unselected, will be integer when selected
      product_name: "",
      quantity: 1,
      unit_price: 0,
      total: 0,
      available_qty: 0,
    },
  ]);

  // Fetch initial data
  useEffect(() => {
    if (isOpen) {
      console.log("Modal opened - fetching data");
      setInvoiceDateToToday();
      setDueDateTo30Days();
      generateInvoiceNumber();
      // Only fetch data that's absolutely needed
      fetchCustomersAndProducts();
    } else {
      // Reset state when modal closes
      console.log("Modal closed - resetting state");
      setProducts([]);
      setCustomers([]);
      setItems([{
        product_id: "",
        product_name: "",
        quantity: 1,
        unit_price: 0,
        total: 0,
        available_qty: 0,
      }]);
    }
  }, [isOpen]);

  const fetchCustomersAndProducts = async () => {
    try {
      // Fetch customers
      const customersRes = await fetch(buildApiUrl("api/customers.php"), {
        method: "GET",
        credentials: "include",
      });
      const customersData = await customersRes.json();
      console.log("Customers response:", customersData);
      if (customersData.success) {
        setCustomers(customersData.data || []);
      }

      // Fetch products
      const productsRes = await fetch(buildApiUrl("api/products.php"), {
        method: "GET",
        credentials: "include",
      });
      const productsData = await productsRes.json();
      console.log("Products response:", productsData);
      console.log("Products response status:", productsRes.status);
      console.log("Products data structure:", {
        success: productsData.success,
        dataLength: productsData.data?.length,
        firstProduct: productsData.data?.[0]
      });
      
      if (productsData.success) {
        console.log("Setting products:", productsData.data?.length || 0, "items");
        console.log("Product IDs:", productsData.data?.map(p => p.id));
        setProducts(productsData.data || []);
      } else {
        console.error("Products fetch failed:", productsData);
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

      // Fetch tags from settings
      try {
        const tagsRes = await fetch(buildApiUrl("api/settings.php?type=tags"), {
          method: "GET",
          credentials: "include",
        });
        const tagsData = await tagsRes.json();
        if (tagsData.success) {
          setAvailableTags(tagsData.data || []);
        }
      } catch {
        // Silently fail for tags
      }
    } catch (err) {
      console.error("Error fetching customers/products:", err);
    }
  };

  const generateInvoiceNumber = async () => {
    try {
      // Fetch the next invoice number from backend
      const response = await fetch(buildApiUrl("api/invoice_numbers.php"), {
        method: "GET",
        credentials: "include",
      });
      const data = await response.json();
      if (data.success && data.next_number) {
        setInvoiceNumber(data.next_number);
      } else {
        // Fallback: generate invoice number based on current year
        const year = new Date().getFullYear();
        const randomNum = Math.floor(Math.random() * 10000)
          .toString()
          .padStart(4, "0");
        setInvoiceNumber(`INV-${year}-${randomNum}`);
      }
    } catch {
      // Silently use fallback
      const year = new Date().getFullYear();
      const randomNum = Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0");
      setInvoiceNumber(`INV-${year}-${randomNum}`);
    }
  };

  const setInvoiceDateToToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setInvoiceDate(today);
  };

  const setDueDateTo30Days = () => {
    const today = new Date();
    const dueDate = new Date(today.setDate(today.getDate() + 30));
    setDueDate(dueDate.toISOString().split("T")[0]);
  };

  const handleTaxChange = (taxId) => {
    setTaxId(taxId);
    const selectedTax = taxes.find((t) => t.id === parseInt(taxId));
    if (selectedTax) {
      setTaxRate(selectedTax.rate);
    } else {
      setTaxRate(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!customerId) {
      setError("Please select a customer");
      return;
    }

    if (items.length === 0 || !items[0].product_id) {
      setError("Please add at least one item to the invoice");
      return;
    }

    setIsLoading(true);

    try {
      console.log("Submitting invoice with items:", items);
      
      const response = await fetch(buildApiUrl("api/sales.php"), {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoice_number: invoiceNumber,
          customer_id: customerId,
          invoice_date: invoiceDate,
          due_date: dueDate,
          tax_id: taxId,
          tax_rate: taxRate,
          notes: notes,
          tags: selectedTags,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
          })),
          discount: discount,
          shipping: shipping,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();
      console.log("Response data:", data);

      // Check if invoice was created successfully
      // Handle both formats: {success: true, data: {...}} or direct invoice object with id
      if (response.ok && (data.success || data.id)) {
        onSuccess();
        onClose();
      } else {
        const errorMsg =
          data.message || data.error || "Failed to create invoice";
        console.error("Invoice creation failed:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Error creating invoice:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-5xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">Create New Invoice</h2>
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

          {/* Invoice Info Banner */}
          <div
            className={`${
              theme.mode === "light"
                ? "bg-gradient-to-r from-blue-50 to-indigo-50"
                : "bg-slate-700/50"
            } border ${theme.borderPrimary} rounded-lg p-4`}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className={`text-xs ${theme.textSecondary} mb-1`}>
                  Invoice Number
                </p>
                <p className={`text-lg font-bold ${theme.textPrimary}`}>
                  {invoiceNumber || "Loading..."}
                </p>
              </div>
              <div>
                <p className={`text-xs ${theme.textSecondary} mb-1`}>
                  Invoice Date
                </p>
                <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                  {invoiceDate
                    ? new Date(invoiceDate).toLocaleDateString()
                    : "Loading..."}
                </p>
              </div>
              <div>
                <p className={`text-xs ${theme.textSecondary} mb-1`}>
                  Due Date (30 days)
                </p>
                <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                  {dueDate
                    ? new Date(dueDate).toLocaleDateString()
                    : "Loading..."}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Selection */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Customer <span className="text-red-500">*</span>
            </label>
            <select
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              required
              className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
            >
              <option value="">Select Customer</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
            <p className={`text-xs ${theme.textSecondary} mt-1`}>
              Select the customer for this invoice
            </p>
          </div>

          {/* Tax Selection */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Tax
            </label>
            <select
              value={taxId}
              onChange={(e) => handleTaxChange(e.target.value)}
              className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
            >
              <option value="">Select Tax (Optional)</option>
              {taxes.map((tax) => (
                <option key={tax.id} value={tax.id}>
                  {tax.name} ({tax.rate}%)
                </option>
              ))}
            </select>
          </div>

          {/* Tags Selection */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Tag
            </label>
            <select
              value={selectedTags}
              onChange={(e) => setSelectedTags(e.target.value)}
              className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
            >
              <option value="">Select Tag (Optional)</option>
              {availableTags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
            {selectedTags &&
              availableTags.find((t) => t.id === parseInt(selectedTags)) && (
                <div className="mt-2 flex items-center gap-2">
                  <span
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{
                      backgroundColor:
                        availableTags.find(
                          (t) => t.id === parseInt(selectedTags)
                        )?.color || "#667eea",
                    }}
                  >
                    {
                      availableTags.find((t) => t.id === parseInt(selectedTags))
                        ?.name
                    }
                  </span>
                </div>
              )}
          </div>

          {/* Additional Notes */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional notes or instructions..."
              className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent resize-none`}
            />
          </div>

          {/* Accounting Flow Information */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold mb-2">Accounting Flow:</p>
                <p className="mb-2">
                  This invoice will be stored without affecting your accounts.
                  Journal entries will be created when payment is received:
                </p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Payment Entry:</strong> Debit Cash/Bank, Credit
                    Accounts Receivable
                  </li>
                  <li>
                    <strong>Cost Entry:</strong> Debit Cost of Goods Sold,
                    Credit Inventory
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <InvoiceItems items={items} setItems={setItems} products={products} />

          {/* Invoice Totals */}
          <div className="flex justify-end">
            <div className="w-full md:w-96">
              <InvoiceTotals
                items={items}
                setDiscount={setDiscount}
                taxRate={taxRate}
                shipping={shipping}
                setShipping={setShipping}
              />
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
              {isLoading ? "Creating..." : "Create Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInvoiceModal;
