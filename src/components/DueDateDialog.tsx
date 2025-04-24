import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Receivable } from '@/contexts/AppContext';
import { toast } from "sonner";

interface DueDateDialogProps {
  receivable: Receivable | null;
  onConfirm: (newDate: string) => void;
  onClose: () => void;
}

export const DueDateDialog: React.FC<DueDateDialogProps> = ({
  receivable,
  onConfirm,
  onClose,
}) => {
  const [newDueDate, setNewDueDate] = React.useState("");

  React.useEffect(() => {
    if (receivable) {
      // Formata a data para o formato YYYY-MM-DD para o input date
      const formattedDate = new Date(receivable.dueDate).toISOString().split('T')[0];
      setNewDueDate(formattedDate);
    }
  }, [receivable]);

  const handleConfirm = () => {
    if (!newDueDate) {
      toast.error("Por favor, selecione uma data");
      return;
    }

    const selectedDate = new Date(newDueDate + 'T12:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Permite selecionar qualquer data, mas avisa se for uma data passada
    if (selectedDate < today) {
      if (!confirm("A data selecionada é anterior à data atual. Deseja continuar?")) {
        return;
      }
    }

    onConfirm(selectedDate.toISOString());
  };

  if (!receivable) return null;

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Alterar Data de Vencimento</DialogTitle>
        <DialogDescription>
          Selecione a nova data de vencimento para esta parcela.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="dueDate">Nova data de vencimento</Label>
          <Input
            id="dueDate"
            type="date"
            value={newDueDate}
            onChange={(e) => setNewDueDate(e.target.value)}
          />
        </div>
        {receivable.installmentNumber && (
          <p className="text-sm text-amber-600">
            Atenção: Esta alteração afetará apenas a parcela {receivable.installmentNumber}/{receivable.totalInstallments}.
          </p>
        )}
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm}>
          Confirmar Alteração
        </Button>
      </div>
    </DialogContent>
  );
}; 