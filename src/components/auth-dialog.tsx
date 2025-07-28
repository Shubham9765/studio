// All the UI components are imported from the same codebase
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
import {
  GoogleAuthProvider,
  EmailAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import { useEffect, useState } from 'react';

// We need to lazy load the firebaseui component, so it doesn't try to access
// the window object on the server.
import dynamic from 'next/dynamic';
const StyledFirebaseAuth = dynamic(
  () => import('react-firebaseui/StyledFirebaseAuth'),
  { ssr: false }
);

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AuthDialog(props: Props) {
  const { open, onOpenChange } = props;
  const [render, setRender] = useState(false);
  useEffect(() => {
    // We need to delay the rendering of the firebaseui component, so it doesn't
    // throw a hydration error.
    setTimeout(() => {
      setRender(true);
    }, 500);
  }, []);
  const [_, setLoggedIn] = useState(false);
  onAuthStateChanged(auth, (user) => {
    if (user) {
      setLoggedIn(true);
    } else {
      setLoggedIn(false);
    }
  });
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
          {render ? (
            <StyledFirebaseAuth
              uiConfig={{
                signInFlow: 'popup',
                signInOptions: [
                  GoogleAuthProvider.PROVIDER_ID,
                  EmailAuthProvider.PROVIDER_ID,
                ],
              }}
              firebaseAuth={auth}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
