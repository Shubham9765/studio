
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
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useEffect, useState, useRef } from 'react';
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
type SignUpStep = 'phone' | 'otp' | 'details';

const phoneSchema = z.object({
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }),
});

const otpSchema = z.object({
    otp: z.string().length(6, { message: 'OTP must be 6 digits.' }),
});

const signUpSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters.' }).max(20),
  email: z.string().email({ message: 'Please enter a valid email.' }),
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
  const [signUpStep, setSignUpStep] = useState<SignUpStep>('phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState<string | null>(null);
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);


  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '+91' }
  });

  const otpForm = useForm<z.infer<typeof otpSchema>>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' }
  });

  const signUpForm = useForm<z.infer<typeof signUpSchema>>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      username: '',
      email: '',
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
  
  const setupRecaptcha = () => {
    if (!recaptchaContainerRef.current) return;
    // Clear previous instance if any
    recaptchaContainerRef.current.innerHTML = '';
    
    // Set display to block to make it visible
    recaptchaContainerRef.current.style.display = 'block';

    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
        'size': 'invisible',
        'callback': (response: any) => {
            // reCAPTCHA solved, allow signInWithPhoneNumber.
        }
    });
    return recaptchaVerifier;
  };

  const handleSendOtp = async (values: z.infer<typeof phoneSchema>) => {
    setIsSubmitting(true);
    try {
      const recaptchaVerifier = setupRecaptcha();
      if (!recaptchaVerifier) {
          throw new Error("Recaptcha verifier not initialized.");
      }
      const confirmation = await signInWithPhoneNumber(auth, values.phone, recaptchaVerifier);
      setConfirmationResult(confirmation);
      setVerifiedPhoneNumber(values.phone);
      setSignUpStep('otp');
      toast({ title: "OTP Sent!", description: `An OTP has been sent to ${values.phone}.` });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Failed to send OTP",
        description: error.message || "Please try again.",
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async (values: z.infer<typeof otpSchema>) => {
    setIsSubmitting(true);
    if (!confirmationResult) {
      toast({ variant: "destructive", title: "Verification failed", description: "Please request an OTP first." });
      setIsSubmitting(false);
      return;
    }
    try {
      await confirmationResult.confirm(values.otp);
      setSignUpStep('details');
      toast({ title: "Phone number verified!", description: "Please complete your registration." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Invalid OTP", description: "The OTP you entered is incorrect. Please try again." });
    } finally {
        setIsSubmitting(false);
    }
  };


  const handleSignUp = async (values: z.infer<typeof signUpSchema>) => {
    setIsSubmitting(true);
    if (!verifiedPhoneNumber) {
        toast({ variant: "destructive", title: "Sign up failed", description: "Phone number not verified." });
        setIsSubmitting(false);
        return;
    }
    try {
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
          phone: verifiedPhoneNumber,
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
    // Reset forms and state when dialog is closed
    if (!open) {
      signUpForm.reset();
      loginForm.reset();
      phoneForm.reset({ phone: '+91' });
      otpForm.reset();
      setSignUpStep('phone');
      setConfirmationResult(null);
      setVerifiedPhoneNumber(null);
      if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = '';
        recaptchaContainerRef.current.style.display = 'none';
      }
    }
  }, [open, signUpForm, loginForm, phoneForm, otpForm]);

  const renderSignUpContent = () => {
    switch (signUpStep) {
        case 'phone':
            return (
                 <Form {...phoneForm}>
                    <form onSubmit={phoneForm.handleSubmit(handleSendOtp)} className="space-y-4">
                        <FormField
                        control={phoneForm.control}
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
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                           {isSubmitting ? 'Sending OTP...' : 'Send OTP'}
                        </Button>
                    </form>
                </Form>
            );
        case 'otp':
             return (
                 <Form {...otpForm}>
                    <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
                        <FormField
                        control={otpForm.control}
                        name="otp"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>Enter OTP</FormLabel>
                            <FormControl>
                                <Input placeholder="123456" {...field} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                           {isSubmitting ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                    </form>
                </Form>
            );
        case 'details':
            return (
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
            );
    }
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
         <div ref={recaptchaContainerRef} style={{ display: 'none' }}></div>
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
                       {signUpStep === 'phone' && 'First, let\'s verify your phone number.'}
                       {signUpStep === 'otp' && 'Enter the code we sent to your phone.'}
                       {signUpStep === 'details' && 'Now, let\'s get your details.'}
                    </DialogDescription>
                </DialogHeader>
                 {renderSignUpContent()}
            </TabsContent>
         </Tabs>
      </DialogContent>
    </Dialog>
  );
}
