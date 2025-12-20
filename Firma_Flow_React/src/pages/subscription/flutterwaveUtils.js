import { buildApiUrl } from "../../config/api.config";

// Flutterwave public key - get from environment or config
const FLUTTERWAVE_PUBLIC_KEY = "FLWPUBK_TEST-SANDBOXDEMOKEY-X"; // Replace with actual key

/**
 * Initialize Flutterwave payment
 * @param {Object} params - Payment parameters
 * @param {number} params.amount - Amount to charge
 * @param {string} params.email - Customer email
 * @param {string} params.name - Customer name
 * @param {string} params.phone - Customer phone
 * @param {string} params.planName - Subscription plan name
 * @param {string} params.billingPeriod - Billing period
 * @param {Function} params.onSuccess - Success callback
 * @param {Function} params.onClose - Close callback
 */
export const initiateFlutterwavePayment = ({
  amount,
  email,
  name,
  phone,
  planName,
  billingPeriod,
  onSuccess,
  onClose,
}) => {
  // Check if Flutterwave script is loaded
  if (typeof FlutterwaveCheckout !== "function") {
    console.error("Flutterwave script not loaded");
    alert(
      "Payment system is not available. Please refresh the page and try again."
    );
    return;
  }

  // Generate unique transaction reference
  const txRef = `FW-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;

  // Flutterwave payment configuration
  const paymentConfig = {
    public_key: FLUTTERWAVE_PUBLIC_KEY,
    tx_ref: txRef,
    amount: amount,
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd,banktransfer",
    customer: {
      email: email,
      phone_number: phone,
      name: name,
    },
    customizations: {
      title: "FirmaFlow Subscription",
      description: `${planName} Plan - ${billingPeriod}`,
      logo: "https://firmaflowledger.com/assets/images/logo.png", // Update with your logo
    },
    callback: async (response) => {
      console.log("Payment callback:", response);

      // Verify payment on backend
      if (response.status === "successful") {
        try {
          const verifyResponse = await fetch(
            buildApiUrl("api/subscription.php?action=activate_subscription"),
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                transaction_id: response.transaction_id,
                tx_ref: response.tx_ref,
                plan: planName,
                billing_type: billingPeriod,
                amount: amount,
                currency: "NGN",
                payment_method: "flutterwave",
                payment_status: "successful"
              }),
            }
          );

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok && verifyData.success) {
            alert("Subscription activated successfully!");
            if (onSuccess) onSuccess();
          } else {
            alert(
              verifyData.error ||
                "Payment verification failed. Please contact support."
            );
          }
        } catch (error) {
          console.error("Error verifying payment:", error);
          alert("Failed to verify payment. Please contact support.");
        }
      } else {
        alert("Payment was not successful. Please try again.");
      }
    },
    onclose: () => {
      console.log("Payment modal closed");
      if (onClose) onClose();
    },
  };

  // Initialize Flutterwave payment modal
  FlutterwaveCheckout(paymentConfig);
};

/**
 * Load Flutterwave script dynamically
 * @returns {Promise<void>}
 */
export const loadFlutterwaveScript = () => {
  return new Promise((resolve, reject) => {
    // Check if already loaded
    if (typeof FlutterwaveCheckout === "function") {
      resolve();
      return;
    }

    // Create script element
    const script = document.createElement("script");
    script.src = "https://checkout.flutterwave.com/v3.js";
    script.async = true;

    script.onload = () => {
      console.log("Flutterwave script loaded");
      resolve();
    };

    script.onerror = () => {
      console.error("Failed to load Flutterwave script");
      reject(new Error("Failed to load Flutterwave payment system"));
    };

    document.body.appendChild(script);
  });
};

// Load script when module is imported
if (typeof window !== "undefined") {
  loadFlutterwaveScript().catch(console.error);
}
