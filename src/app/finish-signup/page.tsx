
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isSignInWithEmailLink, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '@/services/firebase';
import { useToast } from '@/hooks/use-toast';
import { setDoc, doc } from 'firebase/firestore';
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FinishSignUpPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const finishSignUp = async () => {
      if (typeof window !== 'undefined') {
          if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');
            const signUpDataString = window.localStorage.getItem('signUpData');
            
            if (!email || !signUpDataString) {
              setErrorMessage('Sign-up session expired or invalid. Please try signing up again.');
              setStatus('error');
              return;
            }

            const signUpData = JSON.parse(signUpDataString);

            try {
              const userCredential = await createUserWithEmailAndPassword(auth, email, signUpData.password);
              const user = userCredential.user;

              await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                username: signUpData.username,
                displayName: signUpData.username,
                email: user.email,
                phone: signUpData.phone,
                role: signUpData.role,
                createdAt: new Date(),
                status: 'active',
                emailVerified: true,
              });

              // Clean up local storage
              window.localStorage.removeItem('emailForSignIn');
              window.localStorage.removeItem('signUpData');

              setStatus('success');
              toast({
                title: 'Welcome to Village Eats!',
                description: 'Your account has been created successfully.',
              });

            } catch (error: any) {
              if (error.code === 'auth/email-already-in-use') {
                  setErrorMessage('This email is already registered. Please log in.');
              } else {
                  setErrorMessage(error.message || 'An unknown error occurred. Please try again.');
              }
              setStatus('error');
            }
          } else {
            setErrorMessage('Invalid verification link.');
            setStatus('error');
          }
      }
    };

    finishSignUp();
  }, [toast, router]);
  
  const renderContent = () => {
    switch (status) {
        case 'loading':
            return (
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">Finalizing your account...</p>
                </div>
            )
        case 'success':
            return (
                <div className="flex flex-col items-center text-center gap-4">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <CardTitle>Sign-up Successful!</CardTitle>
                    <CardDescription>You are now being redirected to the homepage.</CardDescription>
                    <Button onClick={() => router.push('/')}>Go to Homepage</Button>
                </div>
            )
        case 'error':
             return (
                <div className="flex flex-col items-center text-center gap-4">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                    <CardTitle>Sign-up Failed</CardTitle>
                    <CardDescription>{errorMessage}</CardDescription>
                    <Button variant="destructive" onClick={() => router.push('/')}>Return to Homepage</Button>
                </div>
            )
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container flex items-center justify-center py-20">
        <Card className="w-full max-w-md p-8">
            <CardHeader className="p-0 mb-6">
                {renderContent()}
            </CardHeader>
        </Card>
      </main>
    </div>
  );
}
