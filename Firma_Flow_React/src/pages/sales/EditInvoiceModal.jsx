import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { buildApiUrl } from "../../config/api.config";
import InvoiceItems from "./InvoiceItems";
import InvoiceTotals from "./InvoiceTotals";

const EditInvoiceModal = ({ isOpen, onClose, onSuccess, invoice }) => {
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
  const [status, setStatus] = useState("draft");

  // Data from API
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [taxes, setTaxes] = useState([]);

  // Invoice items
  const [items, setItems] = useState([
    {
      product_id: "",
      product_name: "",
      quantity: 1,
      unit_price: 0,
      total: 0,
      available_qty: 0,
    },
  ]);

  // Load invoice data when modal opens
  useEffect(() => {
    if (!isOpen || !invoice) return;

    const fetchData = async () => {
      setInvoiceNumber(invoice.invoice_number || invoice.invoice_no || "");
      setCustomerId(invoice.customer_id || "");
      setInvoiceDate(invoice.invoice_date || "");
      setDueDate(invoice.due_date || "");
      setTaxId(invoice.tax_rate_id || "");
      setTaxRate(parseFloat(invoice.tax_rate || 0));
      setNotes(invoice.notes || "");
      setSelectedTags(invoice.tags || "");
      setDiscount(parseFloat(invoice.discount_amount || 0));
      setStatus(invoice.status || "draft");

      // Fetch invoice lines
      try {
        const response = await fetch(
          buildApiUrl(`api/sales.php?id=${invoice.id}`),
          {
            method: "GET",
            credentials: "include",
          }
        );
        const data = await response.json();
        if (data.success && data.data.lines) {
          const formattedItems = data.data.lines.map((line) => ({
            product_id: line.product_id,
            product_name: line.product_name,
            quantity: parseFloat(line.quantity),
            unit_price: parseFloat(line.unit_price),
            total: parseFloat(line.line_total),
            available_qty: 0,
          }));
          setItems(
            formattedItems.length > 0
              ? formattedItems
              : [
                  {
                    product_id: "",
                    product_name: "",
                    quantity: 1,
                    unit_price: 0,
                    total: 0,
                    available_qty: 0,
                  },
                ]
          );
        }
      } catch (err) {
        console.error("Error fetching invoice details:", err);
      }

      fetchCustomersAndProducts();
    };

    fetchData();
  }, [isOpen, invoice]);

  const fetchCustomersAndProducts = async () => {
    try {
      // Fetch customers
      const customersRes = await fetch(buildApiUrl("api/customers.php"), {
        method: "GET",
        credentials: "include",
      });
      const customersData = await customersRes.json();
      if (customersData.success) {
        setCustomers(customersData.data || []);
      }

      // Fetch products
      const productsRes = await fetch(buildApiUrl("api/products.php"), {
        method: "GET",
        credentials: "include",
      });
      const productsData = await productsRes.json();
      if (productsData.success) {
        setProducts(productsData.data || []);
      }

      // Fetch taxes
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

      // Fetch tags
      try {
        const tagsRes = await fetch(buildApiUrl("api/settings.php?type=tags"), {
          method: "GET",
          credentials: "include",
        });
        const tagsData = await tagsRes.json();
        if (tagsData.success) {
          // Tags fetched successfully but not used in this component
          console.log("Tags available:", tagsData.data);
        }
      } catch {
        // Silently fail for tags
      }
    } catch (err) {
      console.error("Error fetching customers/products:", err);
    }
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
      const response = await fetch(buildApiUrl(`api/sales.php`), {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: invoice.id,
          invoice_number: invoiceNumber,
          customer_id: customerId,
          invoice_date: invoiceDate,
          due_date: dueDate,
          tax_id: taxId,
          tax_rate: taxRate,
          notes: notes,
          tags: selectedTags,
          status: status,
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total: item.total,
          })),
          discount: discount,
        }),
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      const data = await response.json();
      console.log("Response data:", data);

      // Check if invoice was updated successfully
      if (response.ok && (data.success || data.id)) {
        onSuccess();
        onClose();
      } else {
        const errorMsg =
          data.message || data.error || "Failed to update invoice";
        console.error("Invoice update failed:", errorMsg);
        setError(errorMsg);
      }
    } catch (err) {
      console.error("Error updating invoice:", err);
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !invoice) return null;

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${theme.bgCard} rounded-xl ${theme.shadow} max-w-5xl w-full max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#667eea] to-[#764ba2] p-6 flex justify-between items-center rounded-t-xl sticky top-0 z-10">
          <h2 className="text-2xl font-bold text-white">Edit Invoice</h2>
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

          {/* Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Invoice Number
              </label>
              <input
                type="text"
                value={invoiceNumber}
                readOnly
                className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} bg-gray-100 cursor-not-allowed`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Invoice Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                required
                className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary}`}
              />
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Due Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                required
                className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary}`}
              />
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
          </div>

          {/* Tax & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
              >
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="paid">Paid</option>
                <option value="partially_paid">Partially Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </div>
          </div>

          {/* Invoice Items */}
          <InvoiceItems items={items} setItems={setItems} products={products} />

          {/* Totals */}
          <InvoiceTotals
            items={items}
            setDiscount={setDiscount}
            taxRate={taxRate}
          />

          {/* Notes */}
          <div>
            <label
              className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
            >
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={`w-full px-4 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent`}
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-6 py-3 border ${theme.borderPrimary} rounded-lg ${theme.textPrimary} font-medium hover:bg-gray-100 transition`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className={`flex-1 px-6 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg font-medium shadow-lg hover:opacity-90 transition ${
                isLoading ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? "Updating..." : "Update Invoice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditInvoiceModal;
