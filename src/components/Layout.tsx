import React, { useEffect, useCallback } from "react";
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
  Menu,
  Settings,
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
  { name: "Configurações", href: "/settings", icon: Settings },
];

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Handle escape key to close mobile menu
  const handleEscapeKey = useCallback((event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setMobileMenuOpen(false);
    }
  }, []);

  // Handle click outside to close mobile menu
  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.closest('[data-mobile-menu]') === null && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  }, [mobileMenuOpen]);

  // Add event listeners
  useEffect(() => {
    document.addEventListener('keydown', handleEscapeKey);
    document.addEventListener('click', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [handleEscapeKey, handleClickOutside]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);
  
  const toggleMobileMenu = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    setMobileMenuOpen(prev => !prev);
  }, []);

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
      
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white border-b md:hidden">
        <div className="flex items-center justify-between px-4 py-2">
          <div>
            <h2 className="text-lg font-semibold text-primary-800">VendaPro</h2>
            <p className="text-xs text-gray-500">Sistema de Gestão de Vendas</p>
          </div>
          <button
            onClick={toggleMobileMenu}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-md"
            aria-label="Toggle menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        data-mobile-menu
        className={cn(
          "fixed inset-0 z-40 transform transition-transform duration-300 ease-in-out md:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-hidden={!mobileMenuOpen}
      >
        <div className="relative h-full w-64 bg-white shadow-xl pt-16">
          <nav className="flex flex-col gap-1 p-2">
            {navigation.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                  location.pathname === item.href 
                    ? "bg-primary-200 text-primary-800 font-medium" 
                    : "text-gray-600 hover:bg-primary-200 hover:text-primary-800"
                )}
              >
                <item.icon size={20} />
                <span>{item.name === "Dashboard" ? "Início" : item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto md:pb-0 pt-16 md:pt-0">
        <div className="container mx-auto p-2 sm:p-4 md:p-6 max-w-full">
          {children}
        </div>
      </main>
    </div>
  );
};
