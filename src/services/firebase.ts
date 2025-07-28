import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'village-eats-et2ke',
  appId: '1:568284241701:web:ed7843414e0629b04584cc',
  storageBucket: 'village-eats-et2ke.firebasestorage.app',
  apiKey: 'AIzaSyDAsJm9ANN3W4YHwDox71xqJCKFb5TOUgY',
  authDomain: 'village-eats-et2ke.firebaseapp.com',
  measurementId: '',
  messagingSenderId: '568284241701',
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export { app, db };
