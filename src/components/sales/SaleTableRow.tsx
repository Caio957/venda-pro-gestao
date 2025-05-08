
import React from "react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit, Trash } from "lucide-react";
import { FormatCurrency } from "@/components/FormatCurrency";
import { PaymentMethod, PaymentStatus } from "@/contexts/AppContext";

interface SaleTableRowProps {
  sale: {
    id: string;
    customerId: string;
    date: string;
    total: number;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
  };
  customer: { name: string } | undefined;
  onEdit: () => void;
  onDelete: () => void;
}

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
    case "bank_transfer":
      return "Transferência Bancária";
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

const SaleTableRow: React.FC<SaleTableRowProps> = ({ sale, customer, onEdit, onDelete }) => {
  return (
    <TableRow key={sale.id}>
      <TableCell>
        {customer?.name}
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
            onClick={onEdit}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onDelete}
          >
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export { SaleTableRow, formatPaymentMethod, formatPaymentStatus };
