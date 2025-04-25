import React, { useState, useMemo, useCallback } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { FormatCurrency } from "@/components/FormatCurrency";
import { Button } from "@/components/ui/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, FileSpreadsheet, FileText, Loader2, AlertCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ptBR } from 'date-fns/locale';
import { PaymentMethod } from '@/contexts/AppContext';

type ReportType = 
  | "produtos-lucro" 
  | "vendas-periodo" 
  | "recebimentos-periodo" 
  | "estoque-baixo"
  | "vendas-cliente";

type ReportTemplate = "modelo1" | "modelo2" | "modelo3";

// Add proper type definitions
type ReportData = {
  [key: string]: string | number | Date;
};

type ReportConfig = {
  headers: string[];
  getData: () => ReportData[];
  filename: string;
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: 'Dinheiro',
  credit_card: 'Cartão de Crédito',
  debit_card: 'Cartão de Débito',
  bank_transfer: 'Transferência Bancária',
  installment: 'Parcelado',
  bank_slip: 'Boleto',
};

const Reports = () => {
  const { products, sales, receivables, customers } = useAppContext();
  const [reportType, setReportType] = useState<ReportType>("produtos-lucro");
  const [reportTemplate, setReportTemplate] = useState<ReportTemplate>("modelo1");
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Relatório de Produtos e Lucratividade
  const generateProductProfitReport = (): ReportData[] => {
    return products.map(product => ({
      produto: product.name,
      precoCusto: product.costPrice,
      precoVenda: product.salePrice,
      lucroReais: product.salePrice - product.costPrice,
      lucroPorcentagem: ((product.salePrice - product.costPrice) / product.costPrice) * 100,
      estoque: product.stock
    }));
  };

  // Relatório de Vendas por Período
  const generateSalesReport = (): ReportData[] => {
    return sales
      .filter(sale => {
        const saleDate = new Date(sale.date);
        return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      })
      .map(sale => {
        const customer = customers.find(c => c.id === sale.customerId);
        return {
          data: new Date(sale.date),
          cliente: customer?.name || 'Cliente não encontrado',
          valorTotal: sale.total,
          formaPgto: sale.paymentMethod,
          status: sale.paymentStatus,
          qtdItens: sale.items.reduce((acc, item) => acc + item.quantity, 0)
        };
      });
  };

  // Relatório de Recebimentos por Período
  const generateReceivablesReport = (): ReportData[] => {
    return receivables
      .filter(receivable => {
        const dueDate = new Date(receivable.dueDate);
        return dueDate >= new Date(startDate) && dueDate <= new Date(endDate);
      })
      .map(receivable => {
        const customer = customers.find(c => c.id === receivable.customerId);
        return {
          vencimento: new Date(receivable.dueDate),
          cliente: customer?.name || 'Cliente não encontrado',
          valor: receivable.originalAmount,
          status: receivable.status,
          pago: receivable.totalPaid,
          restante: receivable.originalAmount - receivable.totalPaid,
          parcela: `${receivable.installmentNumber}/${receivable.totalInstallments}`
        };
      });
  };

  // Relatório de Produtos com Estoque Baixo
  const generateLowStockReport = (): ReportData[] => {
    const LOW_STOCK_THRESHOLD = 5;
    
    return products
      .filter(product => product.stock <= LOW_STOCK_THRESHOLD)
      .map(product => ({
        produto: product.name,
        estoque: product.stock,
        precoCusto: product.costPrice,
        valorReposicao: product.costPrice * (LOW_STOCK_THRESHOLD - product.stock)
      }));
  };

  // Relatório de Vendas por Cliente
  const generateCustomerSalesReport = (): ReportData[] => {
    // Filter sales by date range and customer if selected
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      const isInDateRange = saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
      const isSelectedCustomer = selectedCustomerId === "all" || sale.customerId === selectedCustomerId;
      return isInDateRange && isSelectedCustomer;
    });

    // Get unique customer IDs from filtered sales
    const customerIds = selectedCustomerId === "all" 
      ? [...new Set(filteredSales.map(sale => sale.customerId))]
      : [selectedCustomerId];

    // Process only customers that have sales in the period
    const customerSales = customerIds
      .map(customerId => {
        const customer = customers.find(c => c.id === customerId);
        if (!customer) return null;

        const customerSales = filteredSales.filter(sale => sale.customerId === customerId);
        const totalAmount = customerSales.reduce((sum, sale) => sum + sale.total, 0);
        const totalItems = customerSales.reduce((sum, sale) => 
          sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0);
        
        return {
          cliente: customer.name,
          email: customer.email,
          telefone: customer.phone,
          quantidadeVendas: customerSales.length,
          quantidadeItens: totalItems,
          valorTotal: totalAmount,
          mediaVenda: customerSales.length > 0 ? totalAmount / customerSales.length : 0,
          ultimaCompra: customerSales.length > 0 
            ? new Date(Math.max(...customerSales.map(s => new Date(s.date).getTime())))
            : null
        };
      })
      .filter((data): data is NonNullable<typeof data> => 
        data !== null && data.quantidadeVendas > 0);

    // Sort by total amount descending
    return customerSales.sort((a, b) => (b.valorTotal || 0) - (a.valorTotal || 0));
  };

  // Add report configurations
  const REPORT_CONFIGS: Record<ReportType, ReportConfig> = {
    "produtos-lucro": {
      headers: ["Produto", "Preço Custo", "Preço Venda", "Lucro (R$)", "Lucro (%)", "Estoque"],
      getData: generateProductProfitReport,
      filename: 'produtos_lucratividade'
    },
    "vendas-periodo": {
      headers: ["Data", "Cliente", "Valor Total", "Forma Pgto.", "Status", "Qtd. Itens"],
      getData: generateSalesReport,
      filename: 'vendas_periodo'
    },
    "recebimentos-periodo": {
      headers: ["Vencimento", "Cliente", "Valor", "Status", "Pago", "Restante", "Parcela"],
      getData: generateReceivablesReport,
      filename: 'recebimentos_periodo'
    },
    "estoque-baixo": {
      headers: ["Produto", "Estoque", "Preço Custo", "Valor Reposição"],
      getData: generateLowStockReport,
      filename: 'produtos_estoque_baixo'
    },
    "vendas-cliente": {
      headers: ["Cliente", "Email", "Telefone", "Qtd. Vendas", "Qtd. Itens", "Valor Total", "Média/Venda", "Última Compra"],
      getData: generateCustomerSalesReport,
      filename: 'vendas_por_cliente'
    }
  };

  // Memoize report data
  const reportData = useMemo(() => {
    try {
      return REPORT_CONFIGS[reportType].getData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar relatório');
      return [];
    }
  }, [reportType, startDate, endDate, products, customers, sales, receivables]);

  // Validate date range
  const isDateRangeValid = useCallback(() => {
    if (!startDate || !endDate) return false;
    return new Date(startDate) <= new Date(endDate);
  }, [startDate, endDate]);

  // Função para exportar para CSV
  const exportToCSV = (data: any[], filename: string) => {
    // Converter objetos para array de valores
    const headers = Object.keys(data[0]);
    const csvData = data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Formatar valores monetários
        if (typeof value === 'number' && header.includes('valor') || header.includes('preco')) {
          return `R$ ${value.toFixed(2)}`;
        }
        // Formatar datas
        if (value && header.includes('data')) {
          return new Date(value).toLocaleDateString();
        }
        return value;
      })
    );

    // Criar conteúdo CSV
    const csvContent = [
      headers.join(';'),
      ...csvData.map(row => row.join(';'))
    ].join('\\n');

    // Criar blob e link para download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success("Relatório exportado com sucesso!");
  };

  // Função para exportar para PDF
  const exportToPDF = async (data: any[], reportConfig: ReportConfig) => {
    setIsLoading(true);
    try {
      const doc = new jsPDF();
      
      // Adiciona título do relatório
      const title = getReportTitle(reportType);
      doc.setFontSize(16);
      doc.text(title, 14, 15);
      
      // Adiciona período se aplicável
      if (reportType === "vendas-periodo" || reportType === "recebimentos-periodo" || reportType === "vendas-cliente") {
        const periodText = `Período: ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}`;
        doc.setFontSize(10);
        doc.text(periodText, 14, 25);
      }

      // Prepara os dados para a tabela
      const tableData = data.map(row => {
        return reportConfig.headers.map(header => {
          const value = row[getObjectKey(header)];
          if (value instanceof Date) {
            return format(value, 'dd/MM/yyyy', { locale: ptBR });
          }
          if (typeof value === 'number') {
            if (value > 100 || value < -100) {
              return new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL'
              }).format(value);
            }
            return value.toFixed(2);
          }
          return value?.toString() || '';
        });
      });

      // Configuração da tabela
      autoTable(doc, {
        head: [reportConfig.headers],
        body: tableData,
        startY: reportType.includes("periodo") ? 30 : 25,
        headStyles: {
          fillColor: [66, 66, 66],
          textColor: [255, 255, 255],
          fontSize: 10
        },
        bodyStyles: {
          fontSize: 9
        },
        theme: 'grid',
        styles: {
          font: 'helvetica',
          cellPadding: 2,
        },
      });

      // Adiciona rodapé com data de geração
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        const footerText = `Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`;
        doc.text(footerText, 14, doc.internal.pageSize.height - 10);
        doc.text(`Página ${i} de ${pageCount}`, doc.internal.pageSize.width - 25, doc.internal.pageSize.height - 10);
      }

      // Salva o PDF
      doc.save(`${reportConfig.filename}_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Função auxiliar para obter o título do relatório
  const getReportTitle = (type: ReportType): string => {
    const titles: Record<ReportType, string> = {
      "produtos-lucro": "Relatório de Produtos e Lucratividade",
      "vendas-periodo": "Relatório de Vendas por Período",
      "recebimentos-periodo": "Relatório de Recebimentos por Período",
      "estoque-baixo": "Relatório de Produtos com Estoque Baixo",
      "vendas-cliente": "Relatório de Vendas por Cliente"
    };
    return titles[type];
  };

  // Função auxiliar para converter header em key do objeto
  const getObjectKey = (header: string): string => {
    const headerMap: Record<string, string> = {
      "Cliente": "cliente",
      "Email": "email",
      "Telefone": "telefone",
      "Qtd. Vendas": "quantidadeVendas",
      "Qtd. Itens": "quantidadeItens",
      "Valor Total": "valorTotal",
      "Média/Venda": "mediaVenda",
      "Última Compra": "ultimaCompra",
      // Adicione mais mapeamentos conforme necessário
    };
    return headerMap[header] || header.toLowerCase();
  };

  // Função para gerar dados do gráfico de receita por cliente (top 5)
  const generateCustomerRevenueData = () => {
    const customerRevenue = customers.map(customer => {
      const customerSales = sales
        .filter(sale => sale.customerId === customer.id)
        .filter(sale => {
          const saleDate = new Date(sale.date);
          return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
        });
      
      const totalRevenue = customerSales.reduce((sum, sale) => sum + sale.total, 0);
      
      return {
        name: customer.name,
        revenue: totalRevenue
      };
    });

    return customerRevenue
      .filter(c => c.revenue > 0)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  // Função para calcular estatísticas gerais
  const calculateStats = () => {
    const filteredSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return saleDate >= new Date(startDate) && saleDate <= new Date(endDate);
    });

    const activeCustomers = new Set(filteredSales.map(sale => sale.customerId)).size;
    const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
    const averageTicket = filteredSales.length > 0 ? totalRevenue / filteredSales.length : 0;

    // Simulando dados de satisfação (você pode adaptar isso para seus dados reais)
    const satisfaction = {
      satisfied: 65,
      neutral: 20,
      unsatisfied: 15
    };

    return {
      activeCustomers,
      totalRevenue,
      averageTicket,
      satisfaction
    };
  };

  // Função para exportar PDF com o novo template visual
  const exportVisualPDF = async () => {
    setIsLoading(true);
    try {
      const doc = new jsPDF();
      const stats = calculateStats();
      const revenueData = generateCustomerRevenueData();

      // Título e cabeçalho
      doc.setFontSize(24);
      doc.setTextColor(20, 30, 50);
      doc.text("RELATÓRIO DE VENDAS POR CLIENTE", 20, 30);

      // Subtítulo
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text("Abaixo, você encontrará um resumo das vendas por cliente.", 20, 45);
      doc.text("Se precisar de mais alguma coisa, estamos à disposição!", 20, 52);

      // Período
      doc.setFontSize(10);
      doc.text(`Período: ${format(new Date(startDate), 'dd/MM/yyyy')} a ${format(new Date(endDate), 'dd/MM/yyyy')}`, 20, 65);

      // Estatísticas principais
      doc.setFontSize(16);
      doc.setTextColor(20, 30, 50);
      doc.text("Clientes Ativos", 20, 85);
      doc.setFontSize(32);
      doc.text(stats.activeCustomers.toString(), 20, 100);

      // Gráfico de barras simplificado (receita por cliente)
      doc.setFontSize(16);
      doc.text("Receita por Cliente", 20, 130);
      
      const maxRevenue = Math.max(...revenueData.map(d => d.revenue));
      revenueData.forEach((data, index) => {
        const y = 145 + (index * 12);
        const barWidth = (data.revenue / maxRevenue) * 100;
        
        // Nome do cliente
        doc.setFontSize(10);
        doc.text(data.name.substring(0, 15), 20, y);
        
        // Barra
        doc.setFillColor(70, 130, 180);
        doc.rect(70, y - 4, barWidth, 5, 'F');
        
        // Valor
        doc.text(`R$ ${data.revenue.toLocaleString('pt-BR')}`, 175, y);
      });

      // Gráfico de pizza simplificado (satisfação)
      doc.setFontSize(16);
      doc.text("Satisfação do Cliente", 20, 220);
      
      // Legendas do gráfico de pizza
      doc.setFontSize(10);
      doc.setFillColor(20, 30, 50);
      doc.circle(30, 235, 3, 'F');
      doc.text("Satisfeito (65%)", 40, 237);
      
      doc.setFillColor(70, 130, 180);
      doc.circle(30, 245, 3, 'F');
      doc.text("Neutro (20%)", 40, 247);
      
      doc.setFillColor(150, 150, 150);
      doc.circle(30, 255, 3, 'F');
      doc.text("Insatisfeito (15%)", 40, 257);

      // Rodapé
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, 20, 280);

      // Salva o PDF
      doc.save(`relatorio_vendas_cliente_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`);
      toast.success("Relatório PDF exportado com sucesso!");
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error("Erro ao gerar o PDF. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  // Função para calcular estatísticas do cliente específico
  const calculateClientStats = (clientId: string) => {
    const clientSales = sales.filter(sale => {
      const saleDate = new Date(sale.date);
      return sale.customerId === clientId &&
             saleDate >= new Date(startDate) &&
             saleDate <= new Date(endDate);
    });

    // Busca os recebimentos do cliente no período
    const clientReceivables = receivables.filter(receivable => 
      receivable.customerId === clientId
    );

    // Calcula o total de compras
    const totalPurchases = clientSales.reduce((sum, sale) => sum + sale.total, 0);

    // Calcula o total pago baseado nos recebimentos
    const totalPaid = clientReceivables.reduce((sum, receivable) => {
      // Se está pago, soma o valor total
      if (receivable.status === 'paid') {
        return sum + receivable.originalAmount;
      }
      // Se está parcialmente pago, soma o valor já pago
      return sum + (receivable.totalPaid || 0);
    }, 0);

    // O total pendente é a diferença entre compras e pagamentos
    const totalPending = Math.max(0, totalPurchases - totalPaid);

    const purchaseHistory = clientSales.map(sale => {
      // Encontra o recebível correspondente à venda
      const relatedReceivable = clientReceivables.find(r => 
        r.originalAmount === sale.total || 
        (r.saleId && r.saleId === sale.id)
      );

      // Define o status baseado no recebível
      let status = sale.paymentStatus;
      if (relatedReceivable) {
        status = relatedReceivable.status;
        // Se o valor recebido é igual ao valor total, considera como pago
        if (relatedReceivable.totalPaid === relatedReceivable.originalAmount) {
          status = 'paid';
        }
      }

      // Calcula o valor pendente do título
      const paidAmount = relatedReceivable?.totalPaid || 0;
      const pendingAmount = sale.total - paidAmount;

      return {
        date: new Date(sale.date),
        total: sale.total,
        items: sale.items.length,
        status,
        method: sale.paymentMethod,
        paidAmount,
        pendingAmount,
        receivableStatus: relatedReceivable?.status
      };
    }).sort((a, b) => b.date.getTime() - a.date.getTime());

    return {
      totalPurchases,
      totalPaid,
      totalPending,
      purchaseHistory
    };
  };

  // Função para formatar método de pagamento
  const formatPaymentMethod = (method: string): string => {
    const methodMap: Record<string, string> = {
      'credit_card': 'Cartão de Crédito',
      'debit_card': 'Cartão de Débito',
      'cash': 'Dinheiro',
      'bank_transfer': 'Transferência',
      'bank_slip': 'Boleto',
      'installments': 'Parcelado'
    };
    return methodMap[method] || method;
  };

  // Função para formatar status
  const formatStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'paid': 'PAGO',
      'pending': 'PENDENTE',
      'overdue': 'ATRASADO'
    };
    return statusMap[status] || status;
  };

  // Função para exportar PDF personalizado do cliente
  const exportClientDetailsPDF = async () => {
    if (selectedCustomerId === "all") {
      toast.error("Selecione um cliente específico para gerar este relatório.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const doc = new jsPDF();
      const client = customers.find(c => c.id === selectedCustomerId);
      if (!client) throw new Error("Cliente não encontrado");

      const stats = calculateClientStats(selectedCustomerId);

      // Configurações de estilo modernas
      const primaryColor = [52, 152, 219] as const;
      const secondaryColor = [41, 128, 185] as const;
      const textColor = [44, 62, 80] as const;
      const lightGray = [236, 240, 241] as const;

      // Cabeçalho com gradiente
      const gradient = doc.setFillColor(...primaryColor);
      doc.roundedRect(0, 0, doc.internal.pageSize.width, 50, 0, 0, 'F');
      
      // Título do relatório com estilo moderno
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.text("Extrato do Cliente", 20, 35);

      // Informações do cliente com layout moderno
      doc.setFontSize(14);
      doc.setTextColor(...textColor);
      doc.setFont("helvetica", "bold");
      doc.text(client.name, 20, 70);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text(client.email, 20, 80);
      doc.text(client.phone, 20, 87);
      
      // Período com estilo minimalista
      doc.setFontSize(9);
      doc.text(`Período: ${format(new Date(startDate), "d 'de' MMMM", { locale: ptBR })} a ${format(new Date(endDate), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}`, 20, 98);

      // Resumo financeiro com cards modernos
      const formatCurrency = (value: number) => 
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

      // Card de Total em Compras
      doc.setFillColor(...lightGray);
      doc.roundedRect(20, 110, 170, 40, 3, 3, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.text("Total em Compras", 30, 125);
      doc.setFontSize(16);
      doc.setTextColor(...primaryColor);
      doc.text(formatCurrency(stats.totalPurchases), 30, 140);

      // Cards lado a lado para Pago e Pendente
      const cardWidth = 82;
      
      // Card Total Pago
      doc.setFillColor(...lightGray);
      doc.roundedRect(20, 155, cardWidth, 40, 3, 3, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.text("Total Pago", 30, 170);
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text(formatCurrency(stats.totalPaid), 30, 185);

      // Card Total Pendente
      doc.setFillColor(...lightGray);
      doc.roundedRect(108, 155, cardWidth, 40, 3, 3, 'F');
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(...textColor);
      doc.text("Total Pendente", 118, 170);
      doc.setFontSize(14);
      doc.setTextColor(...primaryColor);
      doc.text(formatCurrency(stats.totalPending), 118, 185);

      let currentY = 210;

      // Histórico de Compras com layout moderno
      if (stats.purchaseHistory.length > 0) {
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }

        // Título da seção com linha decorativa
        doc.setFillColor(52, 152, 219);
        doc.rect(20, currentY, 170, 1, 'F');
        currentY += 10;

        doc.setFont("helvetica", "bold");
        doc.setFontSize(16);
        doc.setTextColor(52, 73, 94);
        doc.text("Histórico de Compras", 20, currentY);
        currentY += 20;

        // Iterar sobre cada compra e criar cards individuais
        stats.purchaseHistory.forEach((purchase, index) => {
          const cardHeight = 70;
          const marginBottom = 10;

          // Verifica se precisa de nova página
          if (currentY + cardHeight > doc.internal.pageSize.height - 20) {
            doc.addPage();
            currentY = 20;
          }

          // Card de fundo com sombra
          doc.setFillColor(248, 249, 250);
          doc.roundedRect(20, currentY, 170, cardHeight, 3, 3, 'F');

          // Barra de status colorida
          const statusColors = {
            'paid': [46, 204, 113] as const, // Verde
            'pending': [243, 156, 18] as const, // Amarelo
            'overdue': [231, 76, 60] as const // Vermelho
          } as const;
          const color = statusColors[purchase.status] || [149, 165, 166];
          
          // Círculo indicador de status
          doc.setFillColor(color[0], color[1], color[2]);
          doc.circle(30, currentY + 15, 3, 'F');

          // Data e Status
          doc.setFont("helvetica", "bold");
          doc.setFontSize(12);
          doc.setTextColor(52, 73, 94);
          doc.text(format(purchase.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR }), 40, currentY + 18);
          
          // Status com fundo colorido
          const status = formatStatus(purchase.status);
          doc.setFillColor(color[0], color[1], color[2], 0.1);
          const statusWidth = doc.getStringUnitWidth(status) * 7;
          doc.roundedRect(140, currentY + 8, statusWidth, 12, 2, 2, 'F');
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(color[0], color[1], color[2]);
          doc.text(status, 142, currentY + 16);

          // Linha separadora sutil
          doc.setDrawColor(230, 230, 230);
          doc.line(40, currentY + 25, 180, currentY + 25);

          // Valor em destaque
          doc.setFont("helvetica", "bold");
          doc.setFontSize(14);
          doc.setTextColor(52, 152, 219);
          doc.text(formatCurrency(purchase.total), 40, currentY + 42);

          // Informações adicionais
          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          
          // Se houver valor pendente e o status não for 'paid', mostra o valor pendente
          if (purchase.pendingAmount > 0 && purchase.status !== 'paid') {
            doc.text(`Valor Pendente: ${formatCurrency(purchase.pendingAmount)}`, 40, currentY + 50);
          }

          // Método de pagamento (movido para baixo para acomodar o valor pendente)
          const paymentMethod = formatPaymentMethod(purchase.method);
          doc.text(paymentMethod, 40, currentY + 58);
          
          // Quantidade de itens
          const itemsText = `${purchase.items} ${purchase.items === 1 ? 'item' : 'itens'}`;
          doc.text(itemsText, 140, currentY + 58);

          currentY += cardHeight + marginBottom;
        });
      }

      // Rodapé moderno
      const pageCount = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.setFont("helvetica", "normal");
        
        // Data de geração
        const footerText = `Gerado em ${format(new Date(), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}`;
        doc.text(footerText, 20, doc.internal.pageSize.height - 10);
        
        // Numeração de página com estilo minimalista
        const pageInfo = `${i}/${pageCount}`;
        doc.text(pageInfo, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
      }

      // Salva o PDF com nome amigável
      const fileName = `extrato_${client.name.toLowerCase().replace(/\s+/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}`;
      doc.save(`${fileName}.pdf`);
      toast.success("Extrato do cliente exportado com sucesso!");
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      toast.error("Erro ao gerar o extrato. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    if (!isDateRangeValid()) {
      setError('Período inválido');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await exportToCSV(reportData, REPORT_CONFIGS[reportType].filename);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao exportar relatório');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Relatórios</h1>
        <p className="page-subtitle">Gere relatórios e análises do seu negócio</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configurações do Relatório</CardTitle>
          <CardDescription>
            Selecione o tipo de relatório e o período desejado
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium">Tipo de Relatório</label>
              <Select
                value={reportType}
                onValueChange={(value) => {
                  setReportType(value as ReportType);
                  setSelectedCustomerId("all");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="produtos-lucro">Produtos e Lucratividade</SelectItem>
                  <SelectItem value="vendas-periodo">Vendas por Período</SelectItem>
                  <SelectItem value="recebimentos-periodo">Recebimentos por Período</SelectItem>
                  <SelectItem value="estoque-baixo">Produtos com Estoque Baixo</SelectItem>
                  <SelectItem value="vendas-cliente">Vendas por Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === "vendas-cliente" && (
              <>
                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Modelo de Relatório</label>
                  <Select
                    value={reportTemplate}
                    onValueChange={(value) => setReportTemplate(value as ReportTemplate)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o modelo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="modelo1">Modelo I - Tabela Detalhada</SelectItem>
                      <SelectItem value="modelo2">Modelo II - Visual Dashboard</SelectItem>
                      <SelectItem value="modelo3">Modelo III - Extrato do Cliente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-sm font-medium">Cliente</label>
                  <Select
                    value={selectedCustomerId}
                    onValueChange={(value) => setSelectedCustomerId(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os clientes</SelectItem>
                      {customers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {(reportType === "vendas-periodo" || 
              reportType === "recebimentos-periodo" || 
              reportType === "vendas-cliente") && (
              <>
                <div>
                  <label className="text-sm font-medium">Data Inicial</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setError(null);
                    }}
                    max={endDate}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data Final</label>
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setError(null);
                    }}
                    min={startDate}
                  />
                </div>
              </>
            )}
          </div>

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mt-4">
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={isLoading || !isDateRangeValid()}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileSpreadsheet className="h-4 w-4" />
              )}
              {isLoading ? 'Exportando...' : 'Exportar CSV'}
            </Button>

            <Button
              onClick={() => {
                if (reportTemplate === "modelo1") {
                  exportToPDF(reportData, REPORT_CONFIGS[reportType]);
                } else if (reportTemplate === "modelo2") {
                  exportVisualPDF();
                } else {
                  exportClientDetailsPDF();
                }
              }}
              variant="outline"
              disabled={isLoading || !isDateRangeValid() || (reportTemplate === "modelo3" && selectedCustomerId === "all")}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : reportTemplate === "modelo1" ? (
                <FileText className="h-4 w-4" />
              ) : reportTemplate === "modelo2" ? (
                <BarChart3 className="h-4 w-4" />
              ) : (
                <FileText className="h-4 w-4" />
              )}
              {isLoading ? 'Exportando...' : 'Exportar PDF'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {reportData.length > 0 ? (
        <div className="rounded-md border mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                {REPORT_CONFIGS[reportType].headers.map((header, index) => (
                  <TableHead key={index}>{header}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((row, index) => (
                <TableRow key={index}>
                  {Object.values(row).map((value, cellIndex) => (
                    <TableCell key={cellIndex}>
                      {typeof value === 'number' && (value > 100 || value < -100)
                        ? <FormatCurrency value={value} />
                        : value instanceof Date
                        ? format(value, 'dd/MM/yyyy')
                        : value}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center py-6">
            <p className="text-gray-500">
              {error ? 'Nenhum dado disponível devido a um erro' : 'Nenhum dado disponível para o período selecionado'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Reports; 