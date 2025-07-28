'use client';

import { runFlow } from '@genkit-ai/next/client';
import { useState, useEffect } from 'react';
import { getTrendingRestaurantRecommendations, type TrendingRestaurantRecommendationsOutput } from '@/ai/flows/trending-restaurant-recommendations';
import type { Restaurant } from '@/lib/types';

export function useTrendingRestaurants(customerId: string) {
  const [data, setData] = useState<Restaurant[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!customerId) return;

    const fetchTrending = async () => {
      setLoading(true);
      setError(null);
      try {
        const response: TrendingRestaurantRecommendationsOutput = await runFlow(getTrendingRestaurantRecommendations, { customerId });
        const mappedData: Restaurant[] = response.restaurantRecommendations.map(r => ({
          id: r.restaurantId,
          name: r.restaurantName,
          cuisine: r.cuisine,
          rating: r.averageRating,
          deliveryTime: r.estimatedDeliveryTime,
          image: 'https://placehold.co/600x400',
          dataAiHint: r.cuisine.toLowerCase().split(' ')[0]
        }));
        setData(mappedData);
      } catch (e: any) {
        setError(e);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
  }, [customerId]);

  return { data, loading, error };
}
