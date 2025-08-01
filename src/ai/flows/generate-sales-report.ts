
'use server';

/**
 * @fileOverview Generates a sales report summary using AI.
 * 
 * - generateSalesReport - A function that generates a sales report for a given date range.
 * - GenerateSalesReportInput - The input type for the generateSalesReport function.
 * - GenerateSalesReportOutput - The return type for the generateSalesReport function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getOrdersByDateRange } from '@/services/adminService';
import { format } from 'date-fns';

const GenerateSalesReportInputSchema = z.object({
  startDate: z.string().describe('The start date of the report period in ISO 8601 format.'),
  endDate: z.string().describe('The end date of the report period in ISO 8601 format.'),
});
export type GenerateSalesReportInput = z.infer<typeof GenerateSalesReportInputSchema>;

const GenerateSalesReportOutputSchema = z.object({
  report: z.string().describe('The AI-generated sales report summary.'),
});
export type GenerateSalesReportOutput = z.infer<typeof GenerateSalesReportOutputSchema>;

export async function generateSalesReport(input: GenerateSalesReportInput): Promise<GenerateSalesReportOutput> {
  return generateSalesReportFlow(input);
}

const prompt = ai.definePrompt({
  name: 'salesReportPrompt',
  input: { schema: z.object({
      startDate: z.string(),
      endDate: z.string(),
      totalOrders: z.number(),
      totalRevenue: z.string(),
      topRestaurants: z.array(z.object({ name: z.string(), total: z.string() })),
      topItems: z.array(z.object({ name: z.string(), quantity: z.number() })),
  }) },
  output: { schema: GenerateSalesReportOutputSchema },
  prompt: `You are a business analyst AI. Generate a concise sales report based on the following data for the period of {{startDate}} to {{endDate}}.

  ## Key Metrics
  - **Total Orders:** {{totalOrders}}
  - **Total Revenue:** {{totalRevenue}}
  
  ## Top Performing Restaurants (by revenue)
  {{#each topRestaurants}}
  - {{name}}: {{total}}
  {{/each}}

  ## Top Selling Items (by quantity)
  {{#each topItems}}
  - {{name}}: {{quantity}} units
  {{/each}}
  
  ## Summary
  Provide a brief, insightful summary of the sales performance. Highlight any interesting trends or patterns you observe. Be professional and data-driven in your analysis.
  `,
});

const generateSalesReportFlow = ai.defineFlow(
  {
    name: 'generateSalesReportFlow',
    inputSchema: GenerateSalesReportInputSchema,
    outputSchema: GenerateSalesReportOutputSchema,
  },
  async (input) => {
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);

    const orders = await getOrdersByDateRange(startDate, endDate);
    
    if (orders.length === 0) {
        return { report: "No sales data found for the selected period." };
    }

    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);

    const restaurantSales: { [key: string]: number } = {};
    const itemSales: { [key: string]: number } = {};

    orders.forEach(order => {
        restaurantSales[order.restaurantName] = (restaurantSales[order.restaurantName] || 0) + order.total;
        order.items.forEach(item => {
            itemSales[item.name] = (itemSales[item.name] || 0) + item.quantity;
        });
    });

    const topRestaurants = Object.entries(restaurantSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, total]) => ({ name, total: `$${total.toFixed(2)}` }));
        
    const topItems = Object.entries(itemSales)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, quantity]) => ({ name, quantity }));

    const llmResponse = await prompt({
        startDate: format(startDate, 'PP'),
        endDate: format(endDate, 'PP'),
        totalOrders,
        totalRevenue: `$${totalRevenue.toFixed(2)}`,
        topRestaurants,
        topItems,
    });

    return llmResponse.output!;
  }
);

    
