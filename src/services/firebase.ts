
import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
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

if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    // Pass your reCAPTCHA v3 site key (public key) to activate(). Make sure this
    // key is the counterpart to the secret key you set in the Firebase console.
    const appCheck = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider('6Le-4_EpAAAAAJo2L4qX_wK-tOa5F4bL2E9Q_3r7'),

      // Optional argument. If true, the SDK automatically refreshes App Check
      // tokens as needed.
      isTokenAutoRefreshEnabled: true
    });
}


export { app, db, auth };
