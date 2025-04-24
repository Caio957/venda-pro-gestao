import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";

// Types for our app data
export type Product = {
  id: string;
  name: string;
  costPrice: number;
  salePrice: number;
  stock: number;
  description: string;
};

export type Customer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
};

export type PaymentMethod = "cash" | "credit_card" | "debit_card" | "bank_transfer" | "installment" | "bank_slip";

export type PaymentStatus = "paid" | "pending" | "overdue";

export type SaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export interface Sale {
  id: string;
  customerId: string;
  date: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  installments?: number;
  installmentInterval?: number;
  dueDate?: string;
  installmentDates?: {
    installmentNumber: number;
    dueDate: string;
  }[];
}

export type Receivable = {
  id: string;
  saleId: string;
  customerId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paymentDate?: string;
  originalAmount?: number;
  totalPaid?: number;
  paymentHistory?: PaymentHistoryEntry[];
  installmentNumber?: number;
  totalInstallments?: number;
};

export type PaymentHistoryEntry = {
  date: string;
  amount: number;
  type: 'payment' | 'reversal';
  reversedPaymentDate?: string;
  remainingAmount?: number;
};

export interface AppContextType {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  receivables: Receivable[];
  batchPaymentAmount: number;
  setBatchPaymentAmount: (amount: number) => void;
  setReceivables: React.Dispatch<React.SetStateAction<Receivable[]>>;
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
  addProduct: (product: Omit<Product, "id">) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  addCustomer: (customer: Omit<Customer, "id">) => void;
  updateCustomer: (customer: Customer) => void;
  deleteCustomer: (id: string) => void;
  addSale: (sale: Omit<Sale, "id">) => void;
  updateSale: (sale: Sale) => void;
  deleteSale: (id: string) => void;
  addReceivable: (receivable: Omit<Receivable, "id">) => void;
  updateReceivable: (receivable: Receivable) => void;
  deleteReceivable: (id: string) => void;
  getProductById: (id: string) => Product | undefined;
  getCustomerById: (id: string) => Customer | undefined;
  getSaleById: (id: string) => Sale | undefined;
  calculateProfit: (saleId?: string) => number;
}

// Create a unique ID with current timestamp + random string
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Mock data for initial state
const initialProducts: Product[] = [
  {
    id: "prod1",
    name: "Laptop",
    costPrice: 1500,
    salePrice: 2500,
    stock: 10,
    description: "High-performance laptop",
  },
  {
    id: "prod2",
    name: "Smartphone",
    costPrice: 800,
    salePrice: 1200,
    stock: 20,
    description: "Latest model smartphone",
  },
];

const initialCustomers: Customer[] = [
  {
    id: "cust1",
    name: "João Silva",
    email: "joao@email.com",
    phone: "(11) 98765-4321",
    address: "Rua das Flores, 123",
  },
];

const initialSales: Sale[] = [
  {
    id: "sale1",
    customerId: "cust1",
    date: new Date().toISOString(),
    items: [
      {
        productId: "prod1",
        quantity: 1,
        unitPrice: 2500,
        totalPrice: 2500,
      },
    ],
    total: 2500,
    paymentMethod: "cash",
    paymentStatus: "paid",
  },
];

const initialReceivables: Receivable[] = [];

// Create context with a default value matching the type
const AppContext = createContext<AppContextType>({
  products: initialProducts,
  customers: initialCustomers,
  sales: initialSales,
  receivables: initialReceivables,
  batchPaymentAmount: 0,
  setBatchPaymentAmount: () => {},
  setReceivables: () => {},
  setSales: () => {},
  addProduct: () => {},
  updateProduct: () => {},
  deleteProduct: () => {},
  addCustomer: () => {},
  updateCustomer: () => {},
  deleteCustomer: () => {},
  addSale: () => {},
  updateSale: () => {},
  deleteSale: async () => false,
  addReceivable: () => {},
  updateReceivable: () => {},
  deleteReceivable: () => {},
  getProductById: () => undefined,
  getCustomerById: () => undefined,
  getSaleById: () => undefined,
  calculateProfit: () => 0,
});

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage with error handling
  const loadStateFromStorage = <T,>(key: string, initialValue: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initialValue;
    } catch (error) {
      console.error(`Error loading ${key} from localStorage:`, error);
      return initialValue;
    }
  };

  // Initialize state with proper error handling
  const [products, setProducts] = useState<Product[]>(() => 
    loadStateFromStorage("products", initialProducts)
  );
  
  const [customers, setCustomers] = useState<Customer[]>(() => 
    loadStateFromStorage("customers", initialCustomers)
  );
  
  const [sales, setSales] = useState<Sale[]>(() => 
    loadStateFromStorage("sales", initialSales)
  );
  
  const [receivables, setReceivables] = useState<Receivable[]>(() => 
    loadStateFromStorage("receivables", initialReceivables)
  );

  const [batchPaymentAmount, setBatchPaymentAmount] = useState<number>(0);

  // Ensure batchPaymentAmount is a valid number
  const handleSetBatchPaymentAmount = (amount: number) => {
    setBatchPaymentAmount(Number(amount) || 0);
  };

  // Save state to localStorage with error handling
  useEffect(() => {
    try {
      localStorage.setItem("products", JSON.stringify(products));
      localStorage.setItem("customers", JSON.stringify(customers));
      localStorage.setItem("sales", JSON.stringify(sales));
      localStorage.setItem("receivables", JSON.stringify(receivables));
    } catch (error) {
      console.error("Error saving to localStorage:", error);
    }
  }, [products, customers, sales, receivables]);

  // Product CRUD operations
  const addProduct = (product: Omit<Product, "id">) => {
    const newProduct = { ...product, id: generateId() };
    setProducts([...products, newProduct]);
    toast.success("Produto adicionado com sucesso!");
  };

  const updateProduct = (product: Product) => {
    setProducts(products.map((p) => (p.id === product.id ? product : p)));
    toast.success("Produto atualizado com sucesso!");
  };

  const deleteProduct = (id: string) => {
    // Check if product is used in any sale
    const usedInSale = sales.some(sale => 
      sale.items.some(item => item.productId === id)
    );
    
    if (usedInSale) {
      toast.error("Não é possível excluir o produto pois ele está vinculado a uma venda!");
      return;
    }
    
    setProducts(products.filter((p) => p.id !== id));
    toast.success("Produto excluído com sucesso!");
  };

  // Customer CRUD operations
  const addCustomer = (customer: Omit<Customer, "id">) => {
    const newCustomer = { ...customer, id: generateId() };
    setCustomers([...customers, newCustomer]);
    toast.success("Cliente adicionado com sucesso!");
  };

  const updateCustomer = (customer: Customer) => {
    setCustomers(customers.map((c) => (c.id === customer.id ? customer : c)));
    toast.success("Cliente atualizado com sucesso!");
  };

  const deleteCustomer = (id: string) => {
    // Check if customer is used in any sale
    const usedInSale = sales.some(sale => sale.customerId === id);
    
    if (usedInSale) {
      toast.error("Não é possível excluir o cliente pois ele possui vendas associadas!");
      return;
    }
    
    setCustomers(customers.filter((c) => c.id !== id));
    toast.success("Cliente excluído com sucesso!");
  };

  // Sale CRUD operations
  const addSale = (sale: Omit<Sale, "id">) => {
    const newSale = { ...sale, id: generateId() };
    
    // Update product stock
    const updatedProducts = [...products];
    for (const item of sale.items) {
      const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
      if (productIndex !== -1) {
        const newStock = updatedProducts[productIndex].stock - item.quantity;
        if (newStock < 0) {
          toast.error(`Estoque insuficiente para o produto ${updatedProducts[productIndex].name}`);
          return;
        }
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          stock: newStock
        };
      }
    }
    
    // Create receivables for sale
    if (sale.paymentMethod !== 'cash' && sale.paymentStatus === 'pending') {
      // Handle installment payments
      if (sale.paymentMethod === 'installment' && sale.installments && sale.installments > 1) {
        const installmentAmount = Number((sale.total / sale.installments).toFixed(2));
        const remainingAmount = sale.total - (installmentAmount * (sale.installments - 1));
        const intervalDays = sale.installmentInterval || 30;
        
        // Get the base due date
        let dueDate = sale.dueDate 
          ? new Date(sale.dueDate) 
          : new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
          
        // Create receivable for each installment
        for (let i = 0; i < sale.installments; i++) {
          const installmentDueDate = new Date(dueDate);
          installmentDueDate.setDate(installmentDueDate.getDate() + (i * intervalDays));
          
          // The last installment gets any remaining cents to avoid rounding issues
          const amount = i === sale.installments - 1 ? remainingAmount : installmentAmount;
          
          const newReceivable: Receivable = {
            id: generateId(),
            saleId: newSale.id,
            customerId: sale.customerId,
            amount: amount,
            dueDate: installmentDueDate.toISOString(),
            status: 'pending',
            installmentNumber: i + 1,
            totalInstallments: sale.installments
          };
          
          setReceivables(prev => [...prev, newReceivable]);
        }
      } else {
        // Non-installment pending payment (single receivable)
        const newReceivable: Omit<Receivable, "id"> = {
          saleId: newSale.id,
          customerId: sale.customerId,
          amount: sale.total,
          dueDate: sale.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
          status: 'pending',
          installmentNumber: 1,
          totalInstallments: 1
        };
        
        const receivableWithId = { ...newReceivable, id: generateId() };
        setReceivables([...receivables, receivableWithId]);
      }
    }
    
    setSales([...sales, newSale]);
    setProducts(updatedProducts);
    toast.success("Venda registrada com sucesso!");
  };

  const updateSale = (sale: Sale) => {
    // Find original sale to compare
    const originalSale = sales.find(s => s.id === sale.id);
    if (!originalSale) {
      toast.error("Venda não encontrada");
      return;
    }

    // Update stock for changed items
    let stockUpdateFailed = false;
    const updatedProducts = [...products];
    
    // First restore original quantities
    originalSale.items.forEach(originalItem => {
      const productIndex = updatedProducts.findIndex(p => p.id === originalItem.productId);
      if (productIndex !== -1) {
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          stock: updatedProducts[productIndex].stock + originalItem.quantity
        };
      }
    });
    
    // Then remove new quantities
    sale.items.forEach(newItem => {
      const productIndex = updatedProducts.findIndex(p => p.id === newItem.productId);
      if (productIndex !== -1) {
        const newStock = updatedProducts[productIndex].stock - newItem.quantity;
        if (newStock < 0) {
          stockUpdateFailed = true;
          toast.error(`Estoque insuficiente para o produto ${updatedProducts[productIndex].name}`);
          return;
        }
        updatedProducts[productIndex] = {
          ...updatedProducts[productIndex],
          stock: newStock
        };
      }
    });
    
    if (stockUpdateFailed) return;
    
    // Update sale
    setSales(sales.map((s) => (s.id === sale.id ? sale : s)));
    
    // Update products
    setProducts(updatedProducts);
    
    // Update or create receivable if needed
    const existingReceivables = receivables.filter(r => r.saleId === sale.id);
    
    // Remove old receivables if payment status changed to paid or if method changed
    if (
      (sale.paymentStatus === 'paid' && existingReceivables.length > 0) || 
      (originalSale.paymentMethod !== sale.paymentMethod && existingReceivables.length > 0)
    ) {
      // Mark existing receivables as paid if status changed to paid
      if (sale.paymentStatus === 'paid') {
        setReceivables(receivables.map(r => 
          r.saleId === sale.id ? 
          { ...r, status: 'paid' as PaymentStatus, paymentDate: new Date().toISOString() } : r
        ));
      } else {
        // Remove existing receivables if payment method changed
        setReceivables(receivables.filter(r => r.saleId !== sale.id));
        
        // Create new receivables based on the updated payment method
        if (sale.paymentMethod !== 'cash' && sale.paymentStatus === 'pending') {
          // Handle installment payments
          if (sale.paymentMethod === 'installment' && sale.installments && sale.installments > 1) {
            const installmentAmount = Number((sale.total / sale.installments).toFixed(2));
            const remainingAmount = sale.total - (installmentAmount * (sale.installments - 1));
            const intervalDays = sale.installmentInterval || 30;
            
            // Get the base due date
            let dueDate = sale.dueDate 
              ? new Date(sale.dueDate) 
              : new Date(Date.now() + intervalDays * 24 * 60 * 60 * 1000);
              
            // Create receivable for each installment
            for (let i = 0; i < sale.installments; i++) {
              const installmentDueDate = new Date(dueDate);
              installmentDueDate.setDate(installmentDueDate.getDate() + (i * intervalDays));
              
              // The last installment gets any remaining cents to avoid rounding issues
              const amount = i === sale.installments - 1 ? remainingAmount : installmentAmount;
              
              const newReceivable: Receivable = {
                id: generateId(),
                saleId: sale.id,
                customerId: sale.customerId,
                amount: amount,
                dueDate: installmentDueDate.toISOString(),
                status: 'pending',
                installmentNumber: i + 1,
                totalInstallments: sale.installments
              };
              
              setReceivables(prev => [...prev, newReceivable]);
            }
          } else {
            // Non-installment pending payment (single receivable)
            const newReceivable: Receivable = {
              id: generateId(),
              saleId: sale.id,
              customerId: sale.customerId,
              amount: sale.total,
              dueDate: sale.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
              status: 'pending',
              installmentNumber: 1,
              totalInstallments: 1
            };
            
            setReceivables(prev => [...prev, newReceivable]);
          }
        }
      }
    }
    
    toast.success("Venda atualizada com sucesso!");
  };

  const deleteSale = async (id: string) => {
    try {
      // Get sale to restore stock
      const saleToDelete = sales.find(s => s.id === id);
      if (!saleToDelete) {
        toast.error("Venda não encontrada");
        return false;
      }

      // Check if there are any receivables with active (non-reversed) payments
      const saleReceivables = receivables.filter(r => r.saleId === id);
      const hasActivePayments = saleReceivables.some(r => {
        if (!r.paymentHistory) return false;
        
        // Count active payments (payments without corresponding reversals)
        const activePayments = r.paymentHistory.reduce((count, entry) => {
          if (entry.type === 'payment') {
            // Check if this payment has been reversed
            const hasReversal = r.paymentHistory?.some(
              reversal => 
                reversal.type === 'reversal' && 
                reversal.reversedPaymentDate === entry.date
            );
            return hasReversal ? count : count + 1;
          }
          return count;
        }, 0);

        return activePayments > 0;
      });

      if (hasActivePayments) {
        toast.error("Não é possível excluir a venda pois existem títulos com pagamentos ativos. Por favor, estorne todos os pagamentos antes de excluir a venda.", {
          duration: 4000,
          important: true
        });
        return false;
      }
      
      if (!window.confirm("Tem certeza que deseja excluir esta venda?")) {
        return false;
      }

      // Restore product stock
      const updatedProducts = [...products];
      for (const item of saleToDelete.items) {
        const productIndex = updatedProducts.findIndex(p => p.id === item.productId);
        if (productIndex !== -1) {
          updatedProducts[productIndex] = {
            ...updatedProducts[productIndex],
            stock: updatedProducts[productIndex].stock + item.quantity
          };
        }
      }
      
      // Delete associated receivables
      setReceivables(receivables.filter(r => r.saleId !== id));
      
      // Delete sale
      setSales(sales.filter((s) => s.id !== id));
      setProducts(updatedProducts);
      
      toast.success("Venda excluída com sucesso!");
      return true;
    } catch (error) {
      toast.error("Erro ao excluir a venda. Tente novamente.");
      return false;
    }
  };

  // Receivable CRUD operations
  const addReceivable = (receivable: Omit<Receivable, "id">) => {
    const newReceivable = { ...receivable, id: generateId() };
    setReceivables([...receivables, newReceivable]);
    toast.success("Conta a receber adicionada com sucesso!");
  };

  const updateReceivable = (receivable: Receivable) => {
    // Ensure we have all the required fields
    const updatedReceivable = {
      ...receivable,
      totalPaid: receivable.totalPaid || 0,
      originalAmount: receivable.originalAmount || receivable.amount + (receivable.totalPaid || 0),
      paymentHistory: receivable.paymentHistory || []
    };

    // Update the receivables state
    setReceivables(prevReceivables => 
      prevReceivables.map(r => r.id === updatedReceivable.id ? updatedReceivable : r)
    );
    
    // If all installments of a sale are paid, update the sale status
    const allInstallments = receivables.filter(r => r.saleId === receivable.saleId);
    const allPaid = allInstallments.every(r => 
      r.id === receivable.id ? receivable.status === 'paid' : r.status === 'paid'
    );
    
    if (allPaid) {
      setSales(prevSales => 
        prevSales.map(s => 
          s.id === receivable.saleId ? { ...s, paymentStatus: 'paid' } : s
        )
      );
    }
    
    toast.success("Conta a receber atualizada com sucesso!");
  };

  const deleteReceivable = (id: string) => {
    setReceivables(receivables.filter((r) => r.id !== id));
    toast.success("Conta a receber excluída com sucesso!");
  };

  // Helper functions
  const getProductById = (id: string) => {
    return products.find((p) => p.id === id);
  };

  const getCustomerById = (id: string) => {
    return customers.find((c) => c.id === id);
  };

  const getSaleById = (id: string) => {
    return sales.find((s) => s.id === id);
  };

  const calculateProfit = (saleId?: string) => {
    let filteredSales = saleId ? sales.filter(sale => sale.id === saleId) : sales;
    
    return filteredSales.reduce((totalProfit, sale) => {
      const saleProfit = sale.items.reduce((profit, item) => {
        const product = products.find(p => p.id === item.productId);
        if (!product) return profit;
        
        const itemProfit = (item.unitPrice - product.costPrice) * item.quantity;
        return profit + itemProfit;
      }, 0);
      
      return totalProfit + saleProfit;
    }, 0);
  };

  const contextValue: AppContextType = {
    products,
    customers,
    sales,
    receivables,
    batchPaymentAmount,
    setBatchPaymentAmount: handleSetBatchPaymentAmount,
    setReceivables,
    setSales,
    addProduct,
    updateProduct,
    deleteProduct,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    addSale,
    updateSale,
    deleteSale,
    addReceivable,
    updateReceivable,
    deleteReceivable,
    getProductById,
    getCustomerById,
    getSaleById,
    calculateProfit,
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

// Custom hook to use the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};

// Export the context for direct usage if needed
export { AppContext };
