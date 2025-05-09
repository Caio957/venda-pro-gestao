
import { LayoutGrid, Package, Users, ShoppingCart, FileText, Settings, Receipt } from "lucide-react";
import SidebarItem from "../SidebarItem";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-60 border-r bg-background dark:bg-sidebar">
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="border-b px-6 py-4">
          <h1 className="text-xl font-bold">VendaPro</h1>
          <p className="text-sm text-muted-foreground">Sistema de Gestão de Vendas</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          <p className="mb-2 px-3 text-xs font-semibold text-muted-foreground">Menu</p>
          <div className="space-y-1">
            <SidebarItem
              href="/dashboard"
              icon={<LayoutGrid className="h-4 w-4" />}
              label="Dashboard"
            />
            <SidebarItem
              href="/products"
              icon={<Package className="h-4 w-4" />}
              label="Produtos"
            />
            <SidebarItem
              href="/customers"
              icon={<Users className="h-4 w-4" />}
              label="Clientes"
            />
            <SidebarItem
              href="/sales"
              icon={<ShoppingCart className="h-4 w-4" />}
              label="Vendas"
            />
            <SidebarItem
              href="/receivables"
              icon={<Receipt className="h-4 w-4" />}
              label="Contas a Receber"
            />
            <SidebarItem
              href="/reports"
              icon={<FileText className="h-4 w-4" />}
              label="Relatórios"
            />
            <SidebarItem
              href="/settings"
              icon={<Settings className="h-4 w-4" />}
              label="Configurações"
            />
          </div>
        </nav>
      </div>
    </aside>
  );
}
