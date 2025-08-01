
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

export interface Address {
    id: string;
    name: string;
    address: string;
    phone: string;
}

export interface AppUser extends User {
  role?: 'customer' | 'owner' | 'admin';
  username?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  address?: string; // Kept for backwards compatibility if needed, but addresses array is primary
  addresses?: Address[];
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
            displayName: userData?.displayName || userData?.username || firebaseUser.displayName,
            phone: userData?.phone,
            status: userData?.status || 'active',
            address: userData?.address || '',
            addresses: userData?.addresses || [],
          };
          return appUser;
        } else {
          // Default user object if no firestore doc exists yet
          return {
             ...firebaseUser,
             displayName: firebaseUser.displayName,
             addresses: [],
          };
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
        setLoading(true);
        const appUser = await fetchUserData(currentUser);
        setUser(appUser);
        setLoading(false);
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

    