import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBv-YY-UiPry-K3ed6DDihxAwEP0VTbmY8",
  authDomain: "web-portal-cm.firebaseapp.com",
  projectId: "web-portal-cm",
  storageBucket: "web-portal-cm.firebasestorage.app",
  messagingSenderId: "1074369417153",
  appId: "1:1074369417153:web:a6c781db5112d63806a940"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;