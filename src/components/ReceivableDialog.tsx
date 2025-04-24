import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormatCurrency } from "@/components/FormatCurrency";
import { Receivable } from '@/contexts/AppContext';
import { useAppContext } from '@/contexts/AppContext';
import { toast } from "sonner";

interface ReceivableDialogProps {
  selectedReceivables: Receivable[];
  onConfirmPayment: () => Promise<void>;
  onClose: () => void;
}

export const ReceivableDialog: React.FC<ReceivableDialogProps> = ({
  selectedReceivables,
  onConfirmPayment,
  onClose,
}) => {
  const { setBatchPaymentAmount } = useAppContext();
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const [isFirstRender, setIsFirstRender] = React.useState(true);

  const totalAmount = selectedReceivables.reduce((sum, r) => sum + r.amount, 0);

  // Inicializa o valor do pagamento apenas na primeira renderização
  React.useEffect(() => {
    if (isFirstRender) {
      const formattedTotal = totalAmount.toFixed(2);
      setInputValue(formattedTotal);
      setBatchPaymentAmount(totalAmount);
      setIsFirstRender(false);
    }
  }, [isFirstRender, totalAmount, setBatchPaymentAmount]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Permite que o campo fique vazio para facilitar a digitação
    if (value === "") {
      setInputValue("");
      setBatchPaymentAmount(0);
      return;
    }

    // Remove caracteres não numéricos, exceto ponto
    const numericValue = value.replace(/[^\d.]/g, "");
    
    // Converte para número e valida
    const parsedValue = parseFloat(numericValue);
    
    // Se for um número válido e não maior que o total
    if (!isNaN(parsedValue) && parsedValue <= totalAmount) {
      setInputValue(numericValue);
      setBatchPaymentAmount(parsedValue);
    }
  };

  const handleConfirm = async () => {
    const numericValue = parseFloat(inputValue);

    if (!numericValue || numericValue <= 0) {
      toast.error("O valor do pagamento deve ser maior que zero");
      return;
    }

    if (numericValue > totalAmount) {
      toast.error("O valor do pagamento não pode ser maior que o valor total");
      return;
    }

    try {
      setIsProcessing(true);
      await onConfirmPayment();
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error("Erro ao processar pagamento");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Confirmar Pagamento</DialogTitle>
        <DialogDescription>
          Informe o valor recebido para processar o pagamento dos títulos selecionados.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-gray-500">
              Títulos selecionados: {selectedReceivables.length}
            </p>
            <p className="mb-4 text-sm text-gray-500">
              Valor total: <FormatCurrency value={totalAmount} />
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="paymentAmount">Valor recebido</Label>
            <Input
              id="paymentAmount"
              type="text"
              inputMode="decimal"
              value={inputValue}
              onChange={handleAmountChange}
              onFocus={(e) => e.target.select()}
              className="text-right"
              placeholder="0,00"
            />
            <p className="text-xs text-gray-500">
              Valor máximo permitido: <FormatCurrency value={totalAmount} />
            </p>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isProcessing}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={isProcessing}>
          {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
        </Button>
      </div>
    </DialogContent>
  );
};
