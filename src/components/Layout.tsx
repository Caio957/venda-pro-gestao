import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Receipt,
  Book,
  User,
  ChartBar,
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  FileText,
} from "lucide-react";

type NavItemProps = {
  to: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  currentPath: string;
};

const NavItem: React.FC<NavItemProps> = ({ to, icon, children, currentPath }) => {
  const isActive = currentPath === to;
  
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all hover:bg-primary-200 hover:text-primary-800",
        isActive ? "bg-primary-200 text-primary-800 font-medium" : "text-gray-600"
      )}
    >
      <div className="text-lg">{icon}</div>
      <span>{children}</span>
    </Link>
  );
};

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Produtos", href: "/products", icon: Package },
  { name: "Clientes", href: "/customers", icon: Users },
  { name: "Vendas", href: "/sales", icon: ShoppingCart },
  { name: "Contas a Receber", href: "/receivables", icon: Receipt },
  { name: "Relatórios", href: "/reports", icon: FileText },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-white px-2 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 text-lg font-semibold tracking-tight text-primary-800">
            VendaPro
          </h2>
          <p className="text-xs text-gray-500">Sistema de Gestão de Vendas</p>
        </div>
        
        <div className="mt-8 flex flex-col gap-1">
          <div className="px-3 py-1">
            <h3 className="text-xs font-medium text-gray-500">Menu</h3>
          </div>
          
          {navigation.map((item) => (
            <NavItem
              key={item.href}
              to={item.href}
              icon={<item.icon size={18} />}
              currentPath={location.pathname}
            >
              {item.name}
            </NavItem>
          ))}
        </div>
      </aside>
      
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-white md:hidden">
        <div className="grid h-14 grid-cols-6">
          {navigation.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center",
                location.pathname === item.href ? "text-primary-500" : "text-gray-500"
              )}
            >
              <item.icon size={20} />
              <span className="text-xs">{item.name === "Dashboard" ? "Início" : item.name}</span>
            </Link>
          ))}
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
};
