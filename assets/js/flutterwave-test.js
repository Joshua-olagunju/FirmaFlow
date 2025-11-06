/**
 * TEST MODE: Fake Flutterwave Integration
 * =====================================
 * 
 * IMPORTANT: When going live, replace this with real Flutterwave integration
 * 
 * CHANGES NEEDED FOR PRODUCTION:
 * 1. Replace public_key with your real Flutterwave public key
 * 2. Update the script src to real Flutterwave checkout
 * 3. Remove fake simulation and use real FlutterwaveCheckout
 * 4. Update verify-payment.php endpoint to use real verification
 */

// =============================================
// TEST MODE: Fake Flutterwave configuration
// =============================================
// PRODUCTION: Replace with real keys from Flutterwave dashboard
const flutterwaveConfig = {
  public_key: "FLWPUBK_TEST-FAKE-KEY-FOR-TESTING", // PRODUCTION: Use real public key
  tx_ref: '', // Will be generated dynamically
  amount: 0,
  currency: "NGN",
  country: "NG",
  payment_options: "card,mobilemoney,ussd,banktransfer",
  redirect_url: window.location.origin + "/subscription-success.php",
  meta: {
    consumer_id: (typeof userIdFromSession !== 'undefined') ? userIdFromSession : 0,
    consumer_mac: "92a3-912ba-1192a",
  },
  customer: {
    email: (typeof userEmailFromSession !== 'undefined') ? userEmailFromSession : 'test@example.com',
    phone_number: "",
    name: (typeof userNameFromSession !== 'undefined') ? userNameFromSession : 'Test User',
  },
  callback: function (data) {

    if (typeof verifyPayment === 'function') {
      verifyPayment(data.transaction_id, data.tx_ref);
    } else {
      console.error('verifyPayment function not available');
    }
  },
  onclose: function() {

  },
  customizations: {
    title: "Firmaflow Subscription",
    description: "Monthly subscription payment",
    logo: window.location.origin + "/assets/images/logo.png",
  },
};

// Generate transaction reference (same for test and production)
function generateTxRef() {
  return 'FW_' + Math.floor(Math.random() * 1000000000) + '_' + Date.now();
}

// =============================================
// TEST MODE: Fake payment initiation
// =============================================
// PRODUCTION: Replace this function with real FlutterwaveCheckout
function initiatePayment(planName, amount) {

  
  // Update configuration for this payment with current user data
  const config = { ...flutterwaveConfig };
  config.tx_ref = generateTxRef() + '_' + amount + '_'; // Include amount for test simulation
  config.amount = amount;
  config.customizations.description = `${planName} Plan Subscription - Monthly`;
  
  // Update user data if available
  if (typeof userIdFromSession !== 'undefined') {
    config.meta.consumer_id = userIdFromSession;
  }
  if (typeof userEmailFromSession !== 'undefined') {
    config.customer.email = userEmailFromSession;
  }
  if (typeof userNameFromSession !== 'undefined') {
    config.customer.name = userNameFromSession;
  }
  
  // Store payment details for verification
  sessionStorage.setItem('pending_payment', JSON.stringify({
    plan: planName.toLowerCase(),
    amount: amount,
    tx_ref: config.tx_ref
  }));
  
  // =============================================
  // TEST MODE: Simulate Flutterwave checkout
  // =============================================
  // PRODUCTION: Replace this with: FlutterwaveCheckout(config);
  
  showPaymentModal(config);
}

// TEST MODE: Fake payment modal simulation
function showPaymentModal(config) {
  const modal = document.createElement('div');
  modal.innerHTML = `
    <div class="modal fade show" style="display: block; background: rgba(0,0,0,0.8);" tabindex="-1">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header bg-primary text-white">
            <h5 class="modal-title">
              <i class="ti ti-credit-card me-2"></i>
              Flutterwave Payment (TEST MODE)
            </h5>
            <button type="button" class="btn-close btn-close-white" onclick="closeTestPayment()"></button>
          </div>
          <div class="modal-body">
            <div class="alert alert-warning">
              <i class="ti ti-alert-triangle me-2"></i>
              <strong>TEST MODE:</strong> This is a simulated payment. No real charges will be made.
            </div>
            
            <div class="row">
              <div class="col-md-6">
                <h6>Payment Details</h6>
                <ul class="list-unstyled">
                  <li><strong>Amount:</strong> â‚¦${config.amount.toLocaleString()}</li>
                  <li><strong>Description:</strong> ${config.customizations.description}</li>
                  <li><strong>Reference:</strong> ${config.tx_ref}</li>
                </ul>
              </div>
              <div class="col-md-6">
                <h6>Customer Details</h6>
                <ul class="list-unstyled">
                  <li><strong>Name:</strong> ${config.customer.name}</li>
                  <li><strong>Email:</strong> ${config.customer.email}</li>
                </ul>
              </div>
            </div>
            
            <hr>
            
            <div class="text-center">
              <p class="text-muted mb-3">Choose test payment result:</p>
              <div class="d-grid gap-2 d-md-block">
                <button type="button" class="btn btn-success" onclick="simulateSuccessfulPayment('${config.tx_ref}')">
                  <i class="ti ti-check me-2"></i>Simulate Successful Payment
                </button>
                <button type="button" class="btn btn-danger" onclick="simulateFailedPayment()">
                  <i class="ti ti-x me-2"></i>Simulate Failed Payment
                </button>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <small class="text-muted">
              <i class="ti ti-info-circle me-1"></i>
              In production, this will be the real Flutterwave payment interface
            </small>
          </div>
        </div>
      </div>
    </div>
  `;
  
  modal.id = 'testPaymentModal';
  document.body.appendChild(modal);
}

// TEST MODE: Simulate successful payment
function simulateSuccessfulPayment(txRef) {
  const transactionId = 'TXN_' + Math.floor(Math.random() * 1000000);
  

  
  // Close modal
  closeTestPayment();
  
  // Show processing message
  showProcessingMessage();
  
  // Simulate payment verification after 2 seconds
  setTimeout(() => {
    verifyPayment(transactionId, txRef);
  }, 2000);
}

// TEST MODE: Simulate failed payment
function simulateFailedPayment() {
  closeTestPayment();
  showErrorMessage('Payment simulation failed. Please try again.');
}

// Close test payment modal
function closeTestPayment() {
  const modal = document.getElementById('testPaymentModal');
  if (modal) {
    modal.remove();
  }
}

// Show processing message
function showProcessingMessage() {
  const alert = document.createElement('div');
  alert.className = 'alert alert-info alert-dismissible fade show position-fixed';
  alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  alert.innerHTML = `
    <div class="d-flex align-items-center">
      <div class="spinner-border spinner-border-sm me-2" role="status"></div>
      <span>Processing payment...</span>
    </div>
  `;
  alert.id = 'processingAlert';
  document.body.appendChild(alert);
}

// =============================================
// PRODUCTION CODE: Keep this section as-is
// =============================================

// Verify payment with backend (same for test and production)
async function verifyPayment(transactionId, txRef) {
  try {
    // Remove processing message
    const processingAlert = document.getElementById('processingAlert');
    if (processingAlert) processingAlert.remove();
    
    // PRODUCTION: Change endpoint to 'api/verify-payment.php'
    const endpoint = 'api/verify-payment-test.php'; // TEST MODE
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      credentials: 'same-origin',
      body: JSON.stringify({
        transaction_id: transactionId,
        tx_ref: txRef
      })
    });
    
    const result = await response.json();

    
    if (result.success) {
      // Payment successful
      let message = 'Payment successful! Your subscription has been activated.';
      if (result.test_mode) {
        message = 'TEST MODE: ' + message;
      }
      showSuccessMessage(message);
      
      setTimeout(() => {
        window.location.href = 'index.php?subscription_activated=1';
      }, 3000);
    } else {
      // Payment failed
      showErrorMessage('Payment verification failed: ' + (result.error || 'Unknown error'));
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    showErrorMessage('An error occurred during payment verification. Please contact support.');
  }
}

// Show success message (same for test and production)
function showSuccessMessage(message) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-success alert-dismissible fade show position-fixed';
  alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  alert.innerHTML = `
    <i class="ti ti-check-circle me-2"></i>${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove();
    }
  }, 5000);
}

// Show error message (same for test and production)
function showErrorMessage(message) {
  const alert = document.createElement('div');
  alert.className = 'alert alert-danger alert-dismissible fade show position-fixed';
  alert.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
  alert.innerHTML = `
    <i class="ti ti-alert-circle me-2"></i>${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alert);
  
  setTimeout(() => {
    if (alert.parentNode) {
      alert.remove();
    }
  }, 5000);
}
