
import { PaymentMethod, PaymentStatus } from "@/contexts/AppContext";

export type SaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type InstallmentDate = {
  installmentNumber: number;
  dueDate: string;
};

export type Sale = {
  id: string;
  customerId: string;
  date: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  installments?: number;
  installmentInterval?: number;
  dueDate?: string;
  installmentDates?: InstallmentDate[];
};

export type SelectedProduct = {
  productId: string;
  quantity: number;
};
