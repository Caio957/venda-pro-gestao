import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyByio6rwRqTqd8LpqPQ8o9jd0TcojqxeII",
  authDomain: "venda-pro.firebaseapp.com",
  projectId: "venda-pro",
  storageBucket: "venda-pro.firebasestorage.app",
  messagingSenderId: "1012685370496",
  appId: "1:1012685370496:web:547fe1e1f6ac07576f2265",
  measurementId: "G-FKWL2P9H9E"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app); 