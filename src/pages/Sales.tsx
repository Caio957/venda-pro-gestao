import React, { useState, useEffect, useMemo, useContext } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { FormatCurrency } from "@/components/FormatCurrency";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Edit, Trash, X } from "lucide-react";
import { PaymentMethod, PaymentStatus } from "@/contexts/AppContext";
import { toast } from "sonner";
import { InstallmentDatesDialog } from "@/components/InstallmentDatesDialog";
import { Label } from "@/components/ui/label";
import { AppContext } from "@/contexts/AppContext";

// Types
type SaleItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

// Função auxiliar para formatar moeda
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
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
  const { addSale } = useContext(AppContext);
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

  // Inicializa as datas das parcelas quando o número de parcelas muda
  useEffect(() => {
    if (showInstallmentFields && installments > 0) {
      const dates: InstallmentDate[] = [];
      const baseDate = new Date();
      
      for (let i = 0; i < installments; i++) {
        const date = new Date(baseDate);
        date.setMonth(date.getMonth() + i + 1); // Primeira parcela começa no próximo mês
        
        dates.push({
          installmentNumber: i + 1,
          dueDate: date.toISOString().split('T')[0]
        });
      }
      
      setInstallmentDates(dates);
    }
  }, [installments, showInstallmentFields]);

  // Atualiza o estado da venda sempre que os produtos selecionados mudarem
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
      // Inicializa as datas das parcelas
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
      // Define uma data de vencimento padrão para 5 dias úteis
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
      
      // Atualiza as datas das parcelas
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
      paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
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
      
      // Fecha o diálogo
      onSubmit(e);
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      toast.error('Erro ao salvar venda. Tente novamente.');
    }
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setSelectedProducts([{
      productId: '',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    }]);
    setPaymentMethod('cash');
    setInstallments(2);
    setInstallmentDates([]);
    setShowInstallmentFields(false);
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

// Main Sales component
const Sales = () => {
  const { 
    sales, 
    products, 
    customers, 
    addSale, 
    updateSale, 
    deleteSale, 
    getProductById 
  } = useAppContext();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [searchTerm, setSearchTerm] = useState("");

  // Novos estados para filtros
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | PaymentStatus>("all");

  const [currentSale, setCurrentSale] = useState<Sale>({
    id: "",
    customerId: customers.length > 0 ? customers[0].id : "",
    date: new Date().toISOString().split("T")[0],
    items: [],
    total: 0,
    paymentMethod: "cash",
    paymentStatus: "paid",
  });

  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct>({
    productId: "",
    quantity: 1
  });

  // Calculate total whenever items change
  useEffect(() => {
    const total = currentSale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    setCurrentSale(prev => ({ ...prev, total }));
  }, [currentSale.items]);

  // Payment method affects payment status
  useEffect(() => {
    if (currentSale.paymentMethod === 'cash' || currentSale.paymentMethod === 'credit_card' || currentSale.paymentMethod === 'debit_card') {
      setCurrentSale(prev => ({
        ...prev,
        paymentStatus: 'paid',
        installments: undefined
      }));
    } else if (currentSale.paymentMethod === 'installment') {
      setCurrentSale(prev => ({
        ...prev,
        paymentStatus: 'pending',
        installments: prev.installments || 2,
        dueDate: prev.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0]
      }));
    } else {
      setCurrentSale(prev => ({
        ...prev,
        paymentStatus: 'pending',
        installments: undefined,
        dueDate: prev.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0]
      }));
    }
  }, [currentSale.paymentMethod]);

  const handleOpenAddDialog = () => {
    setDialogMode("add");
    setCurrentSale({
      id: "",
      customerId: customers.length > 0 ? customers[0].id : "",
      date: new Date().toISOString().split("T")[0],
      items: [],
      total: 0,
      paymentMethod: "cash",
      paymentStatus: "paid",
    });
    setSelectedProduct({
      productId: "",
      quantity: 1
    });
    setIsDialogOpen(true);
  };

  const handleOpenEditDialog = (sale: Sale) => {
    setDialogMode("edit");
    setCurrentSale({
      id: sale.id,
      customerId: sale.customerId,
      date: new Date(sale.date).toISOString().split("T")[0],
      items: [...sale.items],
      total: sale.total,
      paymentMethod: sale.paymentMethod,
      paymentStatus: sale.paymentStatus,
      installments: sale.installments,
      installmentInterval: sale.installmentInterval || 30,
      dueDate: sale.dueDate ? new Date(sale.dueDate).toISOString().split("T")[0] : undefined,
      installmentDates: sale.installmentDates || [],
    });
    setSelectedProduct({
      productId: "",
      quantity: 1
    });
    setIsDialogOpen(true);
  };

  const handleAddProduct = () => {
    if (!selectedProduct.productId || selectedProduct.quantity <= 0) {
      toast.error("Selecione um produto e informe a quantidade");
      return;
    }

    const product = getProductById(selectedProduct.productId);
    if (!product) {
      toast.error("Produto não encontrado");
      return;
    }

    const existingItemIndex = currentSale.items.findIndex(
      item => item.productId === selectedProduct.productId
    );

    if (existingItemIndex !== -1) {
      const updatedItems = [...currentSale.items];
      const newQuantity = updatedItems[existingItemIndex].quantity + selectedProduct.quantity;
      
      if (newQuantity > product.stock && dialogMode === 'add') {
        toast.error("Estoque insuficiente");
        return;
      }

      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        totalPrice: newQuantity * product.salePrice
      };

      setCurrentSale(prev => ({ ...prev, items: updatedItems }));
    } else {
      if (selectedProduct.quantity > product.stock && dialogMode === 'add') {
        toast.error("Estoque insuficiente");
        return;
      }

      const newItem = {
        productId: selectedProduct.productId,
        quantity: selectedProduct.quantity,
        unitPrice: product.salePrice,
        totalPrice: selectedProduct.quantity * product.salePrice
      };

      setCurrentSale(prev => ({ ...prev, items: [...prev.items, newItem] }));
    }

    setSelectedProduct({
      productId: "",
      quantity: 1
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...currentSale.items];
    updatedItems.splice(index, 1);
    setCurrentSale(prev => ({ ...prev, items: updatedItems }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentSale.items.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    if (dialogMode === "add") {
      const newSale: Omit<Sale, "id"> = {
        customerId: currentSale.customerId,
        date: currentSale.date,
        items: currentSale.items,
        total: currentSale.total,
        paymentMethod: currentSale.paymentMethod,
        paymentStatus: currentSale.paymentStatus,
        installments: currentSale.installments,
        installmentInterval: currentSale.installmentInterval,
        dueDate: currentSale.dueDate,
        installmentDates: currentSale.installmentDates || [],
      };
      addSale(newSale);
      toast.success("Venda registrada com sucesso");
    } else {
      updateSale(currentSale);
      toast.success("Venda atualizada com sucesso");
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (sale: Sale) => {
    const deleted = await deleteSale(sale.id);
    // Se a exclusão falhou, não fazemos nada pois o toast de erro já foi exibido
  };

  const formatPaymentMethod = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return "Dinheiro";
      case "credit_card":
        return "Cartão de Crédito";
      case "debit_card":
        return "Cartão de Débito";
      case "installment":
        return "Parcelado";
      case "bank_slip":
        return "Boleto";
      default:
        return method;
    }
  };

  const formatPaymentStatus = (status: PaymentStatus) => {
    switch (status) {
      case "paid":
        return "Pago";
      case "pending":
        return "Pendente";
      case "overdue":
        return "Atrasado";
      default:
        return status;
    }
  };

  // Função para filtrar vendas
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Filtro por cliente
      const customerMatch = customers.find(c => c.id === sale.customerId)?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      // Filtro por data
      const saleDate = new Date(sale.date);
      const isAfterStart = !startDate || saleDate >= new Date(startDate);
      const isBeforeEnd = !endDate || saleDate <= new Date(endDate);
      
      // Filtro por status
      const statusMatch = statusFilter === "all" || sale.paymentStatus === statusFilter;

      return customerMatch && isAfterStart && isBeforeEnd && statusMatch;
    });
  }, [sales, searchTerm, startDate, endDate, statusFilter, customers]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title">Vendas</h1>
          <p className="page-subtitle">Gerencie suas vendas</p>
        </div>
        <Button variant="default" onClick={handleOpenAddDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-4 md:grid-cols-4">
            {/* Busca por cliente */}
            <div className="relative md:col-span-2">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Filtro por período */}
            <div className="flex gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
                placeholder="Data inicial"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
                placeholder="Data final"
              />
            </div>

            {/* Filtro por status */}
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as "all" | PaymentStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="paid">Pagas</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Forma de Pagamento</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell>
                  {customers.find((c) => c.id === sale.customerId)?.name}
                </TableCell>
                <TableCell>
                  {new Date(sale.date).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <FormatCurrency value={sale.total} />
                </TableCell>
                <TableCell>{formatPaymentMethod(sale.paymentMethod)}</TableCell>
                <TableCell>{formatPaymentStatus(sale.paymentStatus)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenEditDialog(sale)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(sale)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Nova Venda" : "Editar Venda"}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "add"
                ? "Preencha os dados da nova venda"
                : "Atualize os dados da venda"}
            </DialogDescription>
          </DialogHeader>
          <SaleForm
            sale={currentSale}
            selectedProduct={selectedProduct}
            onSaleChange={setCurrentSale}
            onProductChange={setSelectedProduct}
            onAddProduct={handleAddProduct}
            onRemoveItem={handleRemoveItem}
            onSubmit={handleSubmit}
            customers={customers}
            products={products}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
