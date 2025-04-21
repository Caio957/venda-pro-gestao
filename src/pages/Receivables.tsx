import React, { useState } from "react";
import { useAppContext, PaymentStatus, Receivable } from "@/contexts/AppContext";
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
import { Search, Check, Clock, AlertCircle, Receipt } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ReceivableDialog } from "@/components/ReceivableDialog";
import { toast } from "sonner";

const Receivables = () => {
  const { receivables, customers, updateReceivable, addReceivable } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReceivables, setSelectedReceivables] = useState<string[]>([]);
  const [isReverseMode, setIsReverseMode] = useState(false);
  const expandedReceivableIds = React.useState<string[]>([]);
  const [expandedReceivables, setExpandedReceivables] = expandedReceivableIds;

  const todayDate = new Date().toISOString().split("T")[0];
  
  const totalReceivables = receivables.filter(r => r.status === "pending").reduce((acc, r) => acc + r.amount, 0);
  const overdueReceivables = receivables.filter(r => {
    const isOverdue = r.status === "pending" && new Date(r.dueDate) < new Date();
    return isOverdue;
  }).reduce((acc, r) => acc + r.amount, 0);
  const receivedToday = receivables.filter(r => {
    const isToday = r.paymentDate && new Date(r.paymentDate).toISOString().split("T")[0] === todayDate;
    return r.status === "paid" && isToday;
  }).reduce((acc, r) => acc + r.amount, 0);

  const getPaymentHistory = (receivableId: string) => {
    const receivable = receivables.find(r => r.id === receivableId);
    if (!receivable) return [];
    
    return receivable.paymentHistory || [];
  };

  const handleBatchPayment = (
    paymentAmount: number,
    newDueDate?: string,
    applyDiscount?: boolean,
    discountValue?: number,
    discountType?: 'percentage' | 'fixed'
  ) => {
    const selected = receivables.filter(r => selectedReceivables.includes(r.id));
    
    const sortedSelected = [...selected].sort(
      (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    );
    
    const totalAmount = sortedSelected.reduce((sum, r) => sum + r.amount, 0);
    
    let remainingPayment = paymentAmount;
    
    if (applyDiscount && discountValue) {
      const adjustmentAmount = discountType === 'percentage' 
        ? totalAmount * (discountValue / 100)
        : discountValue;
        
      remainingPayment = paymentAmount + (discountValue > 0 ? -adjustmentAmount : Math.abs(adjustmentAmount));
    }

    if (remainingPayment <= 0) {
      toast.error("Valor de pagamento inválido após aplicar desconto/acréscimo.");
      return;
    }

    for (const receivable of sortedSelected) {
      if (remainingPayment <= 0) {
        if (newDueDate && new Date(newDueDate) > new Date(receivable.dueDate)) {
          updateReceivable({
            ...receivable,
            dueDate: newDueDate,
          });
        }
      } else if (remainingPayment >= receivable.amount) {
        const originalAmount = receivable.amount;
        const paymentDate = new Date().toISOString();
        
        const paymentHistory = receivable.paymentHistory || [];
        
        const newPaymentHistory = [
          ...paymentHistory,
          {
            date: paymentDate,
            amount: originalAmount,
            type: 'payment' as const
          }
        ];
        
        updateReceivable({
          ...receivable,
          status: "paid" as PaymentStatus,
          paymentDate,
          paymentHistory: newPaymentHistory,
          originalAmount: receivable.originalAmount || receivable.amount,
          totalPaid: (receivable.totalPaid || 0) + originalAmount
        });
        
        remainingPayment -= originalAmount;
      } else {
        const newAmount = receivable.amount - remainingPayment;
        const paymentDate = new Date().toISOString();
        
        const paymentHistory = receivable.paymentHistory || [];
        
        const newPaymentHistory = [
          ...paymentHistory,
          {
            date: paymentDate,
            amount: remainingPayment,
            type: 'payment' as const
          }
        ];
        
        updateReceivable({
          ...receivable,
          amount: newAmount,
          dueDate: newDueDate || receivable.dueDate,
          originalAmount: receivable.originalAmount || receivable.amount,
          paymentHistory: newPaymentHistory,
          totalPaid: (receivable.totalPaid || 0) + remainingPayment
        });
        
        remainingPayment = 0;
      }
    }

    toast.success("Pagamento processado com sucesso!");
    setIsDialogOpen(false);
    setSelectedReceivables([]);
  };

  const handleReversal = (receivableId: string) => {
    const receivable = receivables.find(r => r.id === receivableId);
    if (!receivable) {
      toast.error("Título não encontrado");
      return;
    }
    
    const paymentHistory = receivable.paymentHistory || [];
    
    const lastPayments = [...paymentHistory].filter(p => p.type === 'payment').reverse();
    
    if (lastPayments.length === 0) {
      toast.error("Não há pagamentos para estornar");
      return;
    }
    
    const lastPayment = lastPayments[0];
    
    const newPaymentHistory = [
      ...paymentHistory,
      {
        date: new Date().toISOString(),
        amount: lastPayment.amount,
        type: 'reversal' as const,
        reversedPaymentDate: lastPayment.date
      }
    ];
    
    const updatedReceivable = {
      ...receivable,
      amount: receivable.amount + lastPayment.amount,
      status: "pending" as PaymentStatus,
      paymentHistory: newPaymentHistory,
      totalPaid: Math.max(0, (receivable.totalPaid || 0) - lastPayment.amount)
    };
    
    if (receivable.status === "paid" && updatedReceivable.status === "pending") {
      delete updatedReceivable.paymentDate;
    }
    
    updateReceivable(updatedReceivable);
    toast.success("Estorno processado com sucesso!");
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

  const toggleReceivableExpansion = (receivableId: string) => {
    setExpandedReceivables(prev => 
      prev.includes(receivableId)
        ? prev.filter(id => id !== receivableId)
        : [...prev, receivableId]
    );
  };

  const renderInstallments = (receivable: Receivable) => {
    const totalInstallments = receivable.totalInstallments || 1;
    const installments: Receivable[] = [];

    if (!receivable.totalInstallments || receivable.totalInstallments <= 1) {
      return null;
    }

    for (let i = 1; i <= totalInstallments; i++) {
      const installmentAmount = receivable.amount / totalInstallments;
      const installmentDueDate = new Date(receivable.dueDate);
      installmentDueDate.setMonth(installmentDueDate.getMonth() + (i - 1));

      installments.push({
        ...receivable,
        amount: installmentAmount,
        installmentNumber: i,
        dueDate: installmentDueDate.toISOString()
      });
    }

    return (
      <>
        {installments.map((installment, index) => (
          <TableRow 
            key={`${receivable.id}-installment-${index + 1}`} 
            className="bg-gray-50 text-sm"
          >
            <TableCell colSpan={9}>
              <div className="flex justify-between items-center">
                <span>
                  Parcela {installment.installmentNumber}/{totalInstallments}
                </span>
                <span>
                  <FormatCurrency value={installment.amount} />
                </span>
                <span>
                  {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </>
    );
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

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setIsReverseMode(!isReverseMode)}
            className={isReverseMode ? "bg-amber-100" : ""}
          >
            {isReverseMode ? "Cancelar Estorno" : "Modo Estorno"}
          </Button>

          {selectedReceivables.length > 0 && !isReverseMode && (
            <Button 
              onClick={() => setIsDialogOpen(true)}
              className="shrink-0"
            >
              Processar {selectedReceivables.length} título(s)
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[30px]">
                <Checkbox
                  checked={selectedReceivables.length === filteredReceivables.length && filteredReceivables.length > 0}
                  onCheckedChange={handleToggleSelectAll}
                />
              </TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor Restante</TableHead>
              <TableHead className="text-right">Valor Recebido</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead className="text-center">Parcelas</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-center">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceivables.length > 0 ? (
              filteredReceivables.map((receivable) => {
                const customer = customers.find((c) => c.id === receivable.customerId);
                const isPastDue = receivable.status === "pending" && new Date(receivable.dueDate) < new Date();
                
                const totalPaid = receivable.totalPaid || 0;
                const originalAmount = receivable.originalAmount || receivable.amount + totalPaid;
                const remainingAmount = receivable.amount;
                const installmentNumber = receivable.installmentNumber || 1;
                const totalInstallments = receivable.totalInstallments || 1;
                
                return (
                  <>
                    <TableRow 
                      key={receivable.id}
                      onClick={() => receivable.totalInstallments && receivable.totalInstallments > 1 
                        ? toggleReceivableExpansion(receivable.id) 
                        : null}
                      className={receivable.totalInstallments && receivable.totalInstallments > 1 
                        ? "cursor-pointer hover:bg-gray-100" 
                        : ""}
                    >
                      <TableCell>
                        {receivable.status === "pending" && !isReverseMode && (
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
                        <FormatCurrency value={remainingAmount} />
                      </TableCell>
                      <TableCell className="text-right">
                        <FormatCurrency value={totalPaid} />
                      </TableCell>
                      <TableCell className="text-right">
                        <FormatCurrency value={originalAmount} />
                      </TableCell>
                      <TableCell className="text-center">
                        {installmentNumber}/{totalInstallments}
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
                      <TableCell>
                        {isReverseMode && (receivable.totalPaid || 0) > 0 && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleReversal(receivable.id)}
                            className="text-amber-600"
                          >
                            <Receipt className="h-4 w-4 mr-1" /> Estornar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedReceivables.includes(receivable.id) && 
                      renderInstallments(receivable)}
                  </>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center">
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
