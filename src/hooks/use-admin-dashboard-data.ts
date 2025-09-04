
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getAdminDashboardData } from '@/services/adminClientService';
import type { AdminDashboardData } from '@/services/adminClientService';

const initialData: AdminDashboardData = {
    customerCount: 0,
    restaurantCount: 0,
    pendingRestaurantApprovalCount: 0,
    pendingGroceryApprovalCount: 0,
    users: [],
    restaurants: [],
    groceryStores: [],
    serviceableCities: [],
    bannerConfig: null,
    commissionRate: 0,
    allOrders: [],
};

export function useAdminDashboardData() {
  const [data, setData] = useState<AdminDashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminDashboardData();
      setData(result);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refreshData: fetchData };
}
