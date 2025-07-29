
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { createRestaurant } from '@/services/ownerService';
import { useState } from 'react';
import { Utensils } from 'lucide-react';

export const RestaurantSchema = z.object({
  name: z.string().min(3, { message: 'Restaurant name must be at least 3 characters.' }),
  cuisine: z.string().min(3, { message: 'Cuisine type must be at least 3 characters.' }),
  deliveryTime: z.string().min(1, { message: 'Please provide an estimated delivery time (e.g., 30-45 min).' }),
});

interface RestaurantRegistrationFormProps {
  onRestaurantCreated: () => void;
}

export function RestaurantRegistrationForm({ onRestaurantCreated }: RestaurantRegistrationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof RestaurantSchema>>({
    resolver: zodResolver(RestaurantSchema),
    defaultValues: {
      name: '',
      cuisine: '',
      deliveryTime: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof RestaurantSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to register a restaurant.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await createRestaurant(user.uid, values);
      toast({
        title: 'Application Submitted!',
        description: 'Your restaurant details have been sent for review. We will notify you upon approval.',
      });
      onRestaurantCreated();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: error.message || 'There was a problem with your request.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
            <Utensils className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">Register Your Restaurant</CardTitle>
        <CardDescription className="text-lg">
          Tell us about your restaurant to get started on Village Eats.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Restaurant Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., The Spicy Spoon" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="cuisine"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cuisine Type</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Indian, Italian, Mexican" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="deliveryTime"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estimated Delivery Time</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., 30-45 minutes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
