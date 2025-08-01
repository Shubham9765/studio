
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Restaurant } from '@/lib/types';
import { Switch } from '../ui/switch';
import { updateRestaurant } from '@/services/ownerService';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';

export const EditRestaurantSchema = z.object({
  name: z.string().min(3, { message: 'Restaurant name must be at least 3 characters.' }),
  cuisine: z.string().min(3, { message: 'Cuisine type must be at least 3 characters.' }),
  deliveryTime: z.string().min(1, { message: 'Please provide an estimated delivery time (e.g., 30-45 min).' }),
  deliveryCharge: z.coerce.number().min(0, { message: 'Delivery charge must be a positive number.' }),
  isOpen: z.boolean(),
  image: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  paymentMethodOption: z.enum(['cash', 'upi', 'both']).default('cash'),
  upiId: z.string().optional(),
  upiQrCodeUrl: z.string().url({ message: "Please enter a valid URL for the QR code." }).optional().or(z.literal('')),
});

interface EditRestaurantFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant: Restaurant;
  onRestaurantUpdated: () => void;
}

export function EditRestaurantForm({ isOpen, onOpenChange, restaurant, onRestaurantUpdated }: EditRestaurantFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getPaymentMethodOption = (methods?: Restaurant['paymentMethods']) => {
    if (!methods) return 'cash'; // Guard clause for undefined methods
    if (methods.cash && methods.upi) return 'both';
    if (methods.upi) return 'upi';
    return 'cash';
  }

  const form = useForm<z.infer<typeof EditRestaurantSchema>>({
    resolver: zodResolver(EditRestaurantSchema),
    defaultValues: {
      name: restaurant?.name || '',
      cuisine: restaurant?.cuisine || '',
      deliveryTime: restaurant?.deliveryTime || '',
      deliveryCharge: restaurant?.deliveryCharge || 0,
      isOpen: restaurant?.isOpen || false,
      image: restaurant?.image || '',
      paymentMethodOption: getPaymentMethodOption(restaurant?.paymentMethods),
      upiId: restaurant?.paymentMethods?.upiId || '',
      upiQrCodeUrl: restaurant?.paymentMethods?.upiQrCodeUrl || '',
    },
  });

  const paymentMethodOption = form.watch('paymentMethodOption');
  
  useEffect(() => {
    if (restaurant && isOpen) {
      form.reset({
        name: restaurant.name,
        cuisine: restaurant.cuisine,
        deliveryTime: restaurant.deliveryTime,
        deliveryCharge: restaurant.deliveryCharge,
        isOpen: restaurant.isOpen,
        image: restaurant.image,
        paymentMethodOption: getPaymentMethodOption(restaurant.paymentMethods),
        upiId: restaurant.paymentMethods?.upiId || '',
        upiQrCodeUrl: restaurant.paymentMethods?.upiQrCodeUrl || '',
      });
    }
  }, [restaurant, isOpen, form]);

  const onSubmit = async (values: z.infer<typeof EditRestaurantSchema>) => {
    setIsSubmitting(true);
    try {
      await updateRestaurant(restaurant.id, values);
      toast({
        title: 'Restaurant Updated!',
        description: 'Your restaurant details have been successfully saved.',
      });
      onRestaurantUpdated();
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
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Restaurant Profile</DialogTitle>
          <DialogDescription>
            Update your restaurant's information. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/your-restaurant.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      The main image for your restaurant shown to customers.
                    </FormDescription>
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
              <FormField
                control={form.control}
                name="deliveryCharge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Charge ($)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 2.50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                  control={form.control}
                  name="paymentMethodOption"
                  render={({ field }) => (
                      <FormItem className="space-y-3">
                      <FormLabel>Accepted Payment Methods</FormLabel>
                      <FormControl>
                          <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex flex-col space-y-1"
                          >
                          <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                              <RadioGroupItem value="cash" />
                              </FormControl>
                              <FormLabel className="font-normal">Cash Only</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                              <RadioGroupItem value="upi" />
                              </FormControl>
                              <FormLabel className="font-normal">UPI Only</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0">
                              <FormControl>
                              <RadioGroupItem value="both" />
                              </FormControl>
                              <FormLabel className="font-normal">Both Cash & UPI</FormLabel>
                          </FormItem>
                          </RadioGroup>
                      </FormControl>
                      <FormMessage />
                      </FormItem>
                  )}
              />

              {(paymentMethodOption === 'upi' || paymentMethodOption === 'both') && (
                  <div className="space-y-4 rounded-md border p-4">
                      <FormField
                      control={form.control}
                      name="upiId"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>UPI ID</FormLabel>
                          <FormControl>
                              <Input placeholder="your-upi-id@bank" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                      <FormField
                      control={form.control}
                      name="upiQrCodeUrl"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>UPI QR Code Image URL</FormLabel>
                          <FormControl>
                              <Input placeholder="https://example.com/qr.png" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                  </div>
              )}


              <FormField
                control={form.control}
                name="isOpen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Open for Orders</FormLabel>
                      <p className="text-sm text-muted-foreground">
                          Controls whether customers can place orders.
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
               <DialogFooter className="sticky bottom-0 bg-background py-4">
                  <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
              </DialogFooter>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
