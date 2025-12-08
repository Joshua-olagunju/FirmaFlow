import { useTheme } from "../../../contexts/ThemeContext";
import { Image as ImageIcon } from "lucide-react";

const CustomInvoicePreview = ({ templateData, companyInfo, invoiceData }) => {
  // eslint-disable-next-line no-unused-vars
  const { theme } = useTheme();

  if (!templateData) return null;

  // Check if it's a freeform template (has elements) or structured (has sections)
  const isFreeform =
    templateData.type === "custom-freeform" && templateData.elements;
  const color = templateData.color || "#667eea";

  if (isFreeform) {
    // Render freeform template
    const { elements } = templateData;

    const renderFreeformElement = (element) => {
      const style = {
        fontSize: `${element.fontSize}px`,
        textAlign: element.alignment,
        fontWeight: element.bold ? "bold" : "normal",
      };

      switch (element.type) {
        case "header":
          return (
            <div style={style}>
              <h1 style={{ color, margin: 0 }}>INVOICE</h1>
            </div>
          );
        case "companyInfo":
          return (
            <div style={style} className="text-sm">
              <p className="font-bold">
                {companyInfo?.company_name || "Your Company Name"}
              </p>
              <p>{companyInfo?.address || "123 Business Street"}</p>
              <p>{companyInfo?.phone || "(123) 456-7890"}</p>
              <p>{companyInfo?.email || "email@company.com"}</p>
            </div>
          );
        case "customerInfo":
          return (
            <div style={style} className="text-sm">
              <p className="font-semibold" style={{ color }}>
                BILL TO:
              </p>
              <p className="font-bold">
                {invoiceData?.customer_name || "Customer Name"}
              </p>
              <p>{invoiceData?.customer_address || "Customer Address"}</p>
            </div>
          );
        case "invoiceDetails":
          return (
            <div style={style} className="text-sm space-y-1">
              <p>
                <span className="font-semibold">Invoice #:</span>{" "}
                {invoiceData?.invoice_number || "INV-001"}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {invoiceData?.date || new Date().toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold">Due Date:</span>{" "}
                {invoiceData?.due_date || new Date().toLocaleDateString()}
              </p>
            </div>
          );
        case "itemsTable": {
          const items = invoiceData?.items || [
            {
              description: "Sample Item",
              quantity: 1,
              rate: 100000,
              amount: 100000,
            },
          ];
          return (
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ backgroundColor: `${color}15` }}>
                  <th className="border p-2 text-left">Description</th>
                  <th className="border p-2 text-center">Qty</th>
                  <th className="border p-2 text-right">Rate</th>
                  <th className="border p-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr key={idx}>
                    <td className="border p-2">{item.description}</td>
                    <td className="border p-2 text-center">{item.quantity}</td>
                    <td className="border p-2 text-right">
                      ₦{item.rate.toLocaleString()}
                    </td>
                    <td className="border p-2 text-right">
                      ₦{item.amount.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        }
        case "totals":
          return (
            <div style={style} className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>
                  ₦{(invoiceData?.subtotal || 100000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (7.5%):</span>
                <span>₦{(invoiceData?.tax || 7500).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span style={{ color }}>TOTAL:</span>
                <span style={{ color }}>
                  ₦{(invoiceData?.total || 107500).toLocaleString()}
                </span>
              </div>
            </div>
          );
        case "paymentInfo":
          return (
            <div style={style} className="text-xs">
              <p className="font-semibold mb-1" style={{ color }}>
                Payment Information
              </p>
              <p>
                <span className="font-semibold">Bank:</span>{" "}
                {companyInfo?.bank_name || "First Bank"}
              </p>
              <p>
                <span className="font-semibold">Account:</span>{" "}
                {companyInfo?.bank_account || "1234567890"}
              </p>
              <p>
                <span className="font-semibold">Name:</span>{" "}
                {companyInfo?.company_name || "Your Company Ltd"}
              </p>
            </div>
          );
        case "logo":
          return companyInfo?.logo ? (
            <img
              src={companyInfo.logo}
              alt="Logo"
              className="max-w-full h-auto"
            />
          ) : (
            <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
              <ImageIcon size={32} className="text-gray-400" />
            </div>
          );
        case "text":
          return <div style={style}>{element.text || "Custom Text"}</div>;
        default:
          return null;
      }
    };

    return (
      <div
        className="relative bg-white mx-auto"
        style={{
          width: "210mm",
          minHeight: "297mm",
          boxSizing: "border-box",
        }}
      >
        <div
          className="relative"
          style={{
            padding: "20mm",
            minHeight: "257mm",
          }}
        >
          {elements.map((element) => (
            <div
              key={element.id}
              className="absolute"
              style={{
                left: element.position.x,
                top: element.position.y,
                width: element.size.width,
                minHeight: element.size.height,
              }}
            >
              {renderFreeformElement(element)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Render structured template
  if (!templateData.sections) return null;
  const { sections, documentBorder } = templateData;

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

  // Helper function to get font size in pixels
  const getFontSize = (size) => {
    const sizeMap = {
      xs: "12px",
      sm: "14px",
      md: "16px",
      base: "16px",
      lg: "18px",
      xl: "20px",
      "2xl": "24px",
      "3xl": "30px",
      "4xl": "36px",
    };
    return sizeMap[size] || "16px";
  };

  // Helper function to get font weight class
  const getFontWeightClass = (weight) => {
    const weightMap = {
      light: "font-light",
      normal: "font-normal",
      medium: "font-medium",
      semibold: "font-semibold",
      bold: "font-bold",
    };
    return weightMap[weight] || "font-normal";
  };

  // Helper function to get padding class
  const getPaddingClass = (padding) => {
    const paddingMap = {
      0: "p-0",
      1: "p-1",
      2: "p-2",
      3: "p-3",
      4: "p-4",
      5: "p-5",
      6: "p-6",
      8: "p-8",
    };
    return paddingMap[padding] || "p-4";
  };

  // Helper function to build section style
  const getSectionStyle = (section) => {
    const style = {};
    const props = section.props || {};

    // Font size - apply directly to override child classes
    if (props.fontSize) {
      style.fontSize = getFontSize(props.fontSize);
    }

    if (props.backgroundColor && props.backgroundColor !== "transparent") {
      style.backgroundColor = props.backgroundColor;
    }

    if (props.borderWidth && parseInt(props.borderWidth) > 0) {
      style.borderWidth = `${props.borderWidth}px`;
      style.borderStyle = props.borderStyle || "solid";
      style.borderColor = props.borderColor || "#000000";
    }

    return style;
  };

  // Helper function to get section classes
  const getSectionClasses = (section) => {
    const props = section.props || {};
    const classes = [];

    // Alignment
    if (props.alignment === "center") classes.push("text-center");
    else if (props.alignment === "right") classes.push("text-right");
    else classes.push("text-left");

    // Font weight
    classes.push(getFontWeightClass(props.fontWeight));

    // Padding
    classes.push(getPaddingClass(props.padding));

    // Text style
    if (props.textStyle === "italic") classes.push("italic");
    if (props.textStyle === "underline") classes.push("underline");

    // Shadow
    if (props.showShadow) classes.push("shadow-md");

    return classes.join(" ");
  };

  const renderSection = (section) => {
    const sectionClasses = getSectionClasses(section);
    const sectionStyle = getSectionStyle(section);

    switch (section.type) {
      case "header":
        return (
          <div className={sectionClasses} style={sectionStyle}>
            {section.props?.showLogo && (
              <div className="mb-2">
                {companyInfo?.logo ? (
                  <img
                    src={companyInfo.logo}
                    alt="Company Logo"
                    className={`inline-block ${
                      section.props.logoSize === "sm"
                        ? "h-12 w-auto"
                        : section.props.logoSize === "md"
                        ? "h-16 w-auto"
                        : section.props.logoSize === "lg"
                        ? "h-20 w-auto"
                        : "h-24 w-auto"
                    }`}
                  />
                ) : (
                  <ImageIcon
                    className={`inline-block ${
                      section.props.logoSize === "sm"
                        ? "w-12 h-12"
                        : section.props.logoSize === "md"
                        ? "w-16 h-16"
                        : section.props.logoSize === "lg"
                        ? "w-20 h-20"
                        : "w-24 h-24"
                    }`}
                    style={{ color }}
                  />
                )}
              </div>
            )}
            <h1 className="font-bold" style={{ color }}>
              INVOICE
            </h1>
          </div>
        );

      case "companyInfo":
        return (
          <div className={sectionClasses} style={sectionStyle}>
            <h2 className="font-bold text-gray-800">
              {companyInfo?.name || companyInfo?.company_name || "Your Company"}
            </h2>
            {section.props?.showAddress && (
              <p className="text-gray-600">
                {companyInfo?.address || "Company Address"}
              </p>
            )}
            {section.props?.showPhone && (
              <p className="text-gray-600">
                {companyInfo?.phone || "Phone Number"}
              </p>
            )}
            {section.props?.showEmail && (
              <p className="text-gray-600">
                {companyInfo?.email || "email@company.com"}
              </p>
            )}
          </div>
        );

      case "customerInfo":
        return (
          <div className={sectionClasses} style={sectionStyle}>
            <p className="font-semibold" style={{ color }}>
              BILL TO:
            </p>
            <p className="font-semibold text-gray-800">
              {invoiceData?.customer_name || "Customer Name"}
            </p>
            <p className="text-gray-600">
              {invoiceData?.customer_address || "Customer Address"}
            </p>
          </div>
        );

      case "invoiceDetails":
        return (
          <div className={sectionClasses} style={sectionStyle}>
            <div className="space-y-1">
              {section.props?.showInvoiceNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Invoice #:</span>
                  <span className="font-semibold text-gray-800">
                    {invoiceData?.invoice_number || "INV-001"}
                  </span>
                </div>
              )}
              {section.props?.showDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-800">
                    {invoiceData?.date || new Date().toLocaleDateString()}
                  </span>
                </div>
              )}
              {section.props?.showDueDate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Due Date:</span>
                  <span className="text-gray-800">
                    {invoiceData?.due_date || new Date().toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case "itemsTable": {
        const items = invoiceData?.items || [
          {
            description: "Sample Item",
            quantity: 1,
            rate: 100000,
            amount: 100000,
          },
        ];
        const props = section.props || {};
        return (
          <div className={getPaddingClass(props.padding)} style={sectionStyle}>
            <div className="overflow-x-auto">
              <table
                className={`w-full text-xs sm:text-sm min-w-full ${
                  props.showBorders ? "border border-gray-300" : ""
                }`}
              >
                <thead>
                  <tr
                    style={{
                      backgroundColor: props.headerBgColor || `${color}15`,
                      color: props.headerTextColor || "#000000",
                    }}
                  >
                    <th className="text-left p-1 sm:p-2">Description</th>
                    <th className="text-center p-1 sm:p-2">Qty</th>
                    <th className="text-right p-1 sm:p-2">Rate</th>
                    <th className="text-right p-1 sm:p-2">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, index) => (
                    <tr
                      key={index}
                      className={`${
                        props.zebraStripes && index % 2 === 1
                          ? "bg-gray-50"
                          : ""
                      } ${props.showBorders ? "" : "border-b border-gray-200"}`}
                    >
                      <td
                        className={`p-1 sm:p-2 text-gray-800 ${
                          props.showBorders ? "border" : ""
                        }`}
                      >
                        {item.description}
                      </td>
                      <td
                        className={`text-center p-1 sm:p-2 text-gray-800 ${
                          props.showBorders ? "border" : ""
                        }`}
                      >
                        {item.quantity}
                      </td>
                      <td
                        className={`text-right p-1 sm:p-2 text-gray-800 whitespace-nowrap ${
                          props.showBorders ? "border" : ""
                        }`}
                      >
                        {formatCurrency(item.rate)}
                      </td>
                      <td
                        className={`text-right p-1 sm:p-2 text-gray-800 whitespace-nowrap ${
                          props.showBorders ? "border" : ""
                        }`}
                      >
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }

      case "totals":
        return (
          <div className={`${sectionClasses} space-y-1`} style={sectionStyle}>
            {section.props?.showSubtotal && (
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-800">
                  {formatCurrency(invoiceData?.subtotal || 100000)}
                </span>
              </div>
            )}
            {section.props?.showTax && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (7.5%):</span>
                <span className="text-gray-800">
                  {formatCurrency(invoiceData?.tax || 7500)}
                </span>
              </div>
            )}
            {section.props?.showDiscount && invoiceData?.discount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="text-gray-800">
                  -{formatCurrency(invoiceData?.discount || 0)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1 border-t border-gray-300">
              <span style={{ color }}>TOTAL:</span>
              <span style={{ color }}>
                {formatCurrency(invoiceData?.total || 107500)}
              </span>
            </div>
          </div>
        );

      case "paymentInfo":
        return (
          <div className={sectionClasses} style={sectionStyle}>
            <p className="font-semibold mb-2" style={{ color }}>
              Payment Information
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs sm:text-sm">
              {section.props?.showBankName && (
                <div>
                  <span className="text-gray-600">Bank:</span>
                  <p className="font-semibold text-gray-800">
                    {companyInfo?.bank_name || "Bank Name"}
                  </p>
                </div>
              )}
              {section.props?.showAccountNumber && (
                <div>
                  <span className="text-gray-600">Account:</span>
                  <p className="font-semibold text-gray-800 break-all">
                    {companyInfo?.bank_account ||
                      companyInfo?.account_number ||
                      "Account Number"}
                  </p>
                </div>
              )}
              <div>
                <span className="text-gray-600">Name:</span>
                <p className="font-semibold text-gray-800">
                  {companyInfo?.account_name ||
                    companyInfo?.name ||
                    companyInfo?.company_name ||
                    "Account Name"}
                </p>
              </div>
            </div>
          </div>
        );

      case "customText":
        return (
          <div className={sectionClasses} style={sectionStyle}>
            <p className="text-gray-700">
              {section.props?.text || "Custom text"}
            </p>
          </div>
        );

      case "divider": {
        const props = section.props || {};
        const dividerStyle = {
          borderTopWidth: `${props.thickness || 1}px`,
          borderTopStyle: props.style || "solid",
          borderTopColor: props.color || "#e5e7eb",
          marginTop: `${(props.marginTop || 4) * 0.25}rem`,
          marginBottom: `${(props.marginBottom || 4) * 0.25}rem`,
        };
        return <div style={dividerStyle}></div>;
      }

      default:
        return null;
    }
  };

  // Build document border style
  const documentBorderStyle = {};
  if (documentBorder?.enabled) {
    documentBorderStyle.borderWidth = `${documentBorder.width || 1}px`;
    documentBorderStyle.borderStyle = documentBorder.style || "solid";
    documentBorderStyle.borderColor = documentBorder.color || "#000000";
    documentBorderStyle.borderRadius = `${documentBorder.radius || 0}px`;
  }

  // Calculate padding: default padding minus document border margin
  const borderMargin = documentBorder?.enabled
    ? documentBorder.margin || 20
    : 0;

  // A4 format with responsive design
  return (
    <div
      className="bg-white mx-auto p-4 sm:p-6 md:p-8 max-w-4xl print:p-8"
      style={{
        fontFamily: "Arial, sans-serif",
        boxSizing: "border-box",
        minHeight: "500px",
      }}
    >
      <div
        style={{
          ...documentBorderStyle,
          ...(documentBorder?.enabled && {
            padding: `${borderMargin}px`,
            minHeight: "100%",
            boxSizing: "border-box",
          }),
        }}
      >
        <div className="space-y-4 md:space-y-6">
          {sections.map((section) => (
            <div key={section.id} style={{ pageBreakInside: "avoid" }}>
              {renderSection(section)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CustomInvoicePreview;
