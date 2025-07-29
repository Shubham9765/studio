
'use client';

import { useState, useEffect, useCallback } from 'react';
import { getOwnerDashboardData, type OwnerDashboardData } from '@/services/ownerService';
import { useAuth } from './use-auth';

export function useOwnerDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    if (!user || user.role !== 'owner') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const result = await getOwnerDashboardData(user.uid);
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
