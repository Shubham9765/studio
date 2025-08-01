
'use client';
import {
  User,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from 'react';
import { auth, db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export interface AppUser extends User {
  role?: 'customer' | 'owner' | 'admin';
  username?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  address?: string;
}

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signOut: () => void;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  
  const fetchUserData = useCallback(async (firebaseUser: User | null): Promise<AppUser | null> => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const userData = docSnap.data();
          const appUser: AppUser = {
            ...firebaseUser,
            uid: firebaseUser.uid,
            role: userData?.role,
            username: userData?.username,
            displayName: userData?.username || firebaseUser.displayName,
            phone: userData?.phone,
            status: userData?.status || 'active',
            address: userData?.address || '',
          };
          return appUser;
        } else {
          return firebaseUser;
        }
      }
      return null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      const appUser = await fetchUserData(user);
      setUser(appUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);
  
  const refreshAuth = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
        const appUser = await fetchUserData(currentUser);
        setUser(appUser);
    }
  }, [fetchUserData]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
