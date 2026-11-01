import { db } from "./lib/firebase";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";

async function cleanUpFirestore() {
  const chatCollection = collection(db, "chat_history");
  const querySnapshot = await getDocs(chatCollection);

  querySnapshot.forEach(async (document) => {
    const data = document.data();
    
    // 🔹 If `userId` or `timestamp` is missing, delete the document
    if (!data.userId || !data.timestamp) {
      console.log(`Deleting document ID: ${document.id} (Missing fields)`);
      await deleteDoc(doc(db, "chat_history", document.id));
    }
  });

  console.log("✅ Cleanup Complete! Removed invalid Firestore documents.");
}

// Run Cleanup
cleanUpFirestore();