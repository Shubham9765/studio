
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
  sendPasswordResetEmail,
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useState } from 'react';
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
  role: z.enum(['customer', 'owner', 'delivery', 'grocery-owner']).default('customer'),
});

const loginSchema = z.object({
  emailOrUsername: z.string().min(1, { message: 'Please enter your email or username.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const forgotPasswordSchema = z.object({
    email: z.string().email({ message: 'Please enter a valid email.' }),
});

type SignUpValues = z.infer<typeof signUpSchema>;

async function isUsernameUnique(username: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
}

async function isPhoneUnique(phone: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('phone', '==', phone));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
}

export function AuthDialog(props: Props) {
  const { open, onOpenChange } = props;
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [activeTab, setActiveTab] = useState('login');

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
  
  const forgotPasswordForm = useForm<z.infer<typeof forgotPasswordSchema>>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const handleSignUp = async (values: SignUpValues) => {
    setIsSubmitting(true);
    try {
      const isUnameUnique = await isUsernameUnique(values.username);
      if (!isUnameUnique) {
        signUpForm.setError('username', { type: 'manual', message: 'Username is already taken.' });
        setIsSubmitting(false);
        return;
      }
      
      const isNumUnique = await isPhoneUnique(values.phone);
       if (!isNumUnique) {
        signUpForm.setError('phone', { type: 'manual', message: 'This phone number is already registered.' });
        setIsSubmitting(false);
        return;
      }


      const actionCodeSettings = {
        url: `${window.location.origin}/finish-signup`,
        handleCodeInApp: true,
      };
      
      await sendSignInLinkToEmail(auth, values.email, actionCodeSettings);
      
      window.localStorage.setItem('emailForSignIn', values.email);
      const signUpData = { ...values };
      window.localStorage.setItem('signUpData', JSON.stringify(signUpData));
      
      setEmailSent(true);

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

  const handleForgotPassword = async (values: z.infer<typeof forgotPasswordSchema>) => {
      setIsSubmitting(true);
      try {
          await sendPasswordResetEmail(auth, values.email);
          toast({
              title: 'Password Reset Email Sent',
              description: 'Please check your inbox for a link to reset your password.'
          });
          setActiveTab('login');
      } catch (error: any) {
          toast({
              variant: 'destructive',
              title: 'Error',
              description: error.message || 'Failed to send password reset email.'
          });
      } finally {
          setIsSubmitting(false);
      }
  }

  const renderContent = () => {
    if (activeTab === 'forgot_password') {
        return (
            <>
                <DialogHeader className="mb-4">
                    <DialogTitle>Reset Your Password</DialogTitle>
                    <DialogDescription>
                        Enter your email address and we'll send you a link to reset your password.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...forgotPasswordForm}>
                    <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPassword)} className="space-y-4">
                        <FormField
                            control={forgotPasswordForm.control}
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
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                        </Button>
                        <Button variant="link" className="w-full" onClick={() => setActiveTab('login')}>Back to Login</Button>
                    </form>
                </Form>
            </>
        )
    }

    return (
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
                         <Button variant="link" size="sm" className="p-0 h-auto" onClick={() => setActiveTab('forgot_password')}>
                            Forgot Password?
                        </Button>
                        <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
                           {isSubmitting ? 'Logging in...' : 'Login'}
                        </Button>
                    </form>
                </Form>
            </TabsContent>
            <TabsContent value="signup">
                {emailSent ? (
                     <div className="text-center py-8">
                        <MailCheck className="mx-auto h-16 w-16 text-green-500 mb-4" />
                        <h3 className="text-xl font-bold">Check your email</h3>
                        <p className="text-muted-foreground mt-2">
                            We've sent a verification link to your email address. Please click the link to complete your sign-up.
                        </p>
                    </div>
                ) : (
                <>
                    <DialogHeader className="mb-4">
                        <DialogTitle>Create an Account</DialogTitle>
                        <DialogDescription>
                        Sign up to get started with Village Eats.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...signUpForm}>
                        <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                            <FormField
                                control={signUpForm.control}
                                name="role"
                                render={({ field }) => (
                                    <FormItem className="space-y-3">
                                    <FormLabel>I am a...</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        className="flex flex-wrap gap-x-4 gap-y-2"
                                        >
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="customer" /></FormControl>
                                            <FormLabel className="font-normal">Customer</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="owner" /></FormControl>
                                            <FormLabel className="font-normal">Restaurant Owner</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="grocery-owner" /></FormControl>
                                            <FormLabel className="font-normal">Grocery Owner</FormLabel>
                                        </FormItem>
                                        <FormItem className="flex items-center space-x-2 space-y-0">
                                            <FormControl><RadioGroupItem value="delivery" /></FormControl>
                                            <FormLabel className="font-normal">Delivery Person</FormLabel>
                                        </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
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
                            <Button type="submit" className="w-full !mt-6" disabled={isSubmitting}>
                                {isSubmitting ? 'Sending verification...' : 'Sign Up'}
                            </Button>
                        </form>
                    </Form>
                </>
                )}
            </TabsContent>
         </Tabs>
    )
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { onOpenChange(isOpen); if(!isOpen) {setEmailSent(false); setActiveTab('login');} }}>
      <DialogContent className="sm:max-w-md">
         {renderContent()}
      </DialogContent>
    </Dialog>
  );
}

    