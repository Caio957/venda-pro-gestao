
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Calendar, Receipt, Book, User, ChartBar } from "lucide-react";

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
          
          <NavItem
            to="/"
            icon={<ChartBar size={18} />}
            currentPath={location.pathname}
          >
            Dashboard
          </NavItem>
          <NavItem
            to="/products"
            icon={<Book size={18} />}
            currentPath={location.pathname}
          >
            Produtos
          </NavItem>
          <NavItem
            to="/customers"
            icon={<User size={18} />}
            currentPath={location.pathname}
          >
            Clientes
          </NavItem>
          <NavItem
            to="/sales"
            icon={<Receipt size={18} />}
            currentPath={location.pathname}
          >
            Vendas
          </NavItem>
          <NavItem
            to="/receivables"
            icon={<Calendar size={18} />}
            currentPath={location.pathname}
          >
            Contas a Receber
          </NavItem>
        </div>
      </aside>
      
      {/* Mobile Navigation */}
      <div className="fixed bottom-0 left-0 z-50 w-full border-t bg-white md:hidden">
        <div className="grid h-14 grid-cols-5">
          <Link
            to="/"
            className={cn(
              "flex flex-col items-center justify-center",
              location.pathname === "/" ? "text-primary-500" : "text-gray-500"
            )}
          >
            <ChartBar size={20} />
            <span className="text-xs">Início</span>
          </Link>
          <Link
            to="/products"
            className={cn(
              "flex flex-col items-center justify-center",
              location.pathname === "/products" ? "text-primary-500" : "text-gray-500"
            )}
          >
            <Book size={20} />
            <span className="text-xs">Produtos</span>
          </Link>
          <Link
            to="/customers"
            className={cn(
              "flex flex-col items-center justify-center",
              location.pathname === "/customers" ? "text-primary-500" : "text-gray-500"
            )}
          >
            <User size={20} />
            <span className="text-xs">Clientes</span>
          </Link>
          <Link
            to="/sales"
            className={cn(
              "flex flex-col items-center justify-center",
              location.pathname === "/sales" ? "text-primary-500" : "text-gray-500"
            )}
          >
            <Receipt size={20} />
            <span className="text-xs">Vendas</span>
          </Link>
          <Link
            to="/receivables"
            className={cn(
              "flex flex-col items-center justify-center",
              location.pathname === "/receivables" ? "text-primary-500" : "text-gray-500"
            )}
          >
            <Calendar size={20} />
            <span className="text-xs">A Receber</span>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto pb-16 md:pb-0">
        <div className="container mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
};
