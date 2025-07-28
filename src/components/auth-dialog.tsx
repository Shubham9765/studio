
'use client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { auth } from '@/services/firebase';
import 'firebaseui/dist/firebaseui.css';
import type firebase from 'firebase/app';
import type * as firebaseui from 'firebaseui';
import {
  GoogleAuthProvider,
  EmailAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

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

export function AuthDialog(props: Props) {
  const { open, onOpenChange } = props;

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
        <div className="firebase-auth-container">
            <StyledFirebaseAuth
              uiConfig={{
                signInFlow: 'popup',
                signInOptions: [
                  GoogleAuthProvider.PROVIDER_ID,
                  EmailAuthProvider.PROVIDER_ID,
                ],
                callbacks: {
                  signInSuccessWithAuthResult: () => {
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
