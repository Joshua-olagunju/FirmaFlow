import { useState, useEffect } from "react";
import { useTheme } from "../../contexts/ThemeContext";
import { Building2, Upload, Save, X } from "lucide-react";
import { buildApiUrl } from "../../config/api.config";

const CompanyInfo = () => {
  const { theme } = useTheme();
  const [formData, setFormData] = useState({
    companyName: "",
    email: "",
    phone: "",
    website: "",
    businessAddress: "",
    taxNumber: "",
    registrationNumber: "",
    businessType: "",
    establishedDate: "",
    bankName: "",
    accountNumber: "",
    accountName: "",
  });
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errors, setErrors] = useState({});

  const businessTypes = [
    "Sole Proprietorship",
    "Partnership",
    "Limited Liability Company (LLC)",
    "Corporation",
    "Non-Profit Organization",
    "Cooperative",
    "Other",
  ];

  // Load company info from API
  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const response = await fetch(
        buildApiUrl("api/settings.php?type=company"),
        {
          method: "GET",
          credentials: "include",
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        const company = data.data;
        setFormData({
          companyName: company.name || "",
          email: company.email || "",
          phone: company.phone || "",
          website: company.website || "",
          businessAddress: company.billing_address || "",
          taxNumber: company.tax_number || "",
          registrationNumber: company.registration_number || "",
          businessType: company.business_type || "",
          establishedDate: company.established_date || "",
          bankName: company.bank_name || "",
          accountNumber: company.account_number || "",
          accountName: company.account_name || "",
        });
        // Only set logo preview if it's a valid URL or path (not base64)
        if (company.logo_path) {
          const logoPath = company.logo_path;
          // Only set if it's a server path or valid URL, skip truncated base64
          if (
            logoPath.startsWith("http") ||
            (logoPath.startsWith("/") && !logoPath.includes("base64"))
          ) {
            setLogoPreview(buildApiUrl(logoPath));
          } else if (
            !logoPath.startsWith("/") &&
            !logoPath.includes("base64")
          ) {
            // Handle relative paths like 'uploads/logos/...'
            setLogoPreview(buildApiUrl(logoPath));
          }
          // Skip base64 data as it may be truncated from database
        }
      }
    } catch (error) {
      console.error("Error loading company info:", error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          logo: "File size must be less than 2MB",
        }));
        return;
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setErrors((prev) => ({
          ...prev,
          logo: "Only image files are allowed",
        }));
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Clear error
      setErrors((prev) => ({ ...prev, logo: "" }));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setFormData((prev) => ({ ...prev, logo: null }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.companyName.trim())
      newErrors.companyName = "Company name is required";
    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    setSuccessMessage("");

    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          action: "update_company",
          name: formData.companyName,
          email: formData.email,
          phone: formData.phone,
          website: formData.website,
          billing_address: formData.businessAddress,
          tax_number: formData.taxNumber,
          registration_number: formData.registrationNumber,
          business_type: formData.businessType,
          established_date: formData.establishedDate,
          bank_name: formData.bankName,
          account_number: formData.accountNumber,
          account_name: formData.accountName,
          // Note: Logo is handled separately to avoid JSON size limits
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // If there's a logo file, upload it separately
        if (logoFile) {
          await uploadLogo();
        }
        setSuccessMessage("Company information saved successfully!");
        setTimeout(() => setSuccessMessage(""), 3000);
      } else {
        setErrors({
          general: data.error || "Failed to save company information",
        });
      }
    } catch (error) {
      console.error("Error saving company info:", error);
      setErrors({ general: "Failed to save company information" });
    } finally {
      setIsSaving(false);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return;

    const formDataUpload = new FormData();
    formDataUpload.append("company_logo", logoFile);

    try {
      const response = await fetch(buildApiUrl("api/settings.php"), {
        method: "POST",
        credentials: "include",
        body: formDataUpload,
      });

      const data = await response.json();
      if (response.ok && data.success) {
        // Logo uploaded successfully, refresh company data to get new logo path
        await fetchCompanyInfo();
      } else {
        console.error("Failed to upload logo:", data.error);
      }
    } catch (error) {
      console.error("Error uploading logo:", error);
    }
  };

  return (
    <div className={`${theme.bgCard} ${theme.shadow} rounded-xl p-6`}>
      {/* Header */}
      <div className="mb-6">
        <h2
          className={`text-2xl font-bold ${theme.textPrimary} flex items-center gap-2`}
        >
          <Building2 size={24} />
          Company Information
        </h2>
        <p className={`${theme.textSecondary} mt-1`}>
          This information will appear on your invoices, receipts, and reports.
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 border border-green-200 text-green-700 rounded-lg">
          {successMessage}
        </div>
      )}

      {/* Error Message */}
      {errors.general && (
        <div className="mb-6 p-4 bg-red-100 border border-red-200 text-red-700 rounded-lg">
          {errors.general}
        </div>
      )}

      <div className="space-y-8">
        {/* Company Details Section */}
        <div
          className={`${theme.bgAccent} rounded-lg p-6 border ${theme.borderSecondary}`}
        >
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            Company Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="md:col-span-2">
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Company Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.companyName ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="Enter your company name"
              />
              {errors.companyName && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.companyName}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${
                  theme.bgInput
                } ${theme.textPrimary} ${
                  errors.email ? "border-red-500" : theme.borderSecondary
                }`}
                placeholder="email@yourcompany.com"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                placeholder="+234 800 000 0000"
              />
            </div>

            {/* Website */}
            <div className="md:col-span-2">
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                placeholder="https://www.yourcompany.com"
              />
            </div>

            {/* Business Address */}
            <div className="md:col-span-2">
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Business Address
              </label>
              <textarea
                name="businessAddress"
                value={formData.businessAddress}
                onChange={handleChange}
                rows="3"
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                placeholder="Enter your complete business address including street, city, state, and postal code"
              />
            </div>

            {/* Tax Number */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Tax Number
              </label>
              <input
                type="text"
                name="taxNumber"
                value={formData.taxNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                placeholder="Tax ID Number"
              />
            </div>

            {/* Registration Number */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Registration Number
              </label>
              <input
                type="text"
                name="registrationNumber"
                value={formData.registrationNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                placeholder="Enter registration number"
              />
            </div>

            {/* Business Type */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Business Type
              </label>
              <select
                name="businessType"
                value={formData.businessType}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
              >
                <option value="">Select Business Type</option>
                {businessTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Established Date */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Established Date
              </label>
              <input
                type="date"
                name="establishedDate"
                value={formData.establishedDate}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
              />
            </div>
          </div>
        </div>

        {/* Company Logo Section */}
        <div
          className={`${theme.bgAccent} rounded-lg p-6 border ${theme.borderSecondary}`}
        >
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-4`}>
            Company Logo
          </h3>

          <div className="space-y-4">
            {logoPreview ? (
              <div className="flex items-start gap-4">
                <div
                  className={`relative w-32 h-32 border-2 ${theme.borderSecondary} rounded-lg overflow-hidden ${theme.bgInput}`}
                >
                  <img
                    src={logoPreview}
                    alt="Company Logo"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      console.error("Failed to load logo:", logoPreview);
                      e.target.style.display = "none";
                      setLogoPreview(null);
                    }}
                  />
                </div>
                <div className="flex-1">
                  <p className={`${theme.textPrimary} font-medium mb-2`}>
                    Logo uploaded
                  </p>
                  <button
                    onClick={removeLogo}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <X size={16} />
                    Remove Logo
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label
                  className={`block w-full border-2 border-dashed ${theme.borderSecondary} rounded-lg p-8 text-center cursor-pointer ${theme.bgHover} transition`}
                >
                  <Upload
                    size={48}
                    className={`mx-auto ${theme.textSecondary} mb-3`}
                  />
                  <p className={`${theme.textPrimary} font-medium mb-1`}>
                    Upload your company logo
                  </p>
                  <p className={`${theme.textSecondary} text-sm mb-3`}>
                    Recommended: PNG or JPG, max 2MB, square format works best
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <span className="px-4 py-2 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg inline-block">
                    Choose File
                  </span>
                </label>
                {errors.logo && (
                  <p className="text-red-500 text-xs mt-2">{errors.logo}</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Payment Information Section */}
        <div
          className={`${theme.bgAccent} rounded-lg p-6 border ${theme.borderSecondary}`}
        >
          <h3 className={`text-lg font-semibold ${theme.textPrimary} mb-2`}>
            Payment Information
          </h3>
          <p className={`${theme.textSecondary} text-sm mb-4`}>
            This payment information will appear on your invoices for customer
            payments.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Bank Name */}
            <div className="md:col-span-2">
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                placeholder="Enter your bank name"
              />
            </div>

            {/* Account Number */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                placeholder="Enter account number"
              />
            </div>

            {/* Account Name */}
            <div>
              <label
                className={`block text-sm font-medium ${theme.textPrimary} mb-2`}
              >
                Account Name
              </label>
              <input
                type="text"
                name="accountName"
                value={formData.accountName}
                onChange={handleChange}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#667eea] ${theme.bgInput} ${theme.textPrimary} ${theme.borderSecondary}`}
                placeholder="Account holder name"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white rounded-lg shadow-lg hover:opacity-90 transition ${
              isSaving ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Save size={18} />
            {isSaving ? "Saving..." : "Save Company Information"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CompanyInfo;
