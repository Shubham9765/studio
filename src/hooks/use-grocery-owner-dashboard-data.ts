
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getGroceryOwnerDashboardData } from '@/services/ownerClientService';
import type { GroceryOwnerDashboardData } from '@/services/ownerClientService';
import { useAuth } from './use-auth';

export function useGroceryOwnerDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<GroceryOwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'grocery-owner') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getGroceryOwnerDashboardData(user.uid);
      setData(result);
    } catch (e: any) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refreshData: fetchData };
}
