import { useState } from "react";
import { Trash2, AlertCircle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useSettings } from "../../contexts/SettingsContext";
import InventoryWarningModal from "./InventoryWarningModal";

const InvoiceItems = ({ items, setItems, products }) => {
  const { theme } = useTheme();
  const { formatCurrency } = useSettings();
  const [warningModal, setWarningModal] = useState({
    isOpen: false,
    itemIndex: null,
    productName: "",
    availableQty: 0,
    requestedQty: 0,
  });

  const addItem = () => {
    setItems([
      ...items,
      {
        product_id: "",
        product_name: "",
        quantity: 1,
        unit_price: 0,
        total: 0,
        available_qty: 0,
      },
    ]);
  };

  const removeItem = (index) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const handleProductChange = (index, productId) => {
    const selectedProduct = products.find((p) => p.id === parseInt(productId));
    if (selectedProduct) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        product_id: productId,
        product_name: selectedProduct.name,
        unit_price: parseFloat(selectedProduct.price) || 0,
        available_qty: parseInt(selectedProduct.quantity) || 0,
        quantity: 1,
        total: parseFloat(selectedProduct.price) || 0,
      };
      setItems(newItems);
    }
  };

  const handleQuantityChange = (index, newQuantity) => {
    const qty = parseInt(newQuantity) || 0;
    const item = items[index];

    // Check if quantity exceeds available stock
    if (qty > item.available_qty && item.available_qty > 0) {
      setWarningModal({
        isOpen: true,
        itemIndex: index,
        productName: item.product_name,
        availableQty: item.available_qty,
        requestedQty: qty,
      });
    } else {
      updateQuantity(index, qty);
    }
  };

  const updateQuantity = (index, qty) => {
    const newItems = [...items];
    newItems[index].quantity = qty;
    newItems[index].total = qty * newItems[index].unit_price;
    setItems(newItems);
  };

  const confirmExcessQuantity = () => {
    const { itemIndex, requestedQty } = warningModal;
    updateQuantity(itemIndex, requestedQty);
  };

  const handlePriceChange = (index, newPrice) => {
    const price = parseFloat(newPrice) || 0;
    const newItems = [...items];
    newItems[index].unit_price = price;
    newItems[index].total = newItems[index].quantity * price;
    setItems(newItems);
  };

  return (
    <div className="space-y-4">
      <h3 className={`text-sm font-semibold ${theme.textPrimary}`}>
        Invoice Items
      </h3>

      {items.map((item, index) => (
        <div
          key={index}
          className={`p-4 border ${theme.borderPrimary} rounded-lg space-y-3 ${theme.inputBg}`}
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
            {/* Product Selection */}
            <div className="md:col-span-4">
              <label
                className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
              >
                Product
              </label>
              <select
                value={item.product_id}
                onChange={(e) => handleProductChange(index, e.target.value)}
                className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-sm`}
              >
                <option value="">Select Product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} (Stock: {product.quantity || 0})
                  </option>
                ))}
              </select>
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
                value={item.quantity}
                onChange={(e) => handleQuantityChange(index, e.target.value)}
                className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-sm`}
              />
              {item.product_id &&
                item.available_qty > 0 &&
                item.quantity > item.available_qty && (
                  <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Stock: {item.available_qty}
                  </p>
                )}
              {item.product_id && item.available_qty > 0 && (
                <p className={`text-xs ${theme.textSecondary} mt-1`}>
                  Available: {item.available_qty}
                </p>
              )}
            </div>

            {/* Unit Price */}
            <div className="md:col-span-2">
              <label
                className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
              >
                Unit Price
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={item.unit_price}
                onChange={(e) => handlePriceChange(index, e.target.value)}
                className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgInput} ${theme.textPrimary} focus:ring-2 focus:ring-[#667eea] focus:border-transparent text-sm`}
              />
            </div>

            {/* Total */}
            <div className="md:col-span-3">
              <label
                className={`block text-xs font-medium ${theme.textSecondary} mb-1`}
              >
                Total
              </label>
              <div
                className={`w-full px-3 py-2 border ${theme.borderPrimary} rounded-lg ${theme.bgCard} ${theme.textPrimary} font-semibold text-sm`}
              >
                {formatCurrency(item.total)}
              </div>
            </div>

            {/* Remove Button */}
            <div className="md:col-span-1 flex items-end">
              <button
                type="button"
                onClick={() => removeItem(index)}
                disabled={items.length === 1}
                className={`p-2 rounded-lg transition ${
                  items.length === 1
                    ? "opacity-50 cursor-not-allowed text-gray-400"
                    : "hover:bg-red-100"
                }`}
                title="Remove item"
              >
                <Trash2
                  className={`w-5 h-5 ${
                    items.length === 1 ? "" : "text-red-600"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Add Item Button */}
      <button
        type="button"
        onClick={addItem}
        className={`w-full py-3 border-2 border-dashed ${theme.borderPrimary} rounded-lg ${theme.textSecondary} hover:border-blue-500 hover:text-blue-500 transition font-medium text-sm`}
      >
        + Add Item
      </button>

      {/* Inventory Warning Modal */}
      <InventoryWarningModal
        isOpen={warningModal.isOpen}
        onClose={() =>
          setWarningModal({
            isOpen: false,
            itemIndex: null,
            productName: "",
            availableQty: 0,
            requestedQty: 0,
          })
        }
        onConfirm={confirmExcessQuantity}
        productName={warningModal.productName}
        availableQty={warningModal.availableQty}
        requestedQty={warningModal.requestedQty}
      />
    </div>
  );
};

export default InvoiceItems;
