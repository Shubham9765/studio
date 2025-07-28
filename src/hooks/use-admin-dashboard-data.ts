
'use client';

import { useState, useEffect } from 'react';
import { getAdminDashboardData, type AdminDashboardData } from '@/services/adminService';
import type { AppUser } from './use-auth';
import type { Restaurant } from '@/lib/types';

const initialData: AdminDashboardData = {
    customerCount: 0,
    restaurantCount: 0,
    pendingApprovalCount: 0,
    users: [],
    restaurants: [],
};

export function useAdminDashboardData() {
  const [data, setData] = useState<AdminDashboardData>(initialData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
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
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
