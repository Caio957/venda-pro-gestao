
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarItem = ({ href, icon, label }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;

  return (
    <Link
      to={href}
      className={cn(
        "sidebar-item flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all mb-1",
        isActive 
          ? "bg-primary text-primary-foreground border border-primary/50" 
          : "hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-transparent"
      )}
      style={{
        ...(isActive ? {
          backgroundColor: `hsl(var(--primary))`,
          color: `hsl(var(--primary-foreground))`,
          border: `1px solid hsla(var(--primary), 0.5)`,
          fontWeight: 600,
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        } : {
          border: '1px solid transparent'
        })
      }}
    >
      <span 
        className="shrink-0"
        style={isActive ? { color: `hsl(var(--primary-foreground))` } : {}}
      >
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

export default SidebarItem;
