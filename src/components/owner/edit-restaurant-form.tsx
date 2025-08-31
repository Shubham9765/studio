

'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTrigger,
  DialogTitle
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
import { Textarea } from '../ui/textarea';
import { LocationPickerMap } from '../location-picker-map';
import { MapPin, X } from 'lucide-react';
import { Badge } from '../ui/badge';

export const EditRestaurantSchema = z.object({
  name: z.string().min(3, { message: 'Restaurant name must be at least 3 characters.' }),
  cuisine: z.array(z.string()).min(1, { message: 'At least one cuisine type is required.' }),
  deliveryTime: z.string().min(1, { message: 'Please provide an estimated delivery time (e.g., 30-45 min).' }),
  deliveryCharge: z.coerce.number().min(0, { message: 'Delivery charge must be a positive number.' }),
  isOpen: z.boolean(),
  image: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  paymentMethodOption: z.enum(['cash', 'upi', 'both']).default('cash'),
  upiId: z.string().optional(),
  upiQrCodeUrl: z.string().url({ message: "Please enter a valid URL for the QR code." }).optional().or(z.literal('')),
  address: z.string().min(10, "Please enter a full address."),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  fssaiLicense: z.string().optional(),
  gstEnabled: z.boolean().default(false),
  gstin: z.string().optional(),
  isPureVeg: z.boolean().default(false),
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
  const [cuisineInput, setCuisineInput] = useState('');

  const getPaymentMethodOption = (methods?: Restaurant['paymentMethods']) => {
    if (!methods) return 'cash';
    if (methods.cash && methods.upi) return 'both';
    if (methods.upi) return 'upi';
    return 'cash';
  }

  const form = useForm<z.infer<typeof EditRestaurantSchema>>({
    resolver: zodResolver(EditRestaurantSchema),
    defaultValues: {
      name: restaurant?.name || '',
      cuisine: Array.isArray(restaurant?.cuisine) ? restaurant.cuisine : [restaurant?.cuisine].filter(Boolean),
      deliveryTime: restaurant?.deliveryTime || '',
      deliveryCharge: restaurant?.deliveryCharge || 0,
      isOpen: restaurant?.isOpen || false,
      image: restaurant?.image || '',
      paymentMethodOption: getPaymentMethodOption(restaurant?.paymentMethods),
      upiId: restaurant?.paymentMethods?.upiId || '',
      upiQrCodeUrl: restaurant?.paymentMethods?.upiQrCodeUrl || '',
      address: restaurant?.address || '',
      latitude: restaurant?.latitude,
      longitude: restaurant?.longitude,
      fssaiLicense: restaurant?.fssaiLicense || '',
      gstEnabled: restaurant?.gstEnabled || false,
      gstin: restaurant?.gstin || '',
      isPureVeg: restaurant?.isPureVeg || false,
    },
  });
  
  const currentCuisines = form.watch('cuisine');

  const handleAddCuisine = () => {
    if (cuisineInput && !currentCuisines.includes(cuisineInput)) {
        const newCuisines = [...currentCuisines, cuisineInput.trim()];
        form.setValue('cuisine', newCuisines, { shouldValidate: true });
        setCuisineInput('');
    }
  };

  const handleRemoveCuisine = (cuisineToRemove: string) => {
    const newCuisines = currentCuisines.filter((c) => c !== cuisineToRemove);
    form.setValue('cuisine', newCuisines, { shouldValidate: true });
  };


  const paymentMethodOption = form.watch('paymentMethodOption');
  const gstEnabled = form.watch('gstEnabled');
  
  useEffect(() => {
    if (restaurant && isOpen) {
      form.reset({
        name: restaurant.name,
        cuisine: Array.isArray(restaurant.cuisine) ? restaurant.cuisine : [restaurant.cuisine].filter(Boolean) as string[],
        deliveryTime: restaurant.deliveryTime,
        deliveryCharge: restaurant.deliveryCharge,
        isOpen: restaurant.isOpen,
        image: restaurant.image,
        paymentMethodOption: getPaymentMethodOption(restaurant.paymentMethods),
        upiId: restaurant.paymentMethods?.upiId || '',
        upiQrCodeUrl: restaurant.paymentMethods?.upiQrCodeUrl || '',
        address: restaurant.address || '',
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
        fssaiLicense: restaurant.fssaiLicense || '',
        gstEnabled: restaurant.gstEnabled || false,
        gstin: restaurant.gstin || '',
        isPureVeg: restaurant.isPureVeg || false,
      });
    }
  }, [restaurant, isOpen, form]);

  const handleMapLocationSelect = (loc: { latitude: number; longitude: number; address: string }) => {
    form.setValue('address', loc.address);
    form.setValue('latitude', loc.latitude);
    form.setValue('longitude', loc.longitude);
    toast({ title: 'Location Pinned!', description: 'Restaurant address has been updated.' });
  };

  const onSubmit = async (values: z.infer<typeof EditRestaurantSchema>) => {
    setIsSubmitting(true);
    try {
      await updateRestaurant(restaurant.id, values);
      toast({
        title: 'Restaurant Updated!',
        description: 'Your restaurant details have been successfully saved.',
      });
      onRestaurantUpdated();
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
                          <DialogTitle>Pin Your Restaurant's Location</DialogTitle>
                          <DialogDescription>Drag the marker to your exact location and click confirm.</DialogDescription>
                      </DialogHeader>
                      <LocationPickerMap onLocationSelect={handleMapLocationSelect} />
                  </DialogContent>
              </Dialog>
              
               <FormField
                control={form.control}
                name="cuisine"
                render={() => (
                    <FormItem>
                        <FormLabel>Cuisine Types</FormLabel>
                        <div className="flex gap-2">
                           <Input
                              placeholder="e.g., Indian"
                              value={cuisineInput}
                              onChange={(e) => setCuisineInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddCuisine();
                                }
                              }}
                           />
                           <Button type="button" onClick={handleAddCuisine}>Add</Button>
                        </div>
                         <FormDescription>
                          Add one or more cuisine types your restaurant serves.
                         </FormDescription>
                        <div className="flex flex-wrap gap-2">
                            {currentCuisines.map((c, i) => (
                                <Badge key={i} variant="secondary">
                                    {c}
                                    <button type="button" onClick={() => handleRemoveCuisine(c)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                      <X className="h-3 w-3" />
                                    </button>
                                </Badge>
                            ))}
                        </div>
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
                name="fssaiLicense"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>FSSAI License Number</FormLabel>
                    <FormControl>
                      <Input placeholder="14-digit FSSAI license number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 rounded-md border p-4">
                <FormField
                  control={form.control}
                  name="gstEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>Enable GST</FormLabel>
                        <FormDescription>
                          Apply 2.5% CGST and 2.5% SGST to orders.
                        </FormDescription>
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
                {gstEnabled && (
                  <FormField
                    control={form.control}
                    name="gstin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>GSTIN</FormLabel>
                        <FormControl>
                          <Input placeholder="15-digit GST Identification Number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              
              <FormField
                control={form.control}
                name="isPureVeg"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Pure Veg Restaurant</FormLabel>
                       <FormDescription>
                         Mark this if your restaurant serves only vegetarian food.
                       </FormDescription>
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
