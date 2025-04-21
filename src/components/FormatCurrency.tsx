
import React from "react";

type FormatCurrencyProps = {
  value: number;
  className?: string;
};

export const FormatCurrency: React.FC<FormatCurrencyProps> = ({ value, className }) => {
  const formattedValue = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

  return <span className={className}>{formattedValue}</span>;
};
