import React, { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { FormatCurrency } from "@/components/FormatCurrency";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Search, Check, Clock, AlertCircle } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ReceivableDialog } from "@/components/ReceivableDialog";
import { toast } from "sonner";

const Receivables = () => {
  const { receivables, customers, updateReceivable } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReceivables, setSelectedReceivables] = useState<string[]>([]);
  
  // Get today's date in YYYY-MM-DD format
  const todayDate = new Date().toISOString().split("T")[0];
  
  // Calculate metrics
  const totalReceivables = receivables.filter(r => r.status === "pending").reduce((acc, r) => acc + r.amount, 0);
  const overdueReceivables = receivables.filter(r => {
    const isOverdue = r.status === "pending" && new Date(r.dueDate) < new Date();
    return isOverdue;
  }).reduce((acc, r) => acc + r.amount, 0);
  const receivedToday = receivables.filter(r => {
    const isToday = r.paymentDate && new Date(r.paymentDate).toISOString().split("T")[0] === todayDate;
    return r.status === "paid" && isToday;
  }).reduce((acc, r) => acc + r.amount, 0);

  const handleBatchPayment = (
    paymentAmount: number,
    newDueDate?: string,
    applyDiscount?: boolean,
    discountValue?: number,
    discountType?: 'percentage' | 'fixed'
  ) => {
    const selected = receivables.filter(r => selectedReceivables.includes(r.id));
    const totalAmount = selected.reduce((sum, r) => sum + r.amount, 0);
    
    let remainingPayment = paymentAmount;
    
    // Calculate final amount considering discount/addition
    if (applyDiscount && discountValue) {
      const adjustmentAmount = discountType === 'percentage' 
        ? totalAmount * (discountValue / 100)
        : discountValue;
        
      remainingPayment = paymentAmount + (discountValue > 0 ? -adjustmentAmount : Math.abs(adjustmentAmount));
    }

    // Process each selected receivable
    selected.forEach(receivable => {
      if (remainingPayment >= receivable.amount) {
        // Full payment
        updateReceivable({
          ...receivable,
          status: "paid",
          paymentDate: new Date().toISOString(),
        });
        remainingPayment -= receivable.amount;
      } else if (remainingPayment > 0) {
        // Partial payment
        const remainingAmount = receivable.amount - remainingPayment;
        
        // Create new receivable for remaining amount
        const newReceivable = {
          ...receivable,
          id: generateId(),
          amount: remainingAmount,
          dueDate: newDueDate || receivable.dueDate,
        };
        
        // Update original receivable as paid
        updateReceivable({
          ...receivable,
          amount: remainingPayment,
          status: "paid",
          paymentDate: new Date().toISOString(),
        });
        
        // Add new receivable for remaining amount
        addReceivable(newReceivable);
        
        remainingPayment = 0;
      } else if (newDueDate && new Date(newDueDate) > new Date(receivable.dueDate)) {
        // Only renegotiate due date
        updateReceivable({
          ...receivable,
          dueDate: newDueDate,
        });
      }
    });

    toast.success("Pagamento processado com sucesso!");
    setIsDialogOpen(false);
    setSelectedReceivables([]);
  };

  const handleToggleSelect = (receivableId: string) => {
    setSelectedReceivables(prev => 
      prev.includes(receivableId)
        ? prev.filter(id => id !== receivableId)
        : [...prev, receivableId]
    );
  };

  const handleToggleSelectAll = () => {
    if (selectedReceivables.length === filteredReceivables.length) {
      setSelectedReceivables([]);
    } else {
      setSelectedReceivables(filteredReceivables.map(r => r.id));
    }
  };

  // Filter receivables
  const filteredReceivables = receivables.filter((receivable) => {
    const customer = customers.find((c) => c.id === receivable.customerId);
    const customerName = customer ? customer.name.toLowerCase() : "";
    
    const matchesSearch = 
      customerName.includes(searchTerm.toLowerCase()) ||
      new Date(receivable.dueDate).toLocaleDateString("pt-BR").includes(searchTerm);
    
    let matchesStatus = true;
    if (statusFilter === "pending") {
      matchesStatus = receivable.status === "pending";
    } else if (statusFilter === "paid") {
      matchesStatus = receivable.status === "paid";
    } else if (statusFilter === "overdue") {
      matchesStatus = receivable.status === "pending" && new Date(receivable.dueDate) < new Date();
    }
    
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string, dueDate: string) => {
    if (status === "paid") {
      return <Check className="h-4 w-4 text-green-600" />;
    }
    
    const isPastDue = new Date(dueDate) < new Date();
    return isPastDue ? 
      <AlertCircle className="h-4 w-4 text-red-600" /> : 
      <Clock className="h-4 w-4 text-yellow-600" />;
  };
  
  const getStatusText = (status: string, dueDate: string) => {
    if (status === "paid") {
      return "Pago";
    }
    
    const isPastDue = new Date(dueDate) < new Date();
    return isPastDue ? "Atrasado" : "Pendente";
  };
  
  const getStatusClass = (status: string, dueDate: string) => {
    if (status === "paid") {
      return "bg-green-100 text-green-800";
    }
    
    const isPastDue = new Date(dueDate) < new Date();
    return isPastDue ? "bg-red-100 text-red-800" : "bg-yellow-100 text-yellow-800";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Contas a Receber</h1>
        <p className="text-gray-500">Gerencie as contas a receber e pagamentos</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total a Receber</CardDescription>
            <CardTitle>
              <FormatCurrency value={totalReceivables} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Atrasado</CardDescription>
            <CardTitle className="text-red-600">
              <FormatCurrency value={overdueReceivables} />
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Recebido Hoje</CardDescription>
            <CardTitle className="text-green-600">
              <FormatCurrency value={receivedToday} />
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row justify-between">
        <div className="flex flex-1 gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Buscar por cliente ou data..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="paid">Pagos</SelectItem>
              <SelectItem value="overdue">Atrasados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedReceivables.length > 0 && (
          <Button 
            onClick={() => setIsDialogOpen(true)}
            className="shrink-0"
          >
            Processar {selectedReceivables.length} título(s)
          </Button>
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={selectedReceivables.length === filteredReceivables.length}
                  onCheckedChange={handleToggleSelectAll}
                />
              </TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceivables.length > 0 ? (
              filteredReceivables.map((receivable) => {
                const customer = customers.find((c) => c.id === receivable.customerId);
                const isPastDue = receivable.status === "pending" && new Date(receivable.dueDate) < new Date();
                
                return (
                  <TableRow key={receivable.id}>
                    <TableCell>
                      {receivable.status === "pending" && (
                        <Checkbox
                          checked={selectedReceivables.includes(receivable.id)}
                          onCheckedChange={() => handleToggleSelect(receivable.id)}
                        />
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {customer?.name || "Cliente não encontrado"}
                    </TableCell>
                    <TableCell>
                      {new Date(receivable.dueDate).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-right">
                      <FormatCurrency value={receivable.amount} />
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                          getStatusClass(receivable.status, receivable.dueDate)
                        }`}
                      >
                        {getStatusIcon(receivable.status, receivable.dueDate)}
                        <span>{getStatusText(receivable.status, receivable.dueDate)}</span>
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  {searchTerm || statusFilter !== "all"
                    ? "Nenhuma conta encontrada com os filtros aplicados"
                    : "Nenhuma conta a receber registrada"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <ReceivableDialog
          selectedReceivables={receivables.filter(r => selectedReceivables.includes(r.id))}
          onConfirmPayment={handleBatchPayment}
          onClose={() => setIsDialogOpen(false)}
        />
      </Dialog>
    </div>
  );
};

export default Receivables;
