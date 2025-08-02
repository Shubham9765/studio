
// Import the Firebase app and messaging packages
import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Background message handler (optional)
// If you want to customize the notification that is shown when your app is in the background,
// you can add a listener here. By default, FCM will show a notification automatically.
// self.addEventListener('push', (event) => {
//   console.log('[firebase-messaging-sw.js] Received push event: ', event);
//   // Customize notification here if needed
// });
