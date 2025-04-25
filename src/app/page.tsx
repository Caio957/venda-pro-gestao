import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/pages/Dashboard";
import Products from "@/pages/Products";
import Customers from "@/pages/Customers";
import Sales from "@/pages/Sales";
import Reports from "@/pages/Reports";
import Receivables from "@/pages/Receivables";
import Settings from "@/pages/Settings";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Receipt,
  Settings as SettingsIcon,
} from "lucide-react";

export default function Home() {
  return (
    <Tabs defaultValue="dashboard" className="w-full">
      <TabsList className="w-full justify-start overflow-x-auto">
        <TabsTrigger value="dashboard" className="gap-2">
          <LayoutDashboard size={16} />
          <span>Dashboard</span>
        </TabsTrigger>
        <TabsTrigger value="products" className="gap-2">
          <Package size={16} />
          <span>Produtos</span>
        </TabsTrigger>
        <TabsTrigger value="customers" className="gap-2">
          <Users size={16} />
          <span>Clientes</span>
        </TabsTrigger>
        <TabsTrigger value="sales" className="gap-2">
          <ShoppingCart size={16} />
          <span>Vendas</span>
        </TabsTrigger>
        <TabsTrigger value="receivables" className="gap-2">
          <Receipt size={16} />
          <span>Recebimentos</span>
        </TabsTrigger>
        <TabsTrigger value="reports" className="gap-2">
          <FileText size={16} />
          <span>Relatórios</span>
        </TabsTrigger>
        <TabsTrigger value="settings" className="gap-2">
          <SettingsIcon size={16} />
          <span>Configurações</span>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="dashboard" className="p-4">
        <Dashboard />
      </TabsContent>
      <TabsContent value="products" className="p-4">
        <Products />
      </TabsContent>
      <TabsContent value="customers" className="p-4">
        <Customers />
      </TabsContent>
      <TabsContent value="sales" className="p-4">
        <Sales />
      </TabsContent>
      <TabsContent value="receivables" className="p-4">
        <Receivables />
      </TabsContent>
      <TabsContent value="reports" className="p-4">
        <Reports />
      </TabsContent>
      <TabsContent value="settings" className="p-4">
        <Settings />
      </TabsContent>
    </Tabs>
  );
} 