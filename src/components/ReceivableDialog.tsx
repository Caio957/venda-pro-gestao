
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { FormatCurrency } from "./FormatCurrency";

interface ReceivablePaymentProps {
  selectedReceivables: any[];
  onConfirmPayment: (paymentAmount: number, newDueDate?: string, applyDiscount?: boolean, discountValue?: number, discountType?: 'percentage' | 'fixed') => void;
  onClose: () => void;
}

export const ReceivableDialog: React.FC<ReceivablePaymentProps> = ({
  selectedReceivables,
  onConfirmPayment,
  onClose,
}) => {
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [wantToRenegotiate, setWantToRenegotiate] = useState(false);
  const [newDueDate, setNewDueDate] = useState("");
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [discountValue, setDiscountValue] = useState<string>("");
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

  const totalAmount = selectedReceivables.reduce((sum, r) => sum + r.amount, 0);

  const handleConfirm = () => {
    const amount = Number(paymentAmount) || 0;
    const discount = applyDiscount ? Number(discountValue) : 0;
    onConfirmPayment(amount, newDueDate, applyDiscount, discount, discountType);
  };

  return (
    <DialogContent className="sm:max-w-[500px]">
      <DialogHeader>
        <DialogTitle>Processar Pagamento</DialogTitle>
        <DialogDescription>
          Total selecionado: <FormatCurrency value={totalAmount} className="font-semibold" />
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div>
          <label className="text-sm font-medium mb-2 block">Valor do Pagamento</label>
          <Input
            type="number"
            value={paymentAmount}
            onChange={(e) => setPaymentAmount(e.target.value)}
            placeholder="Digite o valor do pagamento"
          />
        </div>

        <div className="flex items-center gap-2">
          <Checkbox
            id="renegotiate"
            checked={wantToRenegotiate}
            onCheckedChange={(checked) => setWantToRenegotiate(checked === true)}
          />
          <label htmlFor="renegotiate" className="text-sm">
            Renegociar prazo de pagamento
          </label>
        </div>

        {wantToRenegotiate && (
          <div>
            <label className="text-sm font-medium mb-2 block">Nova Data de Vencimento</label>
            <Input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
            />
          </div>
        )}

        <div className="flex items-center gap-2">
          <Checkbox
            id="discount"
            checked={applyDiscount}
            onCheckedChange={(checked) => setApplyDiscount(checked === true)}
          />
          <label htmlFor="discount" className="text-sm">
            Aplicar desconto/acréscimo
          </label>
        </div>

        {applyDiscount && (
          <div className="grid gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Valor</label>
              <Input
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="Digite o valor"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={discountType === 'percentage'}
                    onChange={() => setDiscountType('percentage')}
                  />
                  Porcentagem
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={discountType === 'fixed'}
                    onChange={() => setDiscountType('fixed')}
                  />
                  Valor Fixo
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm}>
          Confirmar Pagamento
        </Button>
      </DialogFooter>
    </DialogContent>
  );
};
