import React, { useState, useEffect, useCallback } from "react";
import { useAppContext, PaymentStatus, Receivable, PaymentHistoryEntry } from "@/contexts/AppContext";
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
import { Search, Check, Clock, AlertCircle, Receipt, ChevronDown, ChevronRight, Calendar } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { ReceivableDialog } from "@/components/ReceivableDialog";
import { ReversalDialog } from "@/components/ReversalDialog";
import { toast } from "sonner";
import { DueDateDialog } from "@/components/DueDateDialog";

const Receivables = () => {
  console.log("Receivables component - Início da renderização");

  const { 
    receivables, 
    customers, 
    updateReceivable, 
    setReceivables,
    sales,
    setSales,
    batchPaymentAmount,
    setBatchPaymentAmount
  } = useAppContext();

  console.log("Dados do contexto:", { 
    receivablesCount: receivables?.length,
    customersCount: customers?.length,
    salesCount: sales?.length
  });

  // Filtra os recebíveis para mostrar apenas os que têm vendas existentes
  useEffect(() => {
    const validReceivables = receivables.filter(receivable => {
      const saleExists = sales.some(sale => sale.id === receivable.saleId);
      return saleExists;
    });

    if (validReceivables.length !== receivables.length) {
      setReceivables(validReceivables);
      toast.info("Algumas contas a receber foram removidas pois suas vendas não existem mais.");
    }
  }, [sales, receivables]);

  useEffect(() => {
    console.log("Receivables component - useEffect montagem");
    return () => {
      console.log("Receivables component - useEffect desmontagem");
    };
  }, []);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedReceivables, setSelectedReceivables] = useState<string[]>([]);
  const [isReverseMode, setIsReverseMode] = useState(false);
  const [expandedReceivables, setExpandedReceivables] = useState<string[]>([]);
  const [showBatchPaymentDialog, setShowBatchPaymentDialog] = useState(false);
  const [showReversalDialog, setShowReversalDialog] = useState(false);
  const [selectedReceivableForReversal, setSelectedReceivableForReversal] = useState<Receivable | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDueDateDialog, setShowDueDateDialog] = useState(false);
  const [selectedReceivableForDueDate, setSelectedReceivableForDueDate] = useState<Receivable | null>(null);

  const todayDate = new Date().toISOString().split("T")[0];
  
  const totals = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    
    return {
      totalReceivables: receivables.reduce((acc, r) => 
        r.status === "pending" ? acc + r.amount : acc, 0
      ),
      
      overdueReceivables: receivables.reduce((acc, r) => {
        const isOverdue = r.status === "pending" && new Date(r.dueDate) < new Date();
        return isOverdue ? acc + r.amount : acc;
      }, 0),
      
      receivedToday: receivables.reduce((acc, r) => {
        // Filtra transações de hoje
        const todayTransactions = (r.paymentHistory || []).filter(p => 
          p.date.split('T')[0] === today
        );

        // Soma pagamentos e subtrai estornos
        return acc + todayTransactions.reduce((sum, transaction) => {
          if (transaction.type === 'payment') {
            return sum + transaction.amount;
          } else if (transaction.type === 'reversal') {
            return sum - transaction.amount;
          }
          return sum;
        }, 0);
      }, 0)
    };
  }, [receivables]);

  const getPaymentHistory = (receivableId: string) => {
    const receivable = receivables.find(r => r.id === receivableId);
    if (!receivable) return [];
    
    return receivable.paymentHistory || [];
  };

  const handleBatchPayment = useCallback(async () => {
    try {
      console.log('Iniciando processamento de pagamento:', { batchPaymentAmount, selectedReceivables });

      if (!batchPaymentAmount || batchPaymentAmount <= 0) {
        console.log('Valor inválido:', batchPaymentAmount);
        toast.error("O valor do pagamento deve ser maior que zero");
        return;
      }

      const selectedReceivablesList = receivables.filter(r => selectedReceivables.includes(r.id));
      const totalSelectedAmount = selectedReceivablesList.reduce((sum, r) => sum + r.amount, 0);

      console.log('Valores selecionados:', { 
        totalSelectedAmount, 
        selectedCount: selectedReceivablesList.length 
      });

      if (batchPaymentAmount > totalSelectedAmount) {
        toast.error("O valor do pagamento não pode ser maior que o valor total dos títulos selecionados");
        return;
      }

      let remainingPayment = batchPaymentAmount;
      const paymentDate = new Date().toISOString();
      let updatedReceivablesList = [...receivables];

      // Processa cada título selecionado
      for (const receivableId of selectedReceivables) {
        const receivableIndex = updatedReceivablesList.findIndex(r => r.id === receivableId);
        if (receivableIndex === -1) continue;

        const currentReceivable = updatedReceivablesList[receivableIndex];
        
        // Calcula o valor a ser pago neste título
        const currentPayment = Math.min(remainingPayment, currentReceivable.amount);
        remainingPayment -= currentPayment;

        console.log('Processando título:', {
          id: currentReceivable.id,
          valorOriginal: currentReceivable.amount,
          pagamento: currentPayment,
          restante: remainingPayment
        });

        // Prepara o histórico de pagamento
        const paymentHistoryEntry: PaymentHistoryEntry = {
          date: paymentDate,
          amount: currentPayment,
          type: 'payment',
          remainingAmount: currentReceivable.amount - currentPayment
        };

        // Atualiza o receivable
        const updatedReceivable: Receivable = {
          ...currentReceivable,
          amount: currentReceivable.amount - currentPayment,
          totalPaid: (currentReceivable.totalPaid || 0) + currentPayment,
          originalAmount: currentReceivable.originalAmount || currentReceivable.amount + (currentReceivable.totalPaid || 0),
          status: currentReceivable.amount - currentPayment <= 0 ? 'paid' as PaymentStatus : 'pending' as PaymentStatus,
          paymentHistory: [...(currentReceivable.paymentHistory || []), paymentHistoryEntry],
          ...(currentReceivable.amount - currentPayment <= 0 ? { paymentDate } : {})
        };

        console.log('Título atualizado:', {
          id: updatedReceivable.id,
          novoValor: updatedReceivable.amount,
          totalPago: updatedReceivable.totalPaid,
          status: updatedReceivable.status
        });

        // Atualiza a lista de receivables
        updatedReceivablesList[receivableIndex] = updatedReceivable;

        // Se este título faz parte de um parcelamento, verifica o status geral
        if (updatedReceivable.totalInstallments && updatedReceivable.totalInstallments > 1) {
          const allInstallments = updatedReceivablesList.filter(
            r => r.saleId === updatedReceivable.saleId
          );

          const allPaid = allInstallments.every(r => r.status === 'paid');
          if (allPaid) {
            // Atualiza o status da venda
            const saleId = updatedReceivable.saleId;
            const relatedSale = sales.find(s => s.id === saleId);
            if (relatedSale) {
              setSales(prevSales =>
                prevSales.map(s =>
                  s.id === saleId ? { ...s, paymentStatus: 'paid' as PaymentStatus } : s
                )
              );
            }
          }
        }
      }

      // Atualiza o estado dos receivables
      setReceivables(updatedReceivablesList);

      // Limpa a seleção e fecha o diálogo
      setSelectedReceivables([]);
      setBatchPaymentAmount(0);
      setShowBatchPaymentDialog(false);

      console.log('Pagamento processado com sucesso');
      toast.success('Pagamento processado com sucesso!');

    } catch (error) {
      console.error('Erro ao processar pagamento:', error);
      toast.error('Erro ao processar pagamento. Por favor, tente novamente.');
    }
  }, [batchPaymentAmount, receivables, selectedReceivables, setBatchPaymentAmount, setReceivables, setSales]);

  const handleReversal = (receivableId: string) => {
    const receivable = receivables.find(r => r.id === receivableId);
    if (!receivable) {
      toast.error("Título não encontrado");
      return;
    }
    
    setSelectedReceivableForReversal(receivable);
    setShowReversalDialog(true);
  };

  const processReversal = useCallback(() => {
    if (!selectedReceivableForReversal) return;

    try {
      // Se for um grupo de parcelas (identificado pelo totalInstallments > 1)
      if (selectedReceivableForReversal.totalInstallments && selectedReceivableForReversal.totalInstallments > 1) {
        // Encontra todas as parcelas do mesmo grupo
        const allInstallments = receivables.filter(r => 
          r.saleId === selectedReceivableForReversal.saleId
        );

        // Processa o estorno para cada parcela
        allInstallments.forEach(receivable => {
          const paymentHistory = receivable.paymentHistory || [];
          const originalAmount = receivable.originalAmount || receivable.amount;

          // Get all payments and reversals sorted by date (most recent first)
          const allTransactions = [...paymentHistory].sort((a, b) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
          );

          // Find the latest payment that hasn't been reversed
          const lastPayment = allTransactions.find(transaction => {
            if (transaction.type === 'payment') {
              // Check if this payment has already been reversed
              const wasReversed = allTransactions.some(
                t => t.type === 'reversal' && t.reversedPaymentDate === transaction.date
              );
              return !wasReversed;
            }
            return false;
          });

          if (lastPayment) {
            const newRemainingAmount = receivable.amount + lastPayment.amount;
            
            if (newRemainingAmount <= originalAmount) {
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
                amount: newRemainingAmount,
                status: "pending" as PaymentStatus,
                paymentHistory: newPaymentHistory,
                totalPaid: Math.max(0, (receivable.totalPaid || 0) - lastPayment.amount)
              };
              
              if (receivable.status === "paid" && updatedReceivable.amount > 0) {
                delete updatedReceivable.paymentDate;
              }
              
              updateReceivable(updatedReceivable);
            }
          }
        });

        setShowReversalDialog(false);
        toast.success("Estorno de todas as parcelas processado com sucesso!");
        return;
      }

      // Caso seja uma parcela única, mantém a lógica original
      const receivable = selectedReceivableForReversal;
      const paymentHistory = receivable.paymentHistory || [];
      const originalAmount = receivable.originalAmount || receivable.amount;
      
      // Get all payments and reversals sorted by date (most recent first)
      const allTransactions = [...paymentHistory].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      // Find the latest payment that hasn't been reversed
      const lastPayment = allTransactions.find(transaction => {
        if (transaction.type === 'payment') {
          // Check if this payment has already been reversed
          const wasReversed = allTransactions.some(
            t => t.type === 'reversal' && t.reversedPaymentDate === transaction.date
          );
          return !wasReversed;
        }
        return false;
      });

      // Se não há pagamentos disponíveis para estorno
      if (!lastPayment) {
        toast.error("Não há pagamentos disponíveis para estorno");
        setShowReversalDialog(false);
        return;
      }
      
      // Calculate the new remaining amount after reversal
      const newRemainingAmount = receivable.amount + lastPayment.amount;
      
      // Check if reversal would exceed original amount
      if (newRemainingAmount > originalAmount) {
        toast.error("Não é possível estornar: o valor restante ultrapassaria o valor original da parcela");
        setShowReversalDialog(false);
        return;
      }
      
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
        amount: newRemainingAmount,
        status: "pending" as PaymentStatus,
        paymentHistory: newPaymentHistory,
        totalPaid: Math.max(0, (receivable.totalPaid || 0) - lastPayment.amount)
      };
      
      // If it was fully paid and now has remaining amount, remove payment date
      if (receivable.status === "paid" && updatedReceivable.amount > 0) {
        delete updatedReceivable.paymentDate;
      }
      
      updateReceivable(updatedReceivable);
      setShowReversalDialog(false);
      toast.success("Estorno processado com sucesso!");
    } catch (error) {
      console.error('Erro ao processar estorno:', error);
      toast.error('Erro ao processar estorno. Por favor, tente novamente.');
      setShowReversalDialog(false);
    }
  }, [selectedReceivableForReversal, updateReceivable, receivables]);

  const handleToggleSelect = (receivableId: string) => {
    setSelectedReceivables(prev => 
      prev.includes(receivableId)
        ? prev.filter(id => id !== receivableId)
        : [...prev, receivableId]
    );
  };

  const handleGroupSelect = (group: Receivable[], checked: boolean) => {
    const pendingReceivables = group.filter(r => r.status === "pending").map(r => r.id);
    
    setSelectedReceivables(prev => {
      if (checked) {
        // Adiciona todas as parcelas pendentes que ainda não estão selecionadas
        const newSelection = [...new Set([...prev, ...pendingReceivables])];
        return newSelection;
      } else {
        // Remove todas as parcelas do grupo
        return prev.filter(id => !pendingReceivables.includes(id));
      }
    });
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

  const toggleReceivableExpansion = (receivableId: string) => {
    setExpandedReceivables(prev => 
      prev.includes(receivableId)
        ? prev.filter(id => id !== receivableId)
        : [...prev, receivableId]
    );
  };

  // Group receivables by saleId for better visualization of installments
  const groupedReceivables = filteredReceivables.reduce((groups, receivable) => {
    // Only group receivables that are part of installment plans
    if (receivable.totalInstallments && receivable.totalInstallments > 1) {
      if (!groups[receivable.saleId]) {
        groups[receivable.saleId] = [];
      }
      groups[receivable.saleId].push(receivable);
    } else {
      // For non-installment receivables, use the ID as the group key
      groups[receivable.id] = [receivable];
    }
    return groups;
  }, {} as Record<string, Receivable[]>);

  // Sort installments within each group
  Object.keys(groupedReceivables).forEach(saleId => {
    if (groupedReceivables[saleId].length > 1) {
      groupedReceivables[saleId].sort((a, b) => 
        (a.installmentNumber || 0) - (b.installmentNumber || 0)
      );
    }
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

  console.log("Receivables component - Antes do render", {
    searchTerm,
    statusFilter,
    selectedReceivables,
    totals
  });

  // Initialize component
  useEffect(() => {
    setIsLoading(true);
    try {
      // Any initialization logic here
    } catch (error) {
      console.error('Erro ao inicializar componente:', error);
      toast.error('Erro ao carregar dados. Por favor, recarregue a página.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleEditDueDate = (receivableId: string) => {
    const receivable = receivables.find(r => r.id === receivableId);
    if (!receivable) {
      toast.error("Título não encontrado");
      return;
    }
    
    setSelectedReceivableForDueDate(receivable);
    setShowDueDateDialog(true);
  };

  const handleDueDateChange = (newDate: string) => {
    if (!selectedReceivableForDueDate) return;

    try {
      const updatedReceivable = {
        ...selectedReceivableForDueDate,
        dueDate: newDate // Usando diretamente a data ISO que já foi ajustada no DueDateDialog
      };

      updateReceivable(updatedReceivable);
      setShowDueDateDialog(false);
      setSelectedReceivableForDueDate(null);
      toast.success("Data de vencimento atualizada com sucesso!");
    } catch (error) {
      console.error('Erro ao atualizar data:', error);
      toast.error('Erro ao atualizar data. Por favor, tente novamente.');
    }
  };

  const renderActions = (receivable: Receivable) => {
    if (isReverseMode && (receivable.totalPaid || 0) > 0) {
      return (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => handleReversal(receivable.id)}
          className="text-amber-600"
        >
          <Receipt className="h-4 w-4 mr-1" /> Estornar
        </Button>
      );
    }

    if (receivable.status === "pending") {
      return (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEditDueDate(receivable.id)}
            className="text-blue-600"
          >
            <Calendar className="h-4 w-4 mr-1" /> Alterar Vencimento
          </Button>
        </div>
      );
    }

    return null;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Carregando...</div>;
  }

  try {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="page-title">Contas a Receber</h1>
          <p className="page-subtitle">Gerencie as contas a receber e pagamentos</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total a Receber</CardDescription>
              <CardTitle>
                <FormatCurrency value={totals.totalReceivables} />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Atrasado</CardDescription>
              <CardTitle className="text-red-600">
                <FormatCurrency value={totals.overdueReceivables} />
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Recebido Hoje</CardDescription>
              <CardTitle className="text-green-600">
                <FormatCurrency value={totals.receivedToday} />
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
                onClick={() => setShowBatchPaymentDialog(true)}
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
              {Object.keys(groupedReceivables).length > 0 ? (
                Object.entries(groupedReceivables).map(([groupId, group]) => {
                  const mainReceivable = group[0];
                  const customer = customers.find((c) => c.id === mainReceivable.customerId);
                  const isInstallmentPlan = group.length > 1;
                  const isExpanded = expandedReceivables.includes(groupId);
                  
                  const totalPaid = mainReceivable.totalPaid || 0;
                  const originalAmount = mainReceivable.originalAmount || mainReceivable.amount + totalPaid;
                  const remainingAmount = mainReceivable.amount;
                  const installmentNumber = mainReceivable.installmentNumber || 1;
                  const totalInstallments = mainReceivable.totalInstallments || 1;
                  
                  return (
                    <React.Fragment key={groupId}>
                      <TableRow 
                        onClick={() => isInstallmentPlan ? toggleReceivableExpansion(groupId) : null}
                        className={isInstallmentPlan ? "cursor-pointer hover:bg-gray-100" : ""}
                      >
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {(mainReceivable.status === "pending" || (isInstallmentPlan && group.some(r => r.status === "pending"))) && !isReverseMode && (
                            <Checkbox
                              checked={group.every(r => r.status === "paid" || selectedReceivables.includes(r.id))}
                              onCheckedChange={(checked) => handleGroupSelect(group, checked as boolean)}
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {isInstallmentPlan && (
                              isExpanded ? 
                                <ChevronDown className="h-4 w-4 text-gray-400" /> : 
                                <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                            <span>{customer?.name || "Cliente não encontrado"}</span>
                            {isInstallmentPlan && (
                              <span className="text-xs text-gray-500">
                                (Parcelado em {totalInstallments}x)
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {new Date(mainReceivable.dueDate).toLocaleDateString("pt-BR")}
                        </TableCell>
                        <TableCell className="text-right">
                          {isInstallmentPlan ? (
                            <FormatCurrency value={group.reduce((sum, r) => sum + r.amount, 0)} />
                          ) : (
                            <FormatCurrency value={remainingAmount} />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isInstallmentPlan ? (
                            <FormatCurrency value={group.reduce((sum, r) => sum + (r.totalPaid || 0), 0)} />
                          ) : (
                            <FormatCurrency value={totalPaid} />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {isInstallmentPlan ? (
                            <FormatCurrency value={group.reduce((sum, r) => sum + (r.originalAmount || r.amount + (r.totalPaid || 0)), 0)} />
                          ) : (
                            <FormatCurrency value={originalAmount} />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {installmentNumber}/{totalInstallments}
                        </TableCell>
                        <TableCell className="text-center">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                              getStatusClass(mainReceivable.status, mainReceivable.dueDate)
                            }`}
                          >
                            {getStatusIcon(mainReceivable.status, mainReceivable.dueDate)}
                            <span>{getStatusText(mainReceivable.status, mainReceivable.dueDate)}</span>
                          </span>
                        </TableCell>
                        <TableCell>
                          {isReverseMode && (group.some(r => (r.totalPaid || 0) > 0)) ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleReversal(mainReceivable.id)}
                              className="text-amber-600"
                            >
                              <Receipt className="h-4 w-4 mr-1" /> Estornar Todas
                            </Button>
                          ) : renderActions(mainReceivable)}
                        </TableCell>
                      </TableRow>
                      
                      {/* Show installment details when expanded */}
                      {isExpanded && isInstallmentPlan && group.map((installment, index) => (
                        <TableRow 
                          key={`${groupId}-installment-${installment.id}`} 
                          className="bg-gray-50 text-sm"
                        >
                          <TableCell>
                            {installment.status === "pending" && !isReverseMode && (
                              <Checkbox
                                checked={selectedReceivables.includes(installment.id)}
                                onCheckedChange={() => handleToggleSelect(installment.id)}
                              />
                            )}
                          </TableCell>
                          <TableCell className="pl-8">
                            Parcela {installment.installmentNumber}/{installment.totalInstallments}
                          </TableCell>
                          <TableCell>
                            {new Date(installment.dueDate).toLocaleDateString("pt-BR")}
                          </TableCell>
                          <TableCell className="text-right">
                            <FormatCurrency value={installment.amount} />
                          </TableCell>
                          <TableCell className="text-right">
                            <FormatCurrency value={installment.totalPaid || 0} />
                          </TableCell>
                          <TableCell className="text-right">
                            <FormatCurrency value={(installment.originalAmount || installment.amount + (installment.totalPaid || 0))} />
                          </TableCell>
                          <TableCell className="text-center">
                            {installment.installmentNumber}/{installment.totalInstallments}
                          </TableCell>
                          <TableCell className="text-center">
                            <span
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                                getStatusClass(installment.status, installment.dueDate)
                              }`}
                            >
                              {getStatusIcon(installment.status, installment.dueDate)}
                              <span>{getStatusText(installment.status, installment.dueDate)}</span>
                            </span>
                          </TableCell>
                          <TableCell>
                            {renderActions(installment)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </React.Fragment>
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

        <Dialog open={showBatchPaymentDialog} onOpenChange={setShowBatchPaymentDialog}>
          <ReceivableDialog
            selectedReceivables={receivables.filter(r => selectedReceivables.includes(r.id))}
            onConfirmPayment={handleBatchPayment}
            onClose={() => setShowBatchPaymentDialog(false)}
          />
        </Dialog>

        {showReversalDialog && (
          <Dialog open={showReversalDialog} onOpenChange={(open) => {
            setShowReversalDialog(open);
            if (!open) {
              setSelectedReceivableForReversal(null);
            }
          }}>
            <ReversalDialog
              receivable={selectedReceivableForReversal}
              onConfirmReversal={processReversal}
              onClose={() => {
                setShowReversalDialog(false);
                setSelectedReceivableForReversal(null);
              }}
            />
          </Dialog>
        )}

        {showDueDateDialog && (
          <Dialog 
            open={showDueDateDialog} 
            onOpenChange={(open) => {
              setShowDueDateDialog(open);
              if (!open) {
                setSelectedReceivableForDueDate(null);
              }
            }}
          >
            <DueDateDialog
              receivable={selectedReceivableForDueDate}
              onConfirm={handleDueDateChange}
              onClose={() => {
                setShowDueDateDialog(false);
                setSelectedReceivableForDueDate(null);
              }}
            />
          </Dialog>
        )}
      </div>
    );
  } catch (error) {
    console.error("Erro na renderização do Receivables:", error);
    return <div>Erro ao carregar a página de Contas a Receber. Por favor, tente novamente.</div>;
  }
};

export default Receivables;
