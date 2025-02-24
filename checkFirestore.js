import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, getDocs } from "firebase/firestore";

// ✅ Firebase Configuration (Same as in firebase.js)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// ✅ Initialize Firebase
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(app);

// ✅ Fetch Firestore Data
async function checkFirestoreData() {
  try {
    const querySnapshot = await getDocs(collection(db, "chat_history"));
    console.log("📜 Chat History Documents:");

    querySnapshot.forEach((doc) => {
      console.log(doc.id, "=>", doc.data());
    });

  } catch (error) {
    console.error("❌ Error fetching documents:", error);
  }
}

// ✅ Run the Function
checkFirestoreData();
