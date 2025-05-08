import React, { useState, useMemo } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Sale, SelectedProduct } from "@/components/sales/types";
import SaleForm from "@/components/sales/SaleForm";
import SaleFilters from "@/components/sales/SaleFilters";
import { SaleTableRow } from "@/components/sales/SaleTableRow";

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

  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "pending" | "overdue">("all");

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

  const handleSubmit = (saleData: Sale) => {    
    if (dialogMode === "add") {
      addSale(saleData);
      toast.success("Venda registrada com sucesso");
    } else {
      updateSale(saleData);
      toast.success("Venda atualizada com sucesso");
    }

    setIsDialogOpen(false);
  };

  const handleDelete = async (sale: Sale) => {
    await deleteSale(sale.id);
    // If delete fails, error toast will be shown by the context
  };

  // Filtered sales based on search term and filters
  const filteredSales = useMemo(() => {
    return sales.filter(sale => {
      // Filter by customer
      const customerMatch = customers.find(c => c.id === sale.customerId)?.name
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      
      // Filter by date
      const saleDate = new Date(sale.date);
      const isAfterStart = !startDate || saleDate >= new Date(startDate);
      const isBeforeEnd = !endDate || saleDate <= new Date(endDate);
      
      // Filter by status
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

      <SaleFilters
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        startDate={startDate}
        setStartDate={setStartDate}
        endDate={endDate}
        setEndDate={setEndDate}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

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
              <SaleTableRow
                key={sale.id}
                sale={sale}
                customer={customers.find((c) => c.id === sale.customerId)}
                onEdit={() => handleOpenEditDialog(sale)}
                onDelete={() => handleDelete(sale)}
              />
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
            onSubmit={handleSubmit}
            initialValues={dialogMode === "edit" ? {
              id: currentSale.id,
              customerId: currentSale.customerId,
              date: currentSale.date,
              paymentMethod: currentSale.paymentMethod,
              paymentStatus: currentSale.paymentStatus,
            } : undefined}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Sales;
