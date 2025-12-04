import ProductActions from "./ProductActions";
import { useTheme } from "../../contexts/ThemeContext";

const ProductTable = ({ products, onEdit, onDelete }) => {
  const { theme } = useTheme();

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="overflow-x-auto relative">
      <table className="w-full border-collapse">
        <thead>
          <tr
            className={`bg-gradient-to-r ${
              theme.mode === "light"
                ? "from-slate-50 to-slate-100"
                : "from-slate-700 to-slate-600"
            } border-b-2 ${theme.borderSecondary}`}
          >
            <th
              className={`text-left p-4 font-semibold text-sm ${theme.textPrimary}`}
            >
              SKU
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Name
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Description
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Cost Price
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Selling Price
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Stock
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Status
            </th>
            <th
              className={`text-left p-4 font-semibold ${theme.textPrimary} text-sm`}
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((product, index) => {
            return (
              <tr
                key={product.id || index}
                className={`border-b ${theme.borderPrimary} ${
                  theme.mode === "light"
                    ? "hover:bg-slate-50"
                    : "hover:bg-slate-700"
                } transition text-sm`}
              >
                <td className={`p-4 ${theme.textPrimary} font-medium`}>
                  {product.sku}
                </td>
                <td className={`p-4 ${theme.textPrimary} font-medium`}>
                  {product.name}
                </td>
                <td className={`p-4 ${theme.textSecondary}`}>
                  {product.description || "N/A"}
                </td>
                <td className={`p-4 ${theme.textSecondary}`}>
                  ₦
                  {parseFloat(product.costPrice).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className={`p-4 ${theme.textPrimary} font-semibold`}>
                  ₦
                  {parseFloat(product.sellingPrice).toLocaleString("en-NG", {
                    minimumFractionDigits: 2,
                  })}
                </td>
                <td className={`p-4 ${theme.textPrimary}`}>
                  {product.stockQuantity} {product.unit}
                </td>
                <td className="p-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      product.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-700"
                    }`}
                  >
                    {product.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="p-4">
                  <ProductActions
                    product={product}
                    onEdit={onEdit}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
