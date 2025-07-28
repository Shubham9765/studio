'use server';

/**
 * @fileOverview Provides trending restaurant recommendations based on order trends.
 *
 * - getTrendingRestaurantRecommendations - A function that retrieves trending restaurant recommendations.
 * - TrendingRestaurantRecommendationsInput - The input type for the getTrendingRestaurantRecommendations function.
 * - TrendingRestaurantRecommendationsOutput - The return type for the getTrendingRestaurantRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TrendingRestaurantRecommendationsInputSchema = z.object({
  customerId: z.string().describe('The ID of the customer requesting recommendations.'),
});
export type TrendingRestaurantRecommendationsInput = z.infer<typeof TrendingRestaurantRecommendationsInputSchema>;

const TrendingRestaurantRecommendationsOutputSchema = z.object({
  restaurantRecommendations: z.array(
    z.object({
      restaurantId: z.string().describe('The ID of the recommended restaurant.'),
      restaurantName: z.string().describe('The name of the recommended restaurant.'),
      cuisine: z.string().describe('The cuisine offered by the restaurant.'),
      averageRating: z.number().describe('The average rating of the restaurant.'),
      estimatedDeliveryTime: z.string().describe('Estimated delivery time'),
    })
  ).describe('A list of trending restaurant recommendations.'),
});
export type TrendingRestaurantRecommendationsOutput = z.infer<typeof TrendingRestaurantRecommendationsOutputSchema>;

export async function getTrendingRestaurantRecommendations(
  input: TrendingRestaurantRecommendationsInput
): Promise<TrendingRestaurantRecommendationsOutput> {
  return trendingRestaurantRecommendationsFlow(input);
}

const getTrendingRestaurants = ai.defineTool({
  name: 'getTrendingRestaurants',
  description: 'Retrieves a list of trending restaurants based on current and historical order data.',
  inputSchema: z.object({
    customerId: z.string().describe('The ID of the customer requesting recommendations.')
  }),
  outputSchema: z.array(
    z.object({
      restaurantId: z.string().describe('The ID of the recommended restaurant.'),
      restaurantName: z.string().describe('The name of the recommended restaurant.'),
      cuisine: z.string().describe('The cuisine offered by the restaurant.'),
      averageRating: z.number().describe('The average rating of the restaurant.'),
      estimatedDeliveryTime: z.string().describe('Estimated delivery time'),
    })
  ),
  run: async (input) => {
    // TODO: Replace with actual implementation to fetch trending restaurants.
    // This is a placeholder implementation.
    return [
      {
        restaurantId: '1',
        restaurantName: 'Village Pizza',
        cuisine: 'Italian',
        averageRating: 4.5,
        estimatedDeliveryTime: '30-40 minutes'
      },
      {
        restaurantId: '2',
        restaurantName: 'Spice Paradise',
        cuisine: 'Indian',
        averageRating: 4.2,
        estimatedDeliveryTime: '35-45 minutes'
      },
    ];
  },
});

const prompt = ai.definePrompt({
  name: 'trendingRestaurantRecommendationsPrompt',
  input: {schema: TrendingRestaurantRecommendationsInputSchema},
  output: {schema: TrendingRestaurantRecommendationsOutputSchema},
  tools: [getTrendingRestaurants],
  prompt: `Based on trending restaurants, provide recommendations for the customer.

  Consider using the getTrendingRestaurants tool to find options that the user might enjoy.
  Ensure that the output matches the schema.
  `,
});

const trendingRestaurantRecommendationsFlow = ai.defineFlow(
  {
    name: 'trendingRestaurantRecommendationsFlow',
    inputSchema: TrendingRestaurantRecommendationsInputSchema,
    outputSchema: TrendingRestaurantRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
