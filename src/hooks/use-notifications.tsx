
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useAuth } from './use-auth';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { app, db } from '@/services/firebase';
import { doc, setDoc } from 'firebase/firestore';

interface NotificationContextType {
    permission: NotificationPermission | null;
    requestPermission: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const VAPID_KEY = 'BPP9s-clx8lC_g_3WhCat2u_sUeEX3rkb7a9f_UATqvr9VPQchNU7s8n3nEMLzK5sZkUi2s2LjpqD9UPq9u22iY';

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth();
    const [permission, setPermission] = useState<NotificationPermission | null>(null);
    const [notificationAudio, setNotificationAudio] = useState<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'Notification' in window) {
            setPermission(Notification.permission);
        }
        const audio = new Audio('/notification.mp3');
        audio.loop = true;
        setNotificationAudio(audio);
    }, []);

    const requestPermission = () => {
        if (!('Notification' in window)) {
            console.log('This browser does not support desktop notification');
            return;
        }

        Notification.requestPermission().then((permission) => {
            setPermission(permission);
            if (permission === 'granted') {
                setupNotifications();
            }
        });
    };

    const setupNotifications = useCallback(async () => {
        if (typeof window === 'undefined' || !user || permission !== 'granted') return;
        
        try {
            // Add a small delay to allow Firebase to initialize fully
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            const messaging = getMessaging(app);
            const currentToken = await getToken(messaging, { vapidKey: VAPID_KEY });
            
            if (currentToken) {
                console.log('FCM Token:', currentToken);
                // Save the token to Firestore for this user
                await setDoc(doc(db, 'users', user.uid), { fcmToken: currentToken }, { merge: true });
            } else {
                console.log('No registration token available. Request permission to generate one.');
            }
        } catch (err) {
            console.error('An error occurred while retrieving token. ', err);
        }

    }, [user, permission]);

    useEffect(() => {
        if (permission === 'granted') {
            setupNotifications();
        }
    }, [permission, setupNotifications]);
    
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const messaging = getMessaging(app);
            const unsubscribe = onMessage(messaging, (payload) => {
                console.log('Message received. ', payload);
                if (notificationAudio) {
                    notificationAudio.currentTime = 0;
                    notificationAudio.play();
                    setTimeout(() => {
                        notificationAudio.pause();
                    }, 7000);
                }
                
                // Show a browser notification
                const notificationTitle = payload.notification?.title || 'New Notification';
                const notificationOptions = {
                    body: payload.notification?.body || '',
                    icon: payload.notification?.icon || '/favicon.ico',
                };
                new Notification(notificationTitle, notificationOptions);
            });
            return () => unsubscribe();
        }
    }, [notificationAudio]);

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
