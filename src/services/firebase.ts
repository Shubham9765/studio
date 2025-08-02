
import { initializeApp, getApp, getApps, getAppCheck, ReCaptchaV3Provider } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  "projectId": "village-eats-et2ke",
  "appId": "1:568284241701:web:ed7843414e0629b04584cc",
  "storageBucket": "village-eats-et2ke.firebasestorage.app",
  "apiKey": "AIzaSyDAsJm9ANN3W4YHwDox71xqJCKFb5TOUgY",
  "authDomain": "village-eats-et2ke.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "568284241701"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

if (typeof window !== 'undefined') {
    const appCheck = getAppCheck(app, {
      provider: new ReCaptchaV3Provider('6Le-4_EpAAAAAJo2L4qX_wK-tOa5F4bL2E9Q_3r7'),
      isTokenAutoRefreshEnabled: true
    });
}


export { app, db, auth };
