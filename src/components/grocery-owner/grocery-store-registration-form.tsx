
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
import { createGroceryStore } from '@/services/ownerService';
import { useState } from 'react';
import { Carrot, MapPin } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LocationPickerMap } from '../location-picker-map';

export const StoreSchema = z.object({
  name: z.string().min(3, { message: 'Store name must be at least 3 characters.' }),
  deliveryTime: z.string().min(1, { message: 'Please provide an estimated delivery time (e.g., 30-45 min).' }),
  address: z.string().min(10, "Please enter a full address for geocoding."),
  latitude: z.number({ required_error: "Please pin your location on the map." }),
  longitude: z.number({ required_error: "Please pin your location on the map." }),
});

interface GroceryStoreRegistrationFormProps {
  onStoreCreated: () => void;
}

export function GroceryStoreRegistrationForm({ onStoreCreated }: GroceryStoreRegistrationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof StoreSchema>>({
    resolver: zodResolver(StoreSchema),
    defaultValues: {
      name: '',
      deliveryTime: '',
      address: '',
    },
  });

  const handleMapLocationSelect = (loc: { latitude: number; longitude: number; address: string }) => {
    form.setValue('address', loc.address);
    form.setValue('latitude', loc.latitude);
    form.setValue('longitude', loc.longitude);
    toast({ title: 'Location Pinned!', description: 'Store address has been set.' });
  };

  const onSubmit = async (values: z.infer<typeof StoreSchema>) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to register a store.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await createGroceryStore(user.uid, values);
      toast({
        title: 'Application Submitted!',
        description: 'Your store details have been sent for review. We will notify you upon approval.',
      });
      onStoreCreated();
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
            <Carrot className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold">Register Your Grocery Store</CardTitle>
        <CardDescription className="text-lg">
          Tell us about your store to get started on Village Eats.
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Address</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Pin your location on the map to set the address." {...field} readOnly/>
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
                
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
