import { CheckCircle, AlertCircle, Calendar, Clock, XCircle } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import CancelSubscriptionModal from "./CancelSubscriptionModal";
import { useState } from "react";

const CurrentPlanCard = ({ subscriptionData, formatCurrency, onRefresh }) => {
  const { theme } = useTheme();
  const [showCancelModal, setShowCancelModal] = useState(false);

  if (!subscriptionData || !subscriptionData.data || !subscriptionData.data.subscription_plan) {
    return (
      <div className={`${theme.cardBg} rounded-lg shadow p-6`}>
        <div className="text-center py-8">
          <AlertCircle className="mx-auto mb-4 text-yellow-500" size={48} />
          <h3 className={`text-xl font-semibold mb-2 ${theme.text}`}>
            No Active Subscription
          </h3>
          <p className={`${theme.textSecondary} mb-4`}>
            You don't have an active subscription plan
          </p>
        </div>
      </div>
    );
  }

  const subscription = {
    id: subscriptionData.data.id,
    plan_name: subscriptionData.data.subscription_plan,
    status: subscriptionData.data.subscription_status || 'inactive',
    start_date: subscriptionData.data.subscription_start_date,
    end_date: subscriptionData.data.subscription_end_date,
    trial_ends_at: subscriptionData.data.trial_ends_at,
    amount: subscriptionData.data.amount || 0,
    billing_period: subscriptionData.data.billing_type || 'monthly'
  };
  const isActive = subscription.status === "active";
  const isTrial = subscription.status === "trial";
  const isCancelled = subscription.status === "cancelled";

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateTrialDaysRemaining = () => {
    if (!subscription.trial_ends_at) return 0;
    const trialEnd = new Date(subscription.trial_ends_at);
    const today = new Date();
    const diffTime = trialEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  const trialDaysRemaining = isTrial ? calculateTrialDaysRemaining() : 0;

  return (
    <>
      <div className={`${theme.cardBg} rounded-lg shadow p-4 md:p-6`}>
        {/* Status Badge */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
          <div>
            <h3 className={`text-xl font-semibold ${theme.text}`}>
              Current Subscription
            </h3>
          </div>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : isTrial
                ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
            }`}
          >
            {isActive && <CheckCircle className="mr-1" size={16} />}
            {isTrial && <Clock className="mr-1" size={16} />}
            {isCancelled && <XCircle className="mr-1" size={16} />}
            {subscription.status.charAt(0).toUpperCase() +
              subscription.status.slice(1)}
          </div>
        </div>

        {/* Trial Warning */}
        {isTrial && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle
                className="flex-shrink-0 mr-3 text-blue-500"
                size={20}
              />
              <div>
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                  Free Trial Active
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {trialDaysRemaining > 0
                    ? `Your trial expires in ${trialDaysRemaining} day${
                        trialDaysRemaining !== 1 ? "s" : ""
                      }. Subscribe now to continue using FirmaFlow.`
                    : "Your trial has expired. Please subscribe to continue."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Plan Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
          {/* Plan Name */}
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Plan</p>
            <p className={`text-lg font-semibold ${theme.text}`}>
              {subscription.plan_name || "N/A"}
            </p>
          </div>

          {/* Price */}
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>Price</p>
            <p className={`text-lg font-semibold ${theme.text}`}>
              {formatCurrency(subscription.amount || 0)}/
              {subscription.billing_period || "month"}
            </p>
          </div>

          {/* Start Date */}
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>
              <Calendar className="inline mr-1" size={14} />
              Start Date
            </p>
            <p className={`text-base ${theme.text}`}>
              {formatDate(subscription.start_date)}
            </p>
          </div>

          {/* End Date */}
          <div>
            <p className={`text-sm ${theme.textSecondary} mb-1`}>
              <Calendar className="inline mr-1" size={14} />
              {isTrial ? "Trial Ends" : "Next Billing"}
            </p>
            <p className={`text-base ${theme.text}`}>
              {formatDate(
                isTrial ? subscription.trial_ends_at : subscription.end_date
              )}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {isActive && (
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={() => setShowCancelModal(true)}
              className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition text-sm font-medium"
            >
              Cancel Subscription
            </button>
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <CancelSubscriptionModal
          subscription={subscription}
          onClose={() => setShowCancelModal(false)}
          onSuccess={() => {
            setShowCancelModal(false);
            onRefresh();
          }}
        />
      )}
    </>
  );
};

export default CurrentPlanCard;
