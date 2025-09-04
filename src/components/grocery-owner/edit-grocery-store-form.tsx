
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { GroceryStore } from '@/lib/types';
import { Switch } from '../ui/switch';
import { updateGroceryStore } from '@/services/ownerService';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';
import { LocationPickerMap } from '../location-picker-map';
import { MapPin } from 'lucide-react';

export const EditStoreSchema = z.object({
  name: z.string().min(3, { message: 'Store name must be at least 3 characters.' }),
  deliveryTime: z.string().min(1, { message: 'Please provide an estimated delivery time (e.g., 30-45 min).' }),
  deliveryCharge: z.coerce.number().min(0, { message: 'Delivery charge must be a positive number.' }),
  isOpen: z.boolean(),
  image: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  address: z.string().min(10, "Please enter a full address."),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

interface EditGroceryStoreFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  store: GroceryStore;
  onStoreUpdated: () => void;
}

export function EditGroceryStoreForm({ isOpen, onOpenChange, store, onStoreUpdated }: EditGroceryStoreFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof EditStoreSchema>>({
    resolver: zodResolver(EditStoreSchema),
    defaultValues: {
      name: store?.name || '',
      deliveryTime: store?.deliveryTime || '',
      deliveryCharge: store?.deliveryCharge || 0,
      isOpen: store?.isOpen || false,
      image: store?.image || '',
      address: store?.address || '',
      latitude: store?.latitude,
      longitude: store?.longitude,
    },
  });

  useEffect(() => {
    if (store && isOpen) {
      form.reset({
        name: store.name,
        deliveryTime: store.deliveryTime,
        deliveryCharge: store.deliveryCharge,
        isOpen: store.isOpen,
        image: store.image,
        address: store.address || '',
        latitude: store.latitude,
        longitude: store.longitude,
      });
    }
  }, [store, isOpen, form]);

  const handleMapLocationSelect = (loc: { latitude: number; longitude: number; address: string }) => {
    form.setValue('address', loc.address);
    form.setValue('latitude', loc.latitude);
    form.setValue('longitude', loc.longitude);
    toast({ title: 'Location Pinned!', description: 'Store address has been updated.' });
  };

  const onSubmit = async (values: z.infer<typeof EditStoreSchema>) => {
    setIsSubmitting(true);
    try {
      await updateGroceryStore(store.id, values);
      toast({
        title: 'Store Updated!',
        description: 'Your store details have been successfully saved.',
      });
      onStoreUpdated();
      onOpenChange(false);
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
          <DialogTitle>Edit Store Profile</DialogTitle>
          <DialogDescription>
            Update your store's information. Click save when you're done.
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
                    <FormLabel>Store Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Fresh Mart" {...field} />
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
                      <Input placeholder="https://example.com/your-store.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      The main image for your store shown to customers.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="123 Main St, Anytown, USA" {...field} readOnly/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Dialog>
                  <DialogTrigger asChild>
                      <Button variant="outline" type="button" className="w-full"><MapPin className="mr-2 h-4 w-4" /> Pin Location on Map</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-2xl h-4/5 flex flex-col">
                      <DialogHeader>
                          <DialogTitle>Pin Your Store's Location</DialogTitle>
                          <DialogDescription>Drag the marker to your exact location and click confirm.</DialogDescription>
                      </DialogHeader>
                      <LocationPickerMap onLocationSelect={handleMapLocationSelect} />
                  </DialogContent>
              </Dialog>

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
                    <FormLabel>Delivery Charge (Rs.)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="e.g., 50.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
