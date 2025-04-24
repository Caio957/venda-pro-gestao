import React from 'react';
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Receivable } from '@/contexts/AppContext';
import { FormatCurrency } from './FormatCurrency';
import { useAppContext } from '@/contexts/AppContext';

interface ReversalDialogProps {
  receivable: Receivable | null;
  onConfirmReversal: () => void;
  onClose: () => void;
}

export const ReversalDialog: React.FC<ReversalDialogProps> = ({
  receivable,
  onConfirmReversal,
  onClose,
}) => {
  const { receivables } = useAppContext();

  if (!receivable) return null;

  // Função para calcular o último pagamento não estornado
  const getLastPaymentInfo = (receivable: Receivable) => {
    const paymentHistory = receivable.paymentHistory || [];
    const allTransactions = [...paymentHistory].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const lastPayment = allTransactions.find(transaction => {
      if (transaction.type === 'payment') {
        const wasReversed = allTransactions.some(
          t => t.type === 'reversal' && t.reversedPaymentDate === transaction.date
        );
        return !wasReversed;
      }
      return false;
    });

    return lastPayment;
  };

  // Se for um grupo de parcelas, calcula o valor total recebido
  const getTotalReceivedAmount = () => {
    if (receivable.totalInstallments && receivable.totalInstallments > 1) {
      // Encontra todas as parcelas do mesmo grupo
      const allInstallments = receivables.filter(r => 
        r.saleId === receivable.saleId
      );

      // Soma o último pagamento não estornado de cada parcela
      return allInstallments.reduce((total, installment) => {
        const lastPayment = getLastPaymentInfo(installment);
        return total + (lastPayment?.amount || 0);
      }, 0);
    }

    // Se não for parcelado, retorna apenas o valor do último pagamento
    const lastPayment = getLastPaymentInfo(receivable);
    return lastPayment?.amount || 0;
  };

  const totalAmount = getTotalReceivedAmount();
  const lastPayment = getLastPaymentInfo(receivable);
  const paymentDate = lastPayment?.date ? new Date(lastPayment.date).toLocaleDateString("pt-BR") : '';

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Confirmar Estorno</DialogTitle>
      </DialogHeader>
      <div className="py-4">
        <p className="text-gray-600">
          {receivable.totalInstallments && receivable.totalInstallments > 1
            ? "Tem certeza que deseja estornar o último pagamento de todas as parcelas deste título?"
            : "Tem certeza que deseja estornar o último pagamento deste título?"
          }
        </p>
        <div className="mt-4 space-y-2">
          <p>
            <span className="font-medium">Valor a ser estornado: </span>
            <FormatCurrency value={totalAmount} />
          </p>
          {paymentDate && (
            <p>
              <span className="font-medium">Data do pagamento: </span>
              {paymentDate}
            </p>
          )}
        </div>
        <p className="mt-4 text-amber-600 text-sm">
          Atenção: Esta ação não pode ser desfeita.
        </p>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
          variant="destructive"
          onClick={onConfirmReversal}
        >
          Confirmar Estorno
        </Button>
      </div>
    </DialogContent>
  );
}; 