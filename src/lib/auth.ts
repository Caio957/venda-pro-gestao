import { auth } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";

export async function cadastrar(email: string, senha: string) {
  return createUserWithEmailAndPassword(auth, email, senha);
}

export async function login(email: string, senha: string) {
  return signInWithEmailAndPassword(auth, email, senha);
}

export async function logout() {
  return signOut(auth);
} 