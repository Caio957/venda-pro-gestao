
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

export type PaymentMethod = "cash" | "credit_card" | "debit_card" | "bank_transfer" | "installment";

export type PaymentStatus = "paid" | "pending" | "overdue";

export type SaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
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
  dueDate?: string;
};

export type Receivable = {
  id: string;
  saleId: string;
  customerId: string;
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  paymentDate?: string;
};

type AppContextType = {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  receivables: Receivable[];
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
};

// Create a unique ID with current timestamp + random string
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Default context value
const AppContext = createContext<AppContextType | undefined>(undefined);

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

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load state from localStorage or use initial data
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem("products");
    return saved ? JSON.parse(saved) : initialProducts;
  });
  
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem("customers");
    return saved ? JSON.parse(saved) : initialCustomers;
  });
  
  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem("sales");
    return saved ? JSON.parse(saved) : initialSales;
  });
  
  const [receivables, setReceivables] = useState<Receivable[]>(() => {
    const saved = localStorage.getItem("receivables");
    return saved ? JSON.parse(saved) : initialReceivables;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("products", JSON.stringify(products));
    localStorage.setItem("customers", JSON.stringify(customers));
    localStorage.setItem("sales", JSON.stringify(sales));
    localStorage.setItem("receivables", JSON.stringify(receivables));
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
    
    // Create receivable for non-cash sales that aren't fully paid
    if (sale.paymentMethod !== 'cash' && sale.paymentStatus === 'pending') {
      const newReceivable: Omit<Receivable, "id"> = {
        saleId: newSale.id,
        customerId: sale.customerId,
        amount: sale.total,
        dueDate: sale.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(), // Default 30 days
        status: 'pending',
      };
      
      const receivableWithId = { ...newReceivable, id: generateId() };
      setReceivables([...receivables, receivableWithId]);
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
    const existingReceivable = receivables.find(r => r.saleId === sale.id);
    
    if (sale.paymentStatus === 'paid' && existingReceivable) {
      // Update existing receivable to paid
      setReceivables(receivables.map(r => 
        r.saleId === sale.id ? 
        { ...r, status: 'paid', paymentDate: new Date().toISOString() } : r
      ));
    } 
    else if (sale.paymentStatus === 'pending' && !existingReceivable && sale.paymentMethod !== 'cash') {
      // Create new receivable
      const newReceivable: Receivable = {
        id: generateId(),
        saleId: sale.id,
        customerId: sale.customerId,
        amount: sale.total,
        dueDate: sale.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString(),
        status: 'pending',
      };
      
      setReceivables([...receivables, newReceivable]);
    }
    
    toast.success("Venda atualizada com sucesso!");
  };

  const deleteSale = (id: string) => {
    // Get sale to restore stock
    const saleToDelete = sales.find(s => s.id === id);
    if (!saleToDelete) {
      toast.error("Venda não encontrada");
      return;
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
  };

  // Receivable CRUD operations
  const addReceivable = (receivable: Omit<Receivable, "id">) => {
    const newReceivable = { ...receivable, id: generateId() };
    setReceivables([...receivables, newReceivable]);
    toast.success("Conta a receber adicionada com sucesso!");
  };

  const updateReceivable = (receivable: Receivable) => {
    setReceivables(receivables.map((r) => (r.id === receivable.id ? receivable : r)));
    
    // If receivable is marked as paid, update the sale status
    if (receivable.status === 'paid') {
      setSales(sales.map((s) => 
        s.id === receivable.saleId ? { ...s, paymentStatus: 'paid' } : s
      ));
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

  return (
    <AppContext.Provider
      value={{
        products,
        customers,
        sales,
        receivables,
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
        calculateProfit
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
