
'use client';

import { useForm, Controller } from 'react-hook-form';
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
import { Utensils, MapPin, X } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { LocationPickerMap } from '../location-picker-map';
import { Badge } from '../ui/badge';


export const RestaurantSchema = z.object({
  name: z.string().min(3, { message: 'Restaurant name must be at least 3 characters.' }),
  cuisine: z.array(z.string()).min(1, { message: 'At least one cuisine is required.' }),
  deliveryTime: z.string().min(1, { message: 'Please provide an estimated delivery time (e.g., 30-45 min).' }),
  address: z.string().min(10, "Please enter a full address for geocoding."),
  latitude: z.number({ required_error: "Please pin your location on the map." }),
  longitude: z.number({ required_error: "Please pin your location on the map." }),
});

interface RestaurantRegistrationFormProps {
  onRestaurantCreated: () => void;
}

export function RestaurantRegistrationForm({ onRestaurantCreated }: RestaurantRegistrationFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cuisineInput, setCuisineInput] = useState('');

  const form = useForm<z.infer<typeof RestaurantSchema>>({
    resolver: zodResolver(RestaurantSchema),
    defaultValues: {
      name: '',
      cuisine: [],
      deliveryTime: '',
      address: '',
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


  const handleMapLocationSelect = (loc: { latitude: number; longitude: number; address: string }) => {
    form.setValue('address', loc.address);
    form.setValue('latitude', loc.latitude);
    form.setValue('longitude', loc.longitude);
    toast({ title: 'Location Pinned!', description: 'Restaurant address has been set.' });
  };

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
                         <FormMessage />
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
                            <DialogTitle>Pin Your Restaurant's Location</DialogTitle>
                            <DialogDescription>Drag the marker to your exact location and click confirm.</DialogDescription>
                        </DialogHeader>
                        <LocationPickerMap onLocationSelect={handleMapLocationSelect} />
                    </DialogContent>
                </Dialog>
                <Controller control={form.control} name="latitude" render={() => <FormMessage />} />
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit for Approval'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
