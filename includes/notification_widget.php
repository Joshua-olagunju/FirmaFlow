<?php
// Notification Widget for Dashboard pages
// Include this file to add notification alerts to any page

function renderNotificationWidget($page_name = '') {
    echo '<div id="page-notifications" class="mb-3"></div>';
    
    // Add inline script for this specific page
    echo '<script>
    document.addEventListener("DOMContentLoaded", function() {
        // Check for relevant notifications for this page
        checkPageNotifications("' . $page_name . '");
    });
    
    function checkPageNotifications(pageName) {
        // Check for overdue invoices if on financial pages
        if (["dashboard", "sales", "invoices", "reversal"].includes(pageName)) {
            fetch("api/notifications.php?action=check_overdue_invoices", {
                credentials: "same-origin"
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.overdue_count > 0) {
                    showPageNotification("overdue", {
                        count: data.overdue_count,
                        total: data.total_overdue,
                        message: `${data.overdue_count} overdue invoices (₦${new Intl.NumberFormat().format(data.total_overdue)})`
                    });
                }
            })
            .catch(error => console.error("Error checking overdue invoices:", error));
        }
        
        // Check for low stock if on inventory pages
        if (["dashboard", "products", "inventory"].includes(pageName)) {
            fetch("api/notifications.php?action=check_low_stock", {
                credentials: "same-origin"
            })
            .then(response => response.json())
            .then(data => {
                if (data.success && data.low_stock_count > 0) {
                    showPageNotification("low_stock", {
                        count: data.low_stock_count,
                        message: `${data.low_stock_count} products running low on stock`
                    });
                }
            })
            .catch(error => console.error("Error checking low stock:", error));
        }
    }
    
    function showPageNotification(type, data) {
        const container = document.getElementById("page-notifications");
        if (!container) return;
        
        // Check if notification already exists
        if (container.querySelector(`[data-notification-type="${type}"]`)) return;
        
        let alertClass = "alert-info";
        let icon = "fas fa-info-circle";
        let actionLink = "#";
        let actionText = "View";
        
        if (type === "overdue") {
            alertClass = "alert-danger";
            icon = "fas fa-exclamation-triangle";
            actionLink = "sales_reversal_management.php";
            actionText = "Manage Overdue";
        } else if (type === "low_stock") {
            alertClass = "alert-warning";
            icon = "fas fa-box";
            actionLink = "products.php";
            actionText = "Restock Items";
        }
        
        const alertHtml = `
            <div class="alert ${alertClass} alert-dismissible fade show" data-notification-type="${type}">
                <i class="${icon} me-2"></i>
                <strong>Alert:</strong> ${data.message}
                <a href="${actionLink}" class="btn btn-sm btn-outline-${alertClass.replace("alert-", "")} ms-2">
                    ${actionText}
                </a>
                <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
            </div>
        `;
        
        container.insertAdjacentHTML("beforeend", alertHtml);
    }
    </script>';
}

function renderQuickNotificationBadge() {
    echo '<div id="notification-badge" class="position-relative">
        <i class="fas fa-bell"></i>
        <span id="notification-count" class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style="display: none;">
            0
        </span>
    </div>';
    
    echo '<script>
    // Update notification badge count
    function updateNotificationBadge() {
        Promise.all([
            fetch("api/notifications.php?action=check_overdue_invoices", {credentials: "same-origin"}),
            fetch("api/notifications.php?action=check_low_stock", {credentials: "same-origin"})
        ])
        .then(responses => Promise.all(responses.map(r => r.json())))
        .then(([overdueData, stockData]) => {
            let totalNotifications = 0;
            
            if (overdueData.success && overdueData.overdue_count > 0) {
                totalNotifications += overdueData.overdue_count;
            }
            
            if (stockData.success && stockData.low_stock_count > 0) {
                totalNotifications += stockData.low_stock_count;
            }
            
            const badge = document.getElementById("notification-count");
            if (badge) {
                if (totalNotifications > 0) {
                    badge.textContent = totalNotifications;
                    badge.style.display = "inline";
                } else {
                    badge.style.display = "none";
                }
            }
        })
        .catch(error => console.error("Error updating notification badge:", error));
    }
    
    // Update badge on page load and every 2 minutes
    document.addEventListener("DOMContentLoaded", updateNotificationBadge);
    setInterval(updateNotificationBadge, 120000);
    </script>';
}
?>