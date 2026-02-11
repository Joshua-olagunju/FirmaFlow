import { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/api.config';

const useSubscription = () => {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSubscriptionStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('api/subscription_status.php'), {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setSubscriptionData(data);
        setError(null);
      } else {
        setError(data.message || 'Failed to fetch subscription status');
        setSubscriptionData(null);
      }
    } catch (err) {
      setError(err.message);
      setSubscriptionData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionStatus();
  }, []);

  return {
    subscriptionData,
    loading,
    error,
    hasAccess: subscriptionData?.has_access || false,
    isExpired: !subscriptionData?.has_access,
    isTrial: subscriptionData?.is_trial || false,
    daysRemaining: subscriptionData?.days_remaining || 0,
    plan: subscriptionData?.plan || 'free',
    status: subscriptionData?.status || 'unknown',
    message: subscriptionData?.message || '',
    refreshSubscription: fetchSubscriptionStatus,
  };
};

export default useSubscription;