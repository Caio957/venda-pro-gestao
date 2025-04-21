
import React, { useState } from "react";
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

const Receivables = () => {
  const { receivables, customers, updateReceivable } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentReceivable, setCurrentReceivable] = useState<any>(null);
  
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
  
  const handleOpenDetailDialog = (receivable: any) => {
    setCurrentReceivable(receivable);
    setIsDialogOpen(true);
  };
  
  const handleMarkAsPaid = () => {
    if (!currentReceivable) return;
    
    const updatedReceivable = {
      ...currentReceivable,
      status: "paid",
      paymentDate: new Date().toISOString(),
    };
    
    updateReceivable(updatedReceivable);
    setIsDialogOpen(false);
  };

  // Filter receivables by search term and status
  const filteredReceivables = receivables.filter((receivable) => {
    const customer = customers.find((c) => c.id === receivable.customerId);
    const customerName = customer ? customer.name.toLowerCase() : "";
    
    // Check if receivable matches search term
    const matchesSearch = 
      customerName.includes(searchTerm.toLowerCase()) ||
      new Date(receivable.dueDate).toLocaleDateString("pt-BR").includes(searchTerm);
    
    // Check if receivable matches status filter
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

      <div className="flex flex-col gap-4 sm:flex-row">
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

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-center">Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceivables.length > 0 ? (
              filteredReceivables.map((receivable) => {
                const customer = customers.find(
                  (c) => c.id === receivable.customerId
                );
                
                const isPastDue = receivable.status === "pending" && new Date(receivable.dueDate) < new Date();
                
                return (
                  <TableRow key={receivable.id}>
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
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetailDialog(receivable)}
                      >
                        {receivable.status === "paid" ? "Detalhes" : "Receber"}
                      </Button>
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

      {currentReceivable && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {currentReceivable.status === "paid"
                  ? "Detalhes do Pagamento"
                  : "Receber Pagamento"}
              </DialogTitle>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Cliente</p>
                  <p className="text-lg font-medium">
                    {customers.find((c) => c.id === currentReceivable.customerId)
                      ?.name || "Cliente não encontrado"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Valor</p>
                  <p className="text-lg font-medium">
                    <FormatCurrency value={currentReceivable.amount} />
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Vencimento</p>
                  <p className="text-base">
                    {new Date(
                      currentReceivable.dueDate
                    ).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
                      getStatusClass(currentReceivable.status, currentReceivable.dueDate)
                    }`}
                  >
                    {getStatusIcon(currentReceivable.status, currentReceivable.dueDate)}
                    <span>{getStatusText(currentReceivable.status, currentReceivable.dueDate)}</span>
                  </span>
                </div>
              </div>

              {currentReceivable.status === "paid" && currentReceivable.paymentDate && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Data de Pagamento</p>
                  <p className="text-base">
                    {new Date(
                      currentReceivable.paymentDate
                    ).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
              >
                Fechar
              </Button>
              {currentReceivable.status !== "paid" && (
                <Button 
                  className="bg-primary-400 hover:bg-primary-500"
                  onClick={handleMarkAsPaid}
                >
                  Marcar como Pago
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Receivables;
