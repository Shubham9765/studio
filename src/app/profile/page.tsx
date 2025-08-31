
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
import { getCoordinatesForAddress } from '@/services/restaurantClientService';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, PlusCircle, Home, Building, Trash, Edit, User, MapPin, Phone, Map } from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LocationPickerMap } from '@/components/location-picker-map';


const profileSchema = z.object({
  displayName: z.string().min(3, 'Name must be at least 3 characters.'),
});

const addressSchema = z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'Address label must be at least 2 characters.'),
    address: z.string().min(10, 'Address must be at least 10 characters.'),
    phone: z.string().min(10, 'Please enter a valid phone number.'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
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
    if (!loading && !user) {
        router.push('/');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      profileForm.reset({ displayName: user.displayName || '' });
    }
  }, [user, profileForm]);

  useEffect(() => {
    if (editingAddress) {
        addressForm.reset(editingAddress);
    } else {
        addressForm.reset({ name: '', address: '', phone: user?.phone || '' });
    }
  }, [editingAddress, addressForm, user?.phone]);
  
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
      
      let coords = { latitude: data.latitude, longitude: data.longitude };
      if (!coords.latitude || !coords.longitude) {
          const fetchedCoords = await getCoordinatesForAddress(data.address);
           if (!fetchedCoords) {
              toast({ variant: 'destructive', title: 'Address Not Found', description: 'Could not find coordinates for this address. Please try a more specific address.' });
              setIsSubmitting(false);
              return;
          }
          coords = fetchedCoords;
      }
      

      const currentAddresses = user.addresses || [];
      let updatedAddresses: Address[];
      
      if (editingAddress) {
          updatedAddresses = currentAddresses.map(addr => addr.id === editingAddress.id ? { ...addr, ...data, ...coords } : addr);
      } else {
          const newAddress: Address = { ...data, id: new Date().getTime().toString(), ...coords };
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

   const handleMapLocationSelect = (loc: { latitude: number; longitude: number; address: string }) => {
        addressForm.setValue('address', loc.address);
        addressForm.setValue('latitude', loc.latitude);
        addressForm.setValue('longitude', loc.longitude);
        toast({ title: 'Location Pinned!', description: 'Address has been updated.' });
    };
  
  const handleDeleteAddress = async (addressId: string) => {
      if (!user) return;
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

  if (loading || !user) {
    return (
        <div className="min-h-screen bg-background">
         <Header />
            <main className="container py-8">
                <h1 className="text-3xl font-bold mb-8">My Profile</h1>
                <div className="grid gap-12 md:grid-cols-2">
                   <Card>
                        <CardHeader>
                            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                            <div className="text-sm text-muted-foreground"><Skeleton className="h-4 w-3/4" /></div>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-4"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-24" /></div>
                        </CardContent>
                   </Card>
                   <Card>
                         <CardHeader>
                            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                            <div className="text-sm text-muted-foreground"><Skeleton className="h-4 w-3/4" /></div>
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                         <CardFooter>
                            <Skeleton className="h-10 w-36" />
                         </CardFooter>
                   </Card>
                </div>
            </main>
        </div>
    );
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
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Delivery Addresses</CardTitle>
                    <CardDescription>Manage your saved addresses for faster checkout.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {user?.addresses && user.addresses.length > 0 ? (
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
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                <Trash className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete the address "{addr.name}". This action cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteAddress(addr.id)}>Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
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
                                        <FormItem><FormLabel>Full Address</FormLabel><FormControl><Input placeholder="123 Main St, Anytown, USA" {...field} readOnly /></FormControl><FormMessage /></FormItem>
                                    )}/>
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" type="button"><MapPin className="mr-2 h-4 w-4" /> Pin Location on Map</Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-2xl h-4/5 flex flex-col">
                                            <DialogHeader>
                                                <DialogTitle>Pin Your Address</DialogTitle>
                                                <DialogDescription>Drag the marker to your exact location and click confirm.</DialogDescription>
                                            </DialogHeader>
                                            <LocationPickerMap onLocationSelect={handleMapLocationSelect} />
                                        </DialogContent>
                                    </Dialog>
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

    
