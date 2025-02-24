import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  where 
} from "firebase/firestore";

// ✅ Ensure all required environment variables are present
if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    !process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    !process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    !process.env.NEXT_PUBLIC_FIREBASE_APP_ID) {
  console.error("❌ Firebase environment variables are missing! Check .env.local.");
}

// ✅ Firebase configuration (loaded from environment variables)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ✅ Ensure Firebase initializes only once
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Export Firestore functions for use in other files
export { db, collection, addDoc, getDocs, query, orderBy, limit, where };
