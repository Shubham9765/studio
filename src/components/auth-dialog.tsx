
'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { auth, db } from '@/services/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
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
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MailCheck } from 'lucide-react';


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const signUpSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).max(20),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  role: z.enum(['customer', 'owner', 'delivery']),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, { message: 'Please enter your email or username.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type SignUpValues = z.infer<typeof signUpSchema>;

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
  const [signUpStep, setSignUpStep] = useState<'details' | 'verify'>('details');
  const [signUpData, setSignUpData] = useState<SignUpValues | null>(null);

  const actionCodeSettings = {
      url: typeof window !== 'undefined' ? `${window.location.origin}` : 'http://localhost:9002',
      handleCodeInApp: true,
  };

  const signUpForm = useForm<SignUpValues>({
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

  const handleSignUp = async (values: SignUpValues) => {
    setIsSubmitting(true);
    try {
      const unique = await isUsernameUnique(values.username);
      if (!unique) {
        signUpForm.setError('username', { type: 'manual', message: 'Username is already taken.' });
        return;
      }
      
      await sendSignInLinkToEmail(auth, values.email, actionCodeSettings);
      
      // Save form data and email to local storage to be retrieved after email link redirect
      window.localStorage.setItem('emailForSignIn', values.email);
      window.localStorage.setItem('signUpData', JSON.stringify(values));

      setSignUpData(values);
      setSignUpStep('verify');

      toast({
        title: "Verification Email Sent",
        description: "Please check your inbox and click the link to complete your sign up.",
      });

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

    // If the input doesn't look like an email, assume it's a username
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
    // This effect handles the completion of sign-up after the user clicks the email link.
    const completeSignUp = async () => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            const storedSignUpData = window.localStorage.getItem('signUpData');
            
            if (!email || !storedSignUpData) {
                // This can happen if the user opens the link on a different device.
                // We prompt them to enter their email again.
                // For simplicity in this implementation, we'll show a toast.
                // A better UX would be a dedicated page or form.
                toast({
                    variant: 'destructive',
                    title: 'Verification Failed',
                    description: 'Could not find original sign-up information. Please try signing up again.',
                });
                return;
            }

            const signUpInfo: SignUpValues = JSON.parse(storedSignUpData);

            try {
                // This signs the user in with the link
                const result = await signInWithEmailLink(auth, email, window.location.href);
                const user = result.user;

                if (user) {
                     // We now have a signed-in user from the link.
                     // But they don't have a password yet. We need to create a new user record
                     // with a password and merge it. Firebase doesn't directly support this.
                     // The standard approach is to create the user with email/password now.
                     // First, we delete the temporary user created by the email link.
                    await user.delete();

                    // Then, create the user with the password.
                    const authResult = await createUserWithEmailAndPassword(auth, signUpInfo.email, signUpInfo.password);
                    const finalUser = authResult.user;

                    if (finalUser) {
                        const userRef = doc(db, 'users', finalUser.uid);
                        await setDoc(userRef, {
                            uid: finalUser.uid,
                            username: signUpInfo.username,
                            displayName: signUpInfo.username,
                            email: finalUser.email,
                            phone: signUpInfo.phone,
                            role: signUpInfo.role,
                            createdAt: new Date(),
                            status: 'active',
                            emailVerified: true
                        });
                    }

                    toast({ title: "Sign up successful!", description: "Welcome to Village Eats." });
                }
            } catch (error: any) {
                toast({
                    variant: "destructive",
                    title: "Sign up failed during verification.",
                    description: error.message || "There was a problem with your request.",
                });
            } finally {
                // Clean up local storage
                window.localStorage.removeItem('emailForSignIn');
                window.localStorage.removeItem('signUpData');
                onOpenChange(false);
            }
        }
    };
    completeSignUp();
  }, [toast, onOpenChange]);


  useEffect(() => {
    // Reset forms and state when dialog is closed
    if (!open) {
      signUpForm.reset();
      loginForm.reset();
      setSignUpStep('details');
      setSignUpData(null);
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
                 {signUpStep === 'details' && (
                    <>
                        <DialogHeader className="mb-4">
                            <DialogTitle>Create an Account</DialogTitle>
                            <DialogDescription>
                            Sign up to get started with Village Eats.
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
                                            <Input placeholder="+91" {...field} />
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
                                            className="flex items-center space-x-1 sm:space-x-4"
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
                                                <FormLabel className="font-normal">Owner</FormLabel>
                                            </FormItem>
                                            <FormItem className="flex items-center space-x-2 space-y-0">
                                                <FormControl>
                                                <RadioGroupItem value="delivery" />
                                                </FormControl>
                                                <FormLabel className="font-normal">Delivery</FormLabel>
                                            </FormItem>
                                            </RadioGroup>
                                        </FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
                                    {isSubmitting ? 'Sending Email...' : 'Continue'}
                                </Button>
                            </form>
                        </Form>
                    </>
                 )}
                 {signUpStep === 'verify' && (
                    <div className="text-center py-8">
                        <MailCheck className="mx-auto h-16 w-16 text-primary mb-4" />
                        <h2 className="text-2xl font-bold">Check Your Email</h2>
                        <p className="text-muted-foreground mt-2">
                            We've sent a verification link to <span className="font-semibold text-foreground">{signUpData?.email}</span>.
                        </p>
                        <p className="text-muted-foreground mt-2">
                            Please click the link in that email to complete your registration.
                        </p>
                    </div>
                 )}
            </TabsContent>
         </Tabs>
      </DialogContent>
    </Dialog>
  );
}
