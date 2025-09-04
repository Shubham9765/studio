
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
import type { GroceryItem } from '@/lib/types';
import { addGroceryItem, updateGroceryItem } from '@/services/ownerService';
import { Switch } from '../ui/switch';

export const GroceryItemSchema = z.object({
  name: z.string().min(3, { message: 'Item name must be at least 3 characters.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  price: z.coerce.number().min(0, { message: 'Price must be a positive number.' }),
  category: z.string().min(2, { message: 'Please enter a category.' }),
  unit: z.string().min(1, { message: 'Please specify a unit (e.g., kg, piece).' }),
  imageUrl: z.string().url({ message: "Please enter a valid URL." }).optional().or(z.literal('')),
  isAvailable: z.boolean().default(true),
});

interface GroceryItemFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: string;
  item?: GroceryItem | null;
  onFormSubmit: () => void;
}

export function GroceryItemForm({ isOpen, onOpenChange, storeId, item, onFormSubmit }: GroceryItemFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!item;

  const form = useForm<z.infer<typeof GroceryItemSchema>>({
    resolver: zodResolver(GroceryItemSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category: '',
      unit: 'kg',
      imageUrl: '',
      isAvailable: true,
    },
  });

  useEffect(() => {
    if (isOpen) {
        if (isEditing && item) {
            form.reset({
                name: item.name,
                description: item.description,
                price: item.price,
                category: item.category,
                unit: item.unit || 'kg',
                imageUrl: item.imageUrl || '',
                isAvailable: item.isAvailable,
            });
        } else {
            form.reset({
                name: '',
                description: '',
                price: 0,
                category: '',
                unit: 'kg',
                imageUrl: '',
                isAvailable: true,
            });
        }
    }
  }, [isOpen, isEditing, item, form]);

  const onSubmit = async (values: z.infer<typeof GroceryItemSchema>) => {
    setIsSubmitting(true);
    try {
        if (isEditing && item) {
            await updateGroceryItem(storeId, item.id, values);
            toast({ title: 'Item Updated!', description: `${values.name} has been updated.` });
        } else {
            await addGroceryItem(storeId, values as any);
            toast({ title: 'Item Added!', description: `${values.name} has been added to your store.` });
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
          <DialogTitle>{isEditing ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Update the details for this item.' : 'Fill out the details for the new item.'}
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
                    <Input placeholder="e.g., Fresh Apples" {...field} />
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
                    <Textarea placeholder="Crisp and juicy apples, perfect for snacking." {...field} />
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
                        <Input type="number" step="0.01" placeholder="e.g., 120.00" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="unit"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., kg, piece, dozen" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Category</FormLabel>
                     <FormControl>
                        <Input placeholder="e.g., Fruits & Vegetables" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
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
                    Optional: A link to an image of the item.
                  </FormDescription>
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
