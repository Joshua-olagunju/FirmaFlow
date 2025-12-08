import { useTheme } from "../../../contexts/ThemeContext";

const CustomReceiptPreview = ({ templateData, companyInfo, receiptData }) => {
  // eslint-disable-next-line no-unused-vars
  const { theme } = useTheme();

  if (!templateData) return null;

  // Check if it's a freeform template (has elements) or structured (has sections)
  const isFreeform =
    templateData.type === "custom-freeform" && templateData.elements;
  const color = templateData.color || "#667eea";

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);

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
              <h2 style={{ color, margin: 0 }}>RECEIPT</h2>
            </div>
          );
        case "companyInfo":
          return (
            <div style={style} className="text-xs">
              <p className="font-bold">
                {companyInfo?.company_name || "Your Company Name"}
              </p>
              <p>{companyInfo?.address || "123 Business Street"}</p>
              <p>{companyInfo?.phone || "(123) 456-7890"}</p>
            </div>
          );
        case "receiptDetails":
          return (
            <div style={style} className="text-xs space-y-1">
              <p>
                <span className="font-semibold">Receipt #:</span>{" "}
                {receiptData?.receipt_number || "RCP-001"}
              </p>
              <p>
                <span className="font-semibold">Date:</span>{" "}
                {receiptData?.date || new Date().toLocaleDateString()}
              </p>
              <p>
                <span className="font-semibold">Time:</span>{" "}
                {receiptData?.time || new Date().toLocaleTimeString()}
              </p>
            </div>
          );
        case "itemsList":
          return (
            <div className="text-xs">
              <div className="border-b pb-1 mb-1 flex justify-between font-semibold">
                <span>Item</span>
                <span>Amount</span>
              </div>
              <div className="flex justify-between">
                <span>Sample Product (x2)</span>
                <span>₦50,000</span>
              </div>
            </div>
          );
        case "totals":
          return (
            <div style={style} className="text-xs space-y-1">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>
                  ₦{(receiptData?.subtotal || 50000).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (7.5%):</span>
                <span>₦{(receiptData?.tax || 3750).toLocaleString()}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-1">
                <span style={{ color }}>TOTAL:</span>
                <span style={{ color }}>
                  ₦{(receiptData?.total || 53750).toLocaleString()}
                </span>
              </div>
            </div>
          );
        case "paymentMethod":
          return (
            <div style={style} className="text-xs space-y-1">
              <p>
                <span className="font-semibold">Payment:</span>{" "}
                {receiptData?.payment_method || "Cash"}
              </p>
              <p>
                <span className="font-semibold">Amount Paid:</span> ₦
                {(receiptData?.amount_paid || 60000).toLocaleString()}
              </p>
              <p>
                <span className="font-semibold">Change:</span> ₦
                {(receiptData?.change || 6250).toLocaleString()}
              </p>
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
        className="bg-white mx-auto"
        style={{
          width: "100%",
          maxWidth: "302px",
          fontFamily: "monospace",
          fontSize: "11px",
          boxSizing: "border-box",
          minHeight: "400px",
        }}
      >
        <div
          className="relative"
          style={{
            padding: "10mm",
            minHeight: "380px",
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

  // Helper function to get font size in pixels
  const getFontSize = (size) => {
    const sizeMap = {
      xs: "10px",
      sm: "11px",
      base: "12px",
      lg: "14px",
      xl: "16px",
      "2xl": "18px",
    };
    return sizeMap[size] || "12px";
  };

  // Helper function to get font weight class
  const getFontWeightClass = (weight) => {
    const weightMap = {
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
      6: "p-6",
    };
    return paddingMap[padding] || "p-2";
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
            <h2 className="font-bold" style={{ color }}>
              RECEIPT
            </h2>
          </div>
        );

      case "companyInfo":
        return (
          <div className={sectionClasses} style={sectionStyle}>
            <h3 className="font-bold text-gray-800">
              {companyInfo?.company_name || "Your Company"}
            </h3>
            <p className="text-gray-600">
              {companyInfo?.address || "Company Address"}
            </p>
            <p className="text-gray-600">
              {companyInfo?.phone || "Phone Number"}
            </p>
          </div>
        );

      case "receiptDetails":
        return (
          <div className={sectionClasses} style={sectionStyle}>
            <div className="space-y-1">
              {section.props?.showReceiptNumber !== false && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Receipt #:</span>
                  <span className="font-semibold text-gray-800">
                    {receiptData?.receipt_number || "RCP-001"}
                  </span>
                </div>
              )}
              {section.props?.showDate !== false && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="text-gray-800">
                    {receiptData?.date || new Date().toLocaleDateString()}
                  </span>
                </div>
              )}
              {section.props?.showTime !== false && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="text-gray-800">
                    {receiptData?.time || new Date().toLocaleTimeString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        );

      case "itemsTable": {
        const items = receiptData?.items || [
          { name: "Sample Product", quantity: 2, price: 25000, total: 50000 },
        ];
        const props = section.props || {};
        return (
          <div className={sectionClasses} style={sectionStyle}>
            <table className={`w-full ${props.showBorders ? "border" : ""}`}>
              <thead>
                <tr
                  style={{
                    backgroundColor: props.headerBgColor || color,
                    color: props.headerTextColor || "#ffffff",
                  }}
                >
                  <th className="p-2 text-left">Item</th>
                  <th className="p-2 text-right">Qty</th>
                  <th className="p-2 text-right">Price</th>
                  <th className="p-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={idx}
                    className={
                      props.zebraStripes && idx % 2 === 1 ? "bg-gray-50" : ""
                    }
                  >
                    <td className={`p-2 ${props.showBorders ? "border" : ""}`}>
                      {item.name}
                    </td>
                    <td
                      className={`p-2 text-right ${
                        props.showBorders ? "border" : ""
                      }`}
                    >
                      {item.quantity}
                    </td>
                    <td
                      className={`p-2 text-right ${
                        props.showBorders ? "border" : ""
                      }`}
                    >
                      {formatCurrency(item.price)}
                    </td>
                    <td
                      className={`p-2 text-right ${
                        props.showBorders ? "border" : ""
                      }`}
                    >
                      {formatCurrency(item.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "totals":
        return (
          <div className={`${sectionClasses} space-y-1`} style={sectionStyle}>
            {section.props?.showSubtotal !== false && (
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="text-gray-800">
                  {formatCurrency(receiptData?.subtotal || 50000)}
                </span>
              </div>
            )}
            {section.props?.showTax !== false && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax (7.5%):</span>
                <span className="text-gray-800">
                  {formatCurrency(receiptData?.tax || 3750)}
                </span>
              </div>
            )}
            {section.props?.showDiscount && (
              <div className="flex justify-between">
                <span className="text-gray-600">Discount:</span>
                <span className="text-gray-800">
                  -{formatCurrency(receiptData?.discount || 0)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-1 border-t border-gray-300">
              <span style={{ color }}>TOTAL:</span>
              <span style={{ color }}>
                {formatCurrency(receiptData?.total || 53750)}
              </span>
            </div>
            {receiptData?.change > 0 && (
              <div className="flex justify-between mt-2 pt-2 border-t border-gray-300">
                <span className="text-gray-600">Change:</span>
                <span className="text-gray-800">
                  {formatCurrency(receiptData?.change)}
                </span>
              </div>
            )}
          </div>
        );

      case "paymentMethod":
      case "paymentInfo":
        return (
          <div className={`${sectionClasses} space-y-1`} style={sectionStyle}>
            <p className="font-semibold mb-1 text-gray-700">
              Payment Information:
            </p>
            <div className="flex justify-between">
              <span className="text-gray-600">Payment Method:</span>
              <span className="font-semibold text-gray-800">
                {receiptData?.payment_method || "Cash"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="text-gray-800">
                {formatCurrency(receiptData?.amount_paid || 60000)}
              </span>
            </div>
            {receiptData?.change > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Change:</span>
                <span className="text-gray-800">
                  {formatCurrency(receiptData?.change)}
                </span>
              </div>
            )}
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
          marginTop: `${(props.marginTop || 2) * 0.25}rem`,
          marginBottom: `${(props.marginBottom || 2) * 0.25}rem`,
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

  // Thermal receipt format with responsive design
  return (
    <div
      className="bg-white mx-auto p-3 sm:p-4 print:p-4"
      style={{
        width: "100%",
        maxWidth: "302px",
        fontFamily: "monospace",
        fontSize: "11px",
        boxSizing: "border-box",
        minHeight: "400px",
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
        <div className="space-y-2">
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

export default CustomReceiptPreview;
