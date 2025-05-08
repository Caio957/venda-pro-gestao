
import React, { useState, useEffect } from "react";
import { useAppContext, PaymentMethod, PaymentStatus } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type SaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

type InstallmentDate = {
  installmentNumber: number;
  dueDate: string;
};

type Sale = {
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

type SelectedProduct = {
  productId: string;
  quantity: number;
};

// Component for the sale form
const SaleForm: React.FC<{
  sale: Sale;
  selectedProduct: SelectedProduct;
  onSaleChange: (sale: Sale) => void;
  onProductChange: (product: SelectedProduct) => void;
  onAddProduct: () => void;
  onRemoveItem: (index: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  customers: any[];
  products: any[];
}> = ({
  sale,
  selectedProduct,
  onSaleChange,
  onProductChange,
  onAddProduct,
  onRemoveItem,
  onSubmit,
  customers,
  products,
}) => {
  const { addSale } = React.useContext(AppContext);
  const [selectedCustomer, setSelectedCustomer] = useState<string>(sale.customerId || '');
  const [saleDate, setSaleDate] = useState<string>(sale.date || new Date().toISOString().split('T')[0]);
  const [selectedProducts, setSelectedProducts] = useState<Array<{
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>>(sale.items?.length > 0 ? sale.items : [{
    productId: '',
    quantity: 1,
    unitPrice: 0,
    totalPrice: 0
  }]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(sale.paymentMethod || 'cash');
  const [installments, setInstallments] = useState<number>(sale.installments || 2);
  const [installmentDates, setInstallmentDates] = useState<InstallmentDate[]>(sale.installmentDates || []);
  const [dueDate, setDueDate] = useState<string>(sale.dueDate || '');
  const [showInstallmentFields, setShowInstallmentFields] = useState(sale.paymentMethod === 'installment');
  const [showDueDateField, setShowDueDateField] = useState(sale.paymentMethod === 'bank_slip');

  // Initialize installment dates when number of installments changes
  useEffect(() => {
    if (showInstallmentFields && installments > 0) {
      const dates: InstallmentDate[] = [];
      const baseDate = new Date();
      
      for (let i = 0; i < installments; i++) {
        const date = new Date(baseDate);
        date.setMonth(date.getMonth() + i + 1); // First installment starts next month
        
        dates.push({
          installmentNumber: i + 1,
          dueDate: date.toISOString().split('T')[0]
        });
      }
      
      setInstallmentDates(dates);
    }
  }, [installments, showInstallmentFields]);

  // Update sale state whenever selected products change
  useEffect(() => {
    onSaleChange({
      ...sale,
      customerId: selectedCustomer,
      date: saleDate,
      items: selectedProducts,
      paymentMethod,
      installments: showInstallmentFields ? installments : undefined,
      installmentDates: showInstallmentFields ? installmentDates : undefined,
      dueDate: (showDueDateField || (!showInstallmentFields && paymentMethod !== 'cash')) ? dueDate : undefined,
      total: selectedProducts.reduce((sum, item) => sum + item.totalPrice, 0)
    });
  }, [selectedCustomer, saleDate, selectedProducts, paymentMethod, installments, installmentDates, dueDate]);

  const handlePaymentMethodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const method = event.target.value as PaymentMethod;
    setPaymentMethod(method);
    
    if (method === 'installment') {
      setShowInstallmentFields(true);
      setShowDueDateField(false);
      // Initialize installment dates
      const dates: InstallmentDate[] = [];
      const baseDate = new Date();
      
      for (let i = 0; i < installments; i++) {
        const date = new Date(baseDate);
        date.setMonth(date.getMonth() + i + 1);
        
        dates.push({
          installmentNumber: i + 1,
          dueDate: date.toISOString().split('T')[0]
        });
      }
      
      setInstallmentDates(dates);
    } else if (method === 'bank_slip') {
      setShowInstallmentFields(false);
      setShowDueDateField(true);
      // Set default due date to 5 business days
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 5);
      setDueDate(dueDate.toISOString().split('T')[0]);
    } else {
      setShowInstallmentFields(false);
      setShowDueDateField(false);
      setInstallments(2);
      setInstallmentDates([]);
      setDueDate('');
    }
  };

  const handleInstallmentsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newInstallments = parseInt(event.target.value);
    if (newInstallments >= 2) {
      setInstallments(newInstallments);
      
      // Update installment dates
      const dates: InstallmentDate[] = [];
      const baseDate = new Date();
      
      for (let i = 0; i < newInstallments; i++) {
        const date = new Date(baseDate);
        date.setMonth(date.getMonth() + i + 1);
        
        dates.push({
          installmentNumber: i + 1,
          dueDate: date.toISOString().split('T')[0]
        });
      }
      
      setInstallmentDates(dates);
    }
  };

  const handleInstallmentDateChange = (installmentNumber: number, date: string) => {
    setInstallmentDates(prevDates => 
      prevDates.map(d => 
        d.installmentNumber === installmentNumber 
          ? { ...d, dueDate: date }
          : d
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const total = selectedProducts.reduce((sum, item) => sum + item.totalPrice, 0);
    
    const newSale = {
      customerId: selectedCustomer,
      date: saleDate,
      items: selectedProducts.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice
      })),
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'cash' ? 'paid' as PaymentStatus : 'pending' as PaymentStatus,
      ...(paymentMethod === 'installment' ? {
        installments,
        installmentDates: installmentDates.map(date => ({
          installmentNumber: date.installmentNumber,
          dueDate: date.dueDate
        }))
      } : {
        dueDate
      })
    };

    try {
      await addSale(newSale);
      
      // Reset form
      setSelectedCustomer('');
      setSaleDate(new Date().toISOString().split('T')[0]);
      setSelectedProducts([{
        productId: '',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }]);
      setPaymentMethod('cash');
      setInstallments(2);
      setInstallmentDates([]);
      setDueDate('');
      setShowInstallmentFields(false);
      
      // Close dialog
      onSubmit(e);
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      toast.error('Erro ao salvar venda. Tente novamente.');
    }
  };

  // Format currency helper function
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Cliente</Label>
          <select 
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Selecione um cliente</option>
            {customers.map(customer => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Data da Venda</Label>
          <input
            type="date"
            value={saleDate}
            onChange={(e) => setSaleDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Produtos</Label>
        <div className="space-y-2">
          {selectedProducts.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <select
                value={item.productId}
                onChange={(e) => {
                  const product = products.find(p => p.id === e.target.value);
                  const newProducts = [...selectedProducts];
                  newProducts[index] = {
                    ...item,
                    productId: e.target.value,
                    unitPrice: product?.salePrice || 0,
                    totalPrice: (product?.salePrice || 0) * item.quantity
                  };
                  setSelectedProducts(newProducts);
                }}
                className="flex-1 p-2 border rounded"
                required
              >
                <option value="">Selecione um produto</option>
                {products.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatCurrency(product.salePrice)}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const newProducts = [...selectedProducts];
                  newProducts[index] = {
                    ...item,
                    quantity: parseInt(e.target.value) || 0,
                    totalPrice: item.unitPrice * (parseInt(e.target.value) || 0)
                  };
                  setSelectedProducts(newProducts);
                }}
                min="1"
                className="w-24 p-2 border rounded"
                placeholder="Qtd"
                required
              />
              <button
                type="button"
                onClick={() => {
                  const newProducts = selectedProducts.filter((_, i) => i !== index);
                  setSelectedProducts(newProducts.length > 0 ? newProducts : [{
                    productId: '',
                    quantity: 1,
                    unitPrice: 0,
                    totalPrice: 0
                  }]);
                }}
                className="p-2 text-red-600 hover:text-red-800"
              >
                Remover
              </button>
            </div>
          ))}
          <Button
            type="button"
            onClick={() => {
              setSelectedProducts([
                ...selectedProducts,
                { productId: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
              ]);
            }}
            variant="secondary"
          >
            Adicionar Mais Produtos
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Forma de Pagamento</Label>
          <select
            value={paymentMethod}
            onChange={handlePaymentMethodChange}
            className="w-full p-2 border rounded"
            required
          >
            <option value="cash">Dinheiro</option>
            <option value="credit_card">Cartão de Crédito</option>
            <option value="debit_card">Cartão de Débito</option>
            <option value="bank_transfer">Transferência Bancária</option>
            <option value="bank_slip">Boleto</option>
            <option value="installment">Parcelado</option>
          </select>
        </div>

        {showInstallmentFields && (
          <div className="space-y-2">
            <Label>Número de Parcelas</Label>
            <input
              type="number"
              value={installments}
              onChange={handleInstallmentsChange}
              min="2"
              className="w-full p-2 border rounded"
              required
            />
          </div>
        )}

        {showDueDateField && (
          <div className="space-y-2">
            <Label>Data de Vencimento do Boleto</Label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        )}
      </div>

      {showInstallmentFields && installments >= 2 && (
        <div className="space-y-2">
          <Label>Datas das Parcelas</Label>
          <div className="grid grid-cols-3 gap-4">
            {installmentDates.map((date, index) => (
              <div key={index} className="space-y-1">
                <Label>Parcela {date.installmentNumber}</Label>
                <input
                  type="date"
                  value={date.dueDate}
                  onChange={(e) => handleInstallmentDateChange(date.installmentNumber, e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-4">
        <Button type="submit" className="w-full">
          Finalizar Venda
        </Button>
      </div>
    </form>
  );
};

export default SaleForm;
