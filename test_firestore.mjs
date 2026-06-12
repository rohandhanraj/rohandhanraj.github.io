import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";

// Read Firebase configurations from process.env
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

console.log("=========================================");
console.log("Firebase Firestore Connection Diagnostics");
console.log("=========================================");
console.log("Project ID:", firebaseConfig.projectId);
console.log("API Key:   ", firebaseConfig.apiKey ? "✓ Detected" : "✗ Missing");
console.log("-----------------------------------------");

if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Error: Missing Firebase configuration in environment variables.");
  console.error("Please verify that .env.local exists and contains NEXT_PUBLIC_FIREBASE_* variables.");
  process.exit(1);
}

try {
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const testDocId = "test_crud_" + Date.now();
  const docRef = doc(db, "chat_sessions", testDocId);

  console.log("1. Trying CREATE operation on 'chat_sessions'...");
  await setDoc(docRef, {
    test: true,
    message: "Firebase CRUD Test",
    createdAt: new Date().toISOString(),
  });
  console.log("✓ CREATE: Success!");

  console.log("2. Trying READ operation...");
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    console.log("✓ READ: Success! Content:", snap.data());
  } else {
    throw new Error("Document created but could not be read back.");
  }

  console.log("3. Trying UPDATE operation...");
  await updateDoc(docRef, {
    message: "Firebase CRUD Test - Updated",
    updatedAt: new Date().toISOString(),
  });
  console.log("✓ UPDATE: Success!");

  console.log("4. Trying DELETE operation...");
  await deleteDoc(docRef);
  console.log("✓ DELETE: Success!");

  const snapDeleted = await getDoc(docRef);
  if (!snapDeleted.exists()) {
    console.log("✓ Verification: Document deleted successfully.");
  } else {
    throw new Error("Document was not deleted successfully.");
  }

  console.log("-----------------------------------------");
  console.log("🎉 ALL FIRESTORE CRUD OPERATIONS PASSED SUCCESSFULY!");
  console.log("=========================================");
} catch (error) {
  console.error("\n❌ Diagnostics Failed!");
  
  if (error.code === "permission-denied") {
    console.error("\nReason: PERMISSION_DENIED (Missing or insufficient permissions)");
    console.error("\nACTION REQUIRED:");
    console.error("The client application is authenticated/anonymous, but your Firestore Database");
    console.error("rules are currently blocking write or read requests to the 'chat_sessions' collection.");
    console.error("\nTo resolve this, apply the following rules in your Firebase Console:");
    console.error("------------------------------------------------------------------");
    console.error("1. Open the Firebase Console: https://console.firebase.google.com/");
    console.error(`2. Select your project: "${firebaseConfig.projectId}"`);
    console.error("3. Go to 'Firestore Database' under the Build menu on the left sidebar.");
    console.error("4. Go to the 'Rules' tab.");
    console.error("5. Replace the existing rules with the configuration below:");
    console.error("\nrules_version = '2';");
    console.error("service cloud.firestore {");
    console.error("  match /databases/{database}/documents {");
    console.error("    match /chat_sessions/{sessionId} {");
    console.error("      allow read, write: if true;");
    console.error("    }");
    console.error("  }");
    console.error("}");
    console.error("\n6. Click 'Publish'.");
    console.error("------------------------------------------------------------------");
  } else {
    console.error("Error Detail:", error);
  }
  process.exit(1);
}
