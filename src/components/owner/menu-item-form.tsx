
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
import { Textarea } from '../ui/textarea';
import type { MenuItem } from '@/lib/types';
import { addMenuItem, updateMenuItem } from '@/services/ownerService';
import { Switch } from '../ui/switch';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

export const MenuItemSchema = z.object({
  name: z.string().min(3, { message: 'Item name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().min(0, { message: 'Price must be a positive number.' }),
  category: z.string().min(3, { message: 'Category must be at least 3 characters.' }),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  isAvailable: z.boolean().default(true),
  type: z.enum(['veg', 'non-veg']).default('veg'),
});

interface MenuItemFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  restaurantId: string;
  menuItem?: MenuItem | null;
  onFormSubmit: () => void;
}

export function MenuItemForm({ isOpen, onOpenChange, restaurantId, menuItem, onFormSubmit }: MenuItemFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!menuItem;

  const form = useForm<z.infer<typeof MenuItemSchema>>({
    resolver: zodResolver(MenuItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      imageUrl: '',
      isAvailable: true,
      type: 'veg',
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (isEditing && menuItem) {
            form.reset({
                name: menuItem.name,
                description: menuItem.description,
                price: menuItem.price,
                category: menuItem.category,
                imageUrl: menuItem.imageUrl || '',
                isAvailable: menuItem.isAvailable,
                type: menuItem.type || 'veg',
            });
        } else {
            form.reset({
                name: '',
                description: '',
                price: 0,
                category: '',
                imageUrl: '',
                isAvailable: true,
                type: 'veg',
            });
        }
    }
  }, [isOpen, isEditing, menuItem, form]);

  const onSubmit = async (values: z.infer<typeof MenuItemSchema>) => {
    setIsSubmitting(true);
    try {
        if (isEditing && menuItem) {
            await updateMenuItem(restaurantId, menuItem.id, values);
            toast({ title: 'Menu Item Updated!', description: `${values.name} has been updated.` });
        } else {
            await addMenuItem(restaurantId, values);
            toast({ title: 'Menu Item Added!', description: `${values.name} has been added to your menu.` });
        }
        onFormSubmit();
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
          <DialogTitle>{isEditing ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this menu item.' : 'Fill out the details for the new menu item.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Veggie Burger" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A delicious burger with a veggie patty..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Price (Rs.)</FormLabel>
                    <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 99.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Appetizer, Main" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="https://example.com/image.png" {...field} />
                  </FormControl>
                   <FormDescription>
                    Optional: A link to an image of the menu item.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                    <FormItem className="space-y-3 pt-2">
                    <FormLabel>Dietary Type</FormLabel>
                    <FormControl>
                        <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex items-center space-x-4"
                        >
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="veg" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2">
                                <span className="w-4 h-4 rounded-sm border border-green-600 bg-white flex items-center justify-center">
                                    <span className="w-2 h-2 rounded-full bg-green-600"></span>
                                </span>
                                Veg
                            </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                            <RadioGroupItem value="non-veg" />
                            </FormControl>
                            <FormLabel className="font-normal flex items-center gap-2">
                                 <span className="w-4 h-4 rounded-sm border border-red-600 bg-white flex items-center justify-center">
                                    <span className="w-2 h-2 rounded-full bg-red-600"></span>
                                </span>
                                Non-Veg
                            </FormLabel>
                        </FormItem>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="isAvailable"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Available for Ordering</FormLabel>
                     <p className="text-sm text-muted-foreground">
                        Controls whether customers can order this item.
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
            <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (isEditing ? 'Saving...' : 'Adding...') : (isEditing ? 'Save Changes' : 'Add Item')}
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
