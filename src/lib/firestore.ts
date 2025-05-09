import { db } from "./firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";

export async function salvarVenda(venda: any) {
  await addDoc(collection(db, "vendas"), venda);
}

export async function listarVendas() {
  const querySnapshot = await getDocs(collection(db, "vendas"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
} 