import React from 'react';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InstallmentDate {
  installmentNumber: number;
  dueDate: string;
}

interface InstallmentDatesDialogProps {
  installments: number;
  firstDueDate: string;
  onConfirm: (dates: InstallmentDate[]) => void;
  onClose: () => void;
}

export const InstallmentDatesDialog: React.FC<InstallmentDatesDialogProps> = ({
  installments,
  firstDueDate,
  onConfirm,
  onClose,
}) => {
  const [installmentDates, setInstallmentDates] = React.useState<InstallmentDate[]>([]);

  // Inicializa as datas quando o componente é montado ou quando as props mudam
  React.useEffect(() => {
    const dates: InstallmentDate[] = [];
    const firstDate = new Date(firstDueDate);

    for (let i = 0; i < installments; i++) {
      const date = new Date(firstDate);
      date.setMonth(date.getMonth() + i);
      
      dates.push({
        installmentNumber: i + 1,
        dueDate: date.toISOString().split('T')[0]
      });
    }

    setInstallmentDates(dates);
  }, [installments, firstDueDate]);

  const handleDateChange = (index: number, newDate: string) => {
    setInstallmentDates(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        dueDate: newDate
      };
      return updated;
    });
  };

  const handleConfirm = () => {
    // Verifica se as datas estão em ordem crescente
    for (let i = 1; i < installmentDates.length; i++) {
      const prevDate = new Date(installmentDates[i - 1].dueDate);
      const currentDate = new Date(installmentDates[i].dueDate);
      
      if (currentDate <= prevDate) {
        alert("As datas das parcelas devem estar em ordem crescente");
        return;
      }
    }

    onConfirm(installmentDates);
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Datas de Vencimento</DialogTitle>
        <DialogDescription>
          Defina a data de vencimento para cada parcela.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        {installmentDates.map((installment, index) => (
          <div key={installment.installmentNumber} className="grid gap-2">
            <Label htmlFor={`installment-${index}`}>
              Parcela {installment.installmentNumber}/{installments}
            </Label>
            <Input
              id={`installment-${index}`}
              type="date"
              value={installment.dueDate}
              onChange={(e) => handleDateChange(index, e.target.value)}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm}>
          Confirmar
        </Button>
      </div>
    </DialogContent>
  );
}; 