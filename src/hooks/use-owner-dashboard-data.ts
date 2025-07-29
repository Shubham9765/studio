'use client';

import { useState, useEffect } from 'react';
import { getOwnerDashboardData, type OwnerDashboardData } from '@/services/ownerService';
import { useAuth } from './use-auth';

export function useOwnerDashboardData() {
  const { user } = useAuth();
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      // Don't fetch if there's no user, or the user is not an owner.
      // You might want to handle this case explicitly in your UI.
      setLoading(false);
      return;
    }

    const fetchData = async () => {
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
    };

    fetchData();
  }, [user]);

  return { data, loading, error };
}
