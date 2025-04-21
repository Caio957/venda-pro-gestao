
import React from "react";
import { useAppContext } from "@/contexts/AppContext";
import { FormatCurrency } from "@/components/FormatCurrency";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

const Dashboard = () => {
  const { products, sales, receivables, customers, calculateProfit } = useAppContext();
  
  const totalProducts = products.length;
  const totalCustomers = customers.length;
  const totalSales = sales.length;
  
  const totalRevenue = sales.reduce((total, sale) => total + sale.total, 0);
  const totalProfit = calculateProfit();
  const totalReceivables = receivables.filter(r => r.status === "pending").reduce((total, r) => total + r.amount, 0);
  
  // Last 7 sales
  const recentSales = [...sales]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 7);

  // Sales by month data for chart
  const currentYear = new Date().getFullYear();
  const monthlySales = Array(12).fill(0);
  
  sales.forEach(sale => {
    const saleDate = new Date(sale.date);
    if (saleDate.getFullYear() === currentYear) {
      monthlySales[saleDate.getMonth()] += sale.total;
    }
  });
  
  const monthlyData = monthlySales.map((value, index) => ({
    month: new Date(currentYear, index).toLocaleString('pt-BR', { month: 'short' }),
    vendas: value,
  }));
  
  // Top selling products for pie chart
  const productSales: Record<string, { count: number; name: string }> = {};
  
  sales.forEach(sale => {
    sale.items.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        if (!productSales[product.id]) {
          productSales[product.id] = { count: 0, name: product.name };
        }
        productSales[product.id].count += item.quantity;
      }
    });
  });
  
  const topProducts = Object.entries(productSales)
    .map(([id, { count, name }]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
  
  const COLORS = ['#9b87f5', '#7E69AB', '#6E59A5', '#5a4a89', '#3f3361'];
  
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Visão geral do seu negócio</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Faturamento Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FormatCurrency value={totalRevenue} className="text-2xl font-bold" />
              <div className="rounded-full bg-green-100 p-1 text-green-600">
                <ArrowUpRight size={16} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Lucro Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FormatCurrency value={totalProfit} className="text-2xl font-bold" />
              <div className="rounded-full bg-green-100 p-1 text-green-600">
                <ArrowUpRight size={16} />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">A Receber</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <FormatCurrency value={totalReceivables} className="text-2xl font-bold" />
              {totalReceivables > 0 ? (
                <div className="rounded-full bg-orange-100 p-1 text-orange-600">
                  <ArrowDownRight size={16} />
                </div>
              ) : (
                <div className="rounded-full bg-green-100 p-1 text-green-600">
                  <ArrowUpRight size={16} />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <p className="text-2xl font-bold">{totalSales}</p>
              <div className="rounded-full bg-primary-100 p-1 text-primary-600">
                <span className="text-xs font-medium">+{totalProducts} produtos</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Vendas Mensais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`R$ ${Number(value).toFixed(2)}`, "Vendas"]}
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                  <Bar dataKey="vendas" fill="#9b87f5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Produtos Mais Vendidos</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <div className="h-60 w-full">
              {topProducts.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={topProducts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {topProducts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} unidades`, "Vendidos"]} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-gray-500">
                  Nenhum produto vendido ainda
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Vendas Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="pb-2 text-left font-medium">Cliente</th>
                  <th className="pb-2 text-left font-medium">Data</th>
                  <th className="pb-2 text-right font-medium">Valor</th>
                  <th className="pb-2 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length > 0 ? (
                  recentSales.map((sale) => {
                    const customer = customers.find((c) => c.id === sale.customerId);
                    return (
                      <tr key={sale.id} className="border-b">
                        <td className="py-3">{customer?.name || "Cliente não encontrado"}</td>
                        <td className="py-3">{new Date(sale.date).toLocaleDateString("pt-BR")}</td>
                        <td className="py-3 text-right">
                          <FormatCurrency value={sale.total} />
                        </td>
                        <td className="py-3 text-right">
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                              sale.paymentStatus === "paid"
                                ? "bg-green-100 text-green-800"
                                : sale.paymentStatus === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {sale.paymentStatus === "paid"
                              ? "Pago"
                              : sale.paymentStatus === "pending"
                              ? "Pendente"
                              : "Atrasado"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-500">
                      Nenhuma venda registrada ainda
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
