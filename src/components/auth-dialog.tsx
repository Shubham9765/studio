
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
import type firebase from 'firebase/app';
import {
  GoogleAuthProvider,
  EmailAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// We need to lazy load the firebaseui component, so it doesn't try to access
// the window object on the server.
import dynamic from 'next/dynamic';

const FirebaseAuth = ({ uiConfig, firebaseAuth }: { uiConfig: firebaseui.auth.Config; firebaseAuth: typeof auth }) => {
  useEffect(() => {
    // FirebaseUI relies on the window object, so we need to import it here
    // to ensure it only runs on the client side.
    import('firebaseui').then(firebaseui => {
        const ui = firebaseui.auth.AuthUI.getInstance() || new firebaseui.auth.AuthUI(firebaseAuth);
        ui.start('#firebaseui-auth-container', uiConfig);
    });
  }, [uiConfig, firebaseAuth]);

  return <div id="firebaseui-auth-container"></div>;
};

const StyledFirebaseAuth = dynamic(
  () => Promise.resolve(FirebaseAuth),
  { ssr: false }
);


interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Role = 'customer' | 'owner';

export function AuthDialog(props: Props) {
  const { open, onOpenChange } = props;
  const [role, setRole] = useState<Role>('customer');

  const [_, setLoggedIn] = useState(false);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setLoggedIn(true);
      } else {
        setLoggedIn(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Login or sign up</DialogTitle>
          <DialogDescription>
            To get started, please login or create a new account.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
            <RadioGroup defaultValue="customer" onValueChange={(value: Role) => setRole(value)}>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="customer" id="r1" />
                    <Label htmlFor="r1">I'm a Customer</Label>
                </div>
                <div className="flex items-center space-x-2">
                    <RadioGroupItem value="owner" id="r2" />
                    <Label htmlFor="r2">I'm a Restaurant Owner</Label>
                </div>
            </RadioGroup>
            <StyledFirebaseAuth
              uiConfig={{
                signInFlow: 'popup',
                signInOptions: [
                  GoogleAuthProvider.PROVIDER_ID,
                  EmailAuthProvider.PROVIDER_ID,
                ],
                callbacks: {
                  signInSuccessWithAuthResult: (authResult) => {
                    if (authResult.user) {
                      const user = authResult.user;
                      const userRef = doc(db, 'users', user.uid);
                      
                      // Check if the user document already exists
                      getDoc(userRef).then(docSnap => {
                        if (!docSnap.exists() && authResult.additionalUserInfo?.isNewUser) {
                           // New user, so create their document with the selected role
                           setDoc(userRef, {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            photoURL: user.photoURL,
                            role: role,
                            createdAt: new Date(),
                          });
                        }
                      });
                    }
                    onOpenChange(false);
                    return false;
                  }
                }
              }}
              firebaseAuth={auth}
            />
        </div>
      </DialogContent>
    </Dialog>
  );
}
