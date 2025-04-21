
import React, { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { FormatCurrency } from "@/components/FormatCurrency";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

  // Define the sale state
  const [currentSale, setCurrentSale] = useState<{
    id?: string;
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
    dueDate?: string;
  }>({
    customerId: "",
    date: new Date().toISOString().split("T")[0],
    items: [],
    total: 0,
    paymentMethod: "cash",
    paymentStatus: "paid",
  });

  // Track the selected product to add
  const [selectedProduct, setSelectedProduct] = useState({
    productId: "",
    quantity: 1
  });

  // Calculate total whenever items change
  useEffect(() => {
    const total = currentSale.items.reduce((sum, item) => sum + item.totalPrice, 0);
    setCurrentSale({
      ...currentSale,
      total
    });
  }, [currentSale.items]);

  // Payment method affects payment status
  useEffect(() => {
    if (currentSale.paymentMethod === 'cash' || currentSale.paymentMethod === 'credit_card' || currentSale.paymentMethod === 'debit_card') {
      setCurrentSale({
        ...currentSale,
        paymentStatus: 'paid',
        installments: undefined
      });
    } else if (currentSale.paymentMethod === 'installment') {
      setCurrentSale({
        ...currentSale,
        paymentStatus: 'pending',
        installments: currentSale.installments || 2,
        dueDate: currentSale.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0]
      });
    } else {
      setCurrentSale({
        ...currentSale,
        paymentStatus: 'pending',
        installments: undefined,
        dueDate: currentSale.dueDate || new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0]
      });
    }
  }, [currentSale.paymentMethod]);

  const handleOpenAddDialog = () => {
    setDialogMode("add");
    setCurrentSale({
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

  const handleOpenEditDialog = (sale: any) => {
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
      dueDate: sale.dueDate ? new Date(sale.dueDate).toISOString().split("T")[0] : undefined,
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

    // Check if product is already in the list
    const existingItemIndex = currentSale.items.findIndex(
      item => item.productId === selectedProduct.productId
    );

    if (existingItemIndex !== -1) {
      // Update existing item
      const updatedItems = [...currentSale.items];
      const newQuantity = updatedItems[existingItemIndex].quantity + selectedProduct.quantity;
      
      // Check if stock is sufficient
      if (newQuantity > product.stock && dialogMode === 'add') {
        toast.error("Estoque insuficiente");
        return;
      }

      updatedItems[existingItemIndex] = {
        ...updatedItems[existingItemIndex],
        quantity: newQuantity,
        totalPrice: newQuantity * product.salePrice
      };

      setCurrentSale({
        ...currentSale,
        items: updatedItems
      });
    } else {
      // Check if stock is sufficient for new item
      if (selectedProduct.quantity > product.stock && dialogMode === 'add') {
        toast.error("Estoque insuficiente");
        return;
      }

      // Add new item
      const newItem = {
        productId: selectedProduct.productId,
        quantity: selectedProduct.quantity,
        unitPrice: product.salePrice,
        totalPrice: selectedProduct.quantity * product.salePrice
      };

      setCurrentSale({
        ...currentSale,
        items: [...currentSale.items, newItem]
      });
    }

    // Reset selected product
    setSelectedProduct({
      productId: "",
      quantity: 1
    });
  };

  const handleRemoveItem = (index: number) => {
    const updatedItems = [...currentSale.items];
    updatedItems.splice(index, 1);
    setCurrentSale({
      ...currentSale,
      items: updatedItems
    });
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setCurrentSale({
      ...currentSale,
      [name]: value,
    });
  };

  const handleSelectProductChange = (value: string) => {
    setSelectedProduct({
      ...selectedProduct,
      productId: value,
    });
  };

  const handleSelectCustomerChange = (value: string) => {
    setCurrentSale({
      ...currentSale,
      customerId: value,
    });
  };

  const handleSelectPaymentMethodChange = (value: string) => {
    setCurrentSale({
      ...currentSale,
      paymentMethod: value as PaymentMethod,
    });
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 1;
    setSelectedProduct({
      ...selectedProduct,
      quantity: value,
    });
  };

  const handleInstallmentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || 2;
    setCurrentSale({
      ...currentSale,
      installments: value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!currentSale.customerId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (currentSale.items.length === 0) {
      toast.error("Adicione pelo menos um produto");
      return;
    }

    if (dialogMode === "add") {
      addSale(currentSale);
    } else {
      updateSale(currentSale as any);
    }

    setIsDialogOpen(false);
  };

  const handleDelete = (sale: any) => {
    if (window.confirm("Tem certeza que deseja excluir esta venda?")) {
      deleteSale(sale.id);
    }
  };

  // Filter sales by search
  const filteredSales = sales.filter(sale => {
    const customer = customers.find(c => c.id === sale.customerId);
    const customerName = customer ? customer.name.toLowerCase() : "";
    const saleDate = new Date(sale.date).toLocaleDateString("pt-BR");
    
    return (
      customerName.includes(searchTerm.toLowerCase()) ||
      saleDate.includes(searchTerm.toLowerCase())
    );
  });

  // Format payment method to display
  const formatPaymentMethod = (method: PaymentMethod) => {
    switch (method) {
      case "cash":
        return "Dinheiro";
      case "credit_card":
        return "Cartão de Crédito";
      case "debit_card":
        return "Cartão de Débito";
      case "bank_transfer":
        return "Transferência";
      case "installment":
        return "Parcelado";
      default:
        return method;
    }
  };
  
  // Format payment status to display
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Vendas</h1>
          <p className="text-gray-500">Gerenciar vendas e transações</p>
        </div>
        <Button onClick={handleOpenAddDialog} className="h-9 gap-2 bg-primary-400 hover:bg-primary-500">
          <Plus size={16} />
          <span>Nova Venda</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
        <Input
          placeholder="Buscar vendas por cliente ou data..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="hidden md:table-cell">Forma de Pagamento</TableHead>
              <TableHead className="text-right">Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSales.length > 0 ? (
              filteredSales.map((sale) => {
                const customer = customers.find((c) => c.id === sale.customerId);
                return (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">
                      {customer?.name || "Cliente não encontrado"}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.date).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {formatPaymentMethod(sale.paymentMethod)}
                      {sale.installments ? ` (${sale.installments}x)` : ""}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          sale.paymentStatus === "paid"
                            ? "bg-green-100 text-green-800"
                            : sale.paymentStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {formatPaymentStatus(sale.paymentStatus)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <FormatCurrency value={sale.total} />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(sale)}
                        >
                          <Edit size={16} />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(sale)}
                        >
                          <Trash size={16} />
                          <span className="sr-only">Excluir</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  {searchTerm
                    ? "Nenhuma venda encontrada"
                    : "Nenhuma venda registrada"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "add" ? "Nova Venda" : "Editar Venda"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 py-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Cliente</label>
                  {customers.length > 0 ? (
                    <Select 
                      value={currentSale.customerId} 
                      onValueChange={handleSelectCustomerChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um cliente" />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="flex items-center justify-between rounded-md border border-dashed p-2 text-sm text-gray-500">
                      <span>Nenhum cliente cadastrado</span>
                      <a href="/customers" className="text-primary-500 underline">
                        Adicionar clientes
                      </a>
                    </div>
                  )}
                </div>
                <div className="grid gap-2">
                  <label htmlFor="date" className="text-sm font-medium">
                    Data
                  </label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={currentSale.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="rounded-md border p-4">
                <h3 className="mb-4 text-sm font-medium">Adicionar Produtos</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <div className="grid gap-2 sm:col-span-2">
                    <label className="text-xs text-gray-500">Produto</label>
                    <Select
                      value={selectedProduct.productId}
                      onValueChange={handleSelectProductChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um produto" />
                      </SelectTrigger>
                      <SelectContent>
                        {products
                          .filter(p => p.stock > 0 || dialogMode === 'edit')
                          .map((product) => (
                            <SelectItem key={product.id} value={product.id}>
                              {product.name} - {product.stock} em estoque - <FormatCurrency value={product.salePrice} />
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-xs text-gray-500">Quantidade</label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        value={selectedProduct.quantity}
                        onChange={handleQuantityChange}
                      />
                      <Button
                        type="button"
                        onClick={handleAddProduct}
                        size="sm"
                        className="bg-primary-400 hover:bg-primary-500"
                      >
                        <Plus size={16} />
                      </Button>
                    </div>
                  </div>
                </div>

                {currentSale.items.length > 0 && (
                  <div className="mt-4">
                    <h4 className="mb-2 text-xs font-medium text-gray-500">
                      Itens Adicionados
                    </h4>
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto</TableHead>
                            <TableHead className="text-right">Qtd</TableHead>
                            <TableHead className="text-right">Preço Unit.</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {currentSale.items.map((item, index) => {
                            const product = products.find(p => p.id === item.productId);
                            return (
                              <TableRow key={index}>
                                <TableCell>
                                  {product?.name || "Produto não encontrado"}
                                </TableCell>
                                <TableCell className="text-right">
                                  {item.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  <FormatCurrency value={item.unitPrice} />
                                </TableCell>
                                <TableCell className="text-right">
                                  <FormatCurrency value={item.totalPrice} />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleRemoveItem(index)}
                                  >
                                    <X size={16} />
                                    <span className="sr-only">Remover</span>
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </div>

              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium">
                        Forma de Pagamento
                      </label>
                      <Select
                        value={currentSale.paymentMethod}
                        onValueChange={handleSelectPaymentMethodChange}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Dinheiro</SelectItem>
                          <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                          <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                          <SelectItem value="bank_transfer">Transferência</SelectItem>
                          <SelectItem value="installment">Parcelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Show installments field only for installment payment method */}
                    {currentSale.paymentMethod === "installment" && (
                      <div className="grid gap-2">
                        <label htmlFor="installments" className="text-sm font-medium">
                          Parcelas
                        </label>
                        <Input
                          id="installments"
                          name="installments"
                          type="number"
                          min="2"
                          value={currentSale.installments || 2}
                          onChange={handleInstallmentsChange}
                        />
                      </div>
                    )}
                    
                    {/* Show due date for any payment method that's not immediate */}
                    {(currentSale.paymentMethod === "bank_transfer" || 
                      currentSale.paymentMethod === "installment") && (
                      <div className="grid gap-2 sm:col-span-2">
                        <label htmlFor="dueDate" className="text-sm font-medium">
                          Data de Vencimento
                        </label>
                        <Input
                          id="dueDate"
                          name="dueDate"
                          type="date"
                          value={currentSale.dueDate}
                          onChange={handleInputChange}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t pt-4">
                    <span className="text-sm font-medium">Total:</span>
                    <FormatCurrency
                      value={currentSale.total}
                      className="text-xl font-bold text-gray-900"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="bg-primary-400 hover:bg-primary-500">
                Salvar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
