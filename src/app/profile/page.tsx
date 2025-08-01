
'use client';

import { useAuth, type Address } from '@/hooks/use-auth';
import { Header } from '@/components/header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { updateUserProfile } from '@/services/userService';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, PlusCircle, Home, Building, Trash, Edit, User, MapPin, Phone } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const profileSchema = z.object({
  displayName: z.string().min(3, 'Name must be at least 3 characters.'),
});

const addressSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'Address label must be at least 2 characters.'),
    address: z.string().min(10, 'Address must be at least 10 characters.'),
    phone: z.string().min(10, 'Please enter a valid phone number.'),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type AddressFormValues = z.infer<typeof addressSchema>;

export default function ProfilePage() {
  const { user, loading, refreshAuth } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddressFormOpen, setIsAddressFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '' },
  });
  
  const addressForm = useForm<AddressFormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues: { name: '', address: '', phone: '' },
  });

  useEffect(() => {
    if (user) {
      profileForm.reset({ displayName: user.displayName || '' });
    }
  }, [user, profileForm]);

  useEffect(() => {
    if (editingAddress) {
        addressForm.reset(editingAddress);
    } else {
        addressForm.reset({ name: '', address: '', phone: '' });
    }
  }, [editingAddress, addressForm]);
  
  if (!loading && !user) {
      router.push('/');
      return null;
  }

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateUserProfile(user.uid, { displayName: data.displayName });
      await refreshAuth();
      toast({ title: 'Profile Updated', description: 'Your name has been successfully saved.' });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const onAddressSubmit = async (data: AddressFormValues) => {
      if (!user) return;
      setIsSubmitting(true);
      const currentAddresses = user.addresses || [];
      let updatedAddresses: Address[];

      if (editingAddress) {
          // Update existing address
          updatedAddresses = currentAddresses.map(addr => addr.id === editingAddress.id ? { ...addr, ...data } : addr);
      } else {
          // Add new address
          const newAddress: Address = { ...data, id: new Date().getTime().toString() };
          updatedAddresses = [...currentAddresses, newAddress];
      }

      try {
          await updateUserProfile(user.uid, { addresses: updatedAddresses });
          await refreshAuth();
          toast({ title: `Address ${editingAddress ? 'Updated' : 'Added'}`, description: 'Your address has been saved.' });
          setIsAddressFormOpen(false);
          setEditingAddress(null);
      } catch (error: any) {
          toast({ variant: 'destructive', title: 'Update Failed', description: error.message });
      } finally {
          setIsSubmitting(false);
      }
  }
  
  const handleDeleteAddress = async (addressId: string) => {
      if (!user || !confirm('Are you sure you want to delete this address?')) return;
      const updatedAddresses = (user.addresses || []).filter(addr => addr.id !== addressId);
      
      try {
          await updateUserProfile(user.uid, { addresses: updatedAddresses });
          await refreshAuth();
          toast({ title: 'Address Deleted', description: 'The address has been removed.' });
      } catch (error: any) {
           toast({ variant: 'destructive', title: 'Deletion Failed', description: error.message });
      }
  }
  
  const handleEditAddress = (address: Address) => {
      setEditingAddress(address);
      setIsAddressFormOpen(true);
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <h1 className="text-3xl font-bold mb-8">My Profile</h1>
        <div className="grid gap-12 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Manage your personal details.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                    <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-24" /></div>
                ) : user ? (
                    <Form {...profileForm}>
                        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                             <FormField
                                control={profileForm.control}
                                name="displayName"
                                render={({ field }) => (
                                    <FormItem>
                                    <FormLabel>Display Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Your full name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Name'}</Button>
                        </form>
                    </Form>
                ) : (
                    <Alert variant="destructive"><AlertTriangle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>Could not load user profile.</AlertDescription></Alert>
                )}
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Delivery Addresses</CardTitle>
                    <CardDescription>Manage your saved addresses for faster checkout.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {loading ? (
                        Array.from({length: 2}).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                     ) : user?.addresses && user.addresses.length > 0 ? (
                        user.addresses.map(addr => (
                            <div key={addr.id} className="flex items-start justify-between rounded-lg border p-4">
                                <div className="flex items-start gap-4">
                                     <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center mt-1">
                                        {addr.name.toLowerCase() === 'home' ? <Home className="h-5 w-5 text-muted-foreground" /> : <Building className="h-5 w-5 text-muted-foreground"/>}
                                     </div>
                                     <div className="text-sm">
                                        <p className="font-bold">{addr.name}</p>
                                        <p className="text-muted-foreground">{addr.address}</p>
                                        <p className="text-muted-foreground">{addr.phone}</p>
                                     </div>
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditAddress(addr)}>
                                        <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteAddress(addr.id)}>
                                        <Trash className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        ))
                     ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">No saved addresses.</p>
                     )}
                </CardContent>
                <CardFooter>
                    <Dialog open={isAddressFormOpen} onOpenChange={(isOpen) => { setIsAddressFormOpen(isOpen); if (!isOpen) setEditingAddress(null); }}>
                        <DialogTrigger asChild>
                            <Button variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Add New Address</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
                                <DialogDescription>
                                    Enter the details for your delivery address.
                                </DialogDescription>
                            </DialogHeader>
                            <Form {...addressForm}>
                                <form onSubmit={addressForm.handleSubmit(onAddressSubmit)} className="space-y-4">
                                    <FormField control={addressForm.control} name="name" render={({ field }) => (
                                        <FormItem><FormLabel>Label</FormLabel><FormControl><Input placeholder="e.g., Home, Work" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={addressForm.control} name="address" render={({ field }) => (
                                        <FormItem><FormLabel>Full Address</FormLabel><FormControl><Input placeholder="123 Main St, Anytown, USA" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <FormField control={addressForm.control} name="phone" render={({ field }) => (
                                        <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="Your contact number" {...field} /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Address'}</Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </CardFooter>
            </Card>
        </div>
      </main>
    </div>
  );
}

    