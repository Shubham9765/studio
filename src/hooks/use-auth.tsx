
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
import { useRouter } from 'next/navigation';

export interface Address {
    id: string;
    name: string;
    address: string;
    phone: string;
    latitude?: number;
    longitude?: number;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  role?: 'customer' | 'owner' | 'admin' | 'delivery' | 'grocery-owner';
  username?: string;
  phone?: string;
  status?: 'active' | 'inactive';
  addresses?: Address[];
  fcmToken?: string;
  latitude?: number;
  longitude?: number;
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
  const router = useRouter();
  
  const fetchUserData = useCallback(async (firebaseUser: User | null): Promise<AppUser | null> => {
      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const docSnap = await getDoc(userRef);

        const baseUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
            emailVerified: firebaseUser.emailVerified,
        };

        if (docSnap.exists()) {
          const userData = docSnap.data();
          return {
            ...baseUser,
            role: userData.role,
            username: userData.username,
            displayName: userData.displayName || userData.username || firebaseUser.displayName,
            phone: userData.phone,
            status: userData.status || 'active',
            addresses: userData.addresses || [],
            fcmToken: userData.fcmToken,
            latitude: userData.latitude,
            longitude: userData.longitude,
          };
        } else {
          return {
             ...baseUser,
             displayName: firebaseUser.displayName,
             addresses: [],
          };
        }
      }
      return null;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      const appUser = await fetchUserData(user);
      setUser(appUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchUserData]);
  
  const refreshAuth = useCallback(async () => {
    const currentUser = auth.currentUser;
    const appUser = await fetchUserData(currentUser);
    setUser(appUser);
  }, [fetchUserData]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    router.push('/');
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
