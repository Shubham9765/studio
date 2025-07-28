
'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { auth, db } from '@/services/firebase';
import 'firebaseui/dist/firebaseui.css';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Role = 'customer' | 'owner';

const signUpSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).max(20),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['customer', 'owner']),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, { message: 'Please enter your email or username.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

async function isUsernameUnique(username: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
}

export function AuthDialog(props: Props) {
  const { open, onOpenChange } = props;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
      phone: '+91',
      password: '',
      role: 'customer',
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrUsername: '',
      password: '',
    },
  });

  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    try {
      // Check if username is unique
      const unique = await isUsernameUnique(values.username);
      if (!unique) {
        signUpForm.setError('username', { type: 'manual', message: 'Username is already taken.' });
        setIsSubmitting(false);
        return;
      }
      
      const authResult = await createUserWithEmailAndPassword(auth, values.email, values.password);
      const user = authResult.user;

      if (user) {
        const userRef = doc(db, 'users', user.uid);
        await setDoc(userRef, {
          uid: user.uid,
          username: values.username,
          email: user.email,
          phone: values.phone,
          role: values.role,
          createdAt: new Date(),
        });
      }
      toast({ title: "Sign up successful!", description: "Welcome to Village Eats." });
      onOpenChange(false);

    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Uh oh! Something went wrong.",
        description: error.message || "There was a problem with your request.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    setIsSubmitting(true);
    let email = values.emailOrUsername;

    // Check if the input is a username
    if (!email.includes('@')) {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', email));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          toast({ variant: "destructive", title: "Login Failed", description: "User not found." });
          setIsSubmitting(false);
          return;
        }
        const userData = querySnapshot.docs[0].data();
        email = userData.email;
      } catch (error) {
        toast({ variant: "destructive", title: "Login Error", description: "Could not verify username." });
        setIsSubmitting(false);
        return;
      }
    }

    try {
      await signInWithEmailAndPassword(auth, email, values.password);
      toast({ title: "Login successful!" });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: "Invalid credentials. Please try again.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };


  useEffect(() => {
    // Reset forms when dialog is closed
    if (!open) {
      signUpForm.reset();
      loginForm.reset();
    }
  }, [open, signUpForm, loginForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
         <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
                <DialogHeader className="mb-4">
                    <DialogTitle>Welcome Back!</DialogTitle>
                    <DialogDescription>
                        Sign in to continue to Village Eats.
                    </DialogDescription>
                </DialogHeader>
                <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                        <FormField
                        control={loginForm.control}
                        name="emailOrUsername"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Email or Username</FormLabel>
                            <FormControl>
                                <Input placeholder="you@email.com or your_username" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                           {isSubmitting ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="signup">
                 <DialogHeader className="mb-4">
                    <DialogTitle>Create an Account</DialogTitle>
                    <DialogDescription>
                        To get started, please create a new account.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...signUpForm}>
                    <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-2">
                        <FormField
                            control={signUpForm.control}
                            name="username"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="your_username" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={signUpForm.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="you@email.com" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={signUpForm.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={signUpForm.control}
                            name="password"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={signUpForm.control}
                            name="role"
                            render={({ field }) => (
                                <FormItem className="space-y-3 pt-2">
                                <FormLabel>I am a...</FormLabel>
                                <FormControl>
                                    <RadioGroup
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    className="flex items-center space-x-4"
                                    >
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="customer" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Customer</FormLabel>
                                    </FormItem>
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                        <RadioGroupItem value="owner" />
                                        </FormControl>
                                        <FormLabel className="font-normal">Restaurant Owner</FormLabel>
                                    </FormItem>
                                    </RadioGroup>
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating Account...' : 'Create Account'}
                        </Button>
                    </form>
                </Form>
            </TabsContent>
         </Tabs>
      </DialogContent>
    </Dialog>
  );
}

    