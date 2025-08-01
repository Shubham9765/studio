
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
import { getRestaurants } from '@/services/restaurantService';
import type { Restaurant } from '@/lib/types';

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


async function fetchTrendingRestaurants(input: { customerId: string }): Promise<Partial<Restaurant>[]> {
    const restaurants = await getRestaurants();
    // Return the first 2 restaurants as trending for now.
    return restaurants.slice(0, 2).map(r => ({
      id: r.id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating,
      deliveryTime: r.deliveryTime,
    }));
}

const getTrendingRestaurantsTool = ai.defineTool({
  name: 'getTrendingRestaurants',
  description: 'Retrieves a list of trending restaurants based on current and historical order data.',
  inputSchema: z.object({
    customerId: z.string().describe('The ID of the customer requesting recommendations.')
  }),
  outputSchema: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      cuisine: z.string(),
      rating: z.number(),
      deliveryTime: z.string(),
    })
  ),
  run: async (input) => fetchTrendingRestaurants(input),
});


export async function getTrendingRestaurantRecommendations(
  input: TrendingRestaurantRecommendationsInput
): Promise<TrendingRestaurantRecommendationsOutput> {
  return trendingRestaurantRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'trendingRestaurantRecommendationsPrompt',
  input: {schema: TrendingRestaurantRecommendationsInputSchema},
  output: {schema: TrendingRestaurantRecommendationsOutputSchema},
  tools: [getTrendingRestaurantsTool],
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
    const llmResponse = await prompt(input);
    const toolResponse = llmResponse.toolRequest();
    
    if (toolResponse) {
        const toolResult = await toolResponse.run();
        const finalResponse = await llmResponse.forward(toolResult);
        return finalResponse.output()!;
    }

    return llmResponse.output()!;
  }
);
