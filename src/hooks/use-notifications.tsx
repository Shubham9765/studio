
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';
import { app, db } from '@/services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface NotificationContextType {
    permission: NotificationPermission | null;
    requestPermission: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const VAPID_KEY = 'BCRPec9LBTgPSoCdKMkEybDUggXVqFVAkXu2RvtfPTDJJzeljomV3-T3QwxrxfTBdmtszoF6m8ew45gTy1G9N6Y';

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return;
        }

        Notification.requestPermission().then((permission) => {
            setPermission(permission);
        });
    };
    
    return (
        <NotificationContext.Provider value={{ permission, requestPermission }}>
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
}
