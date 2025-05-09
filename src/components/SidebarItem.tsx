
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
        "sidebar-item flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        isActive 
          ? "active bg-primary text-primary-foreground" 
          : "hover:bg-primary/10 hover:text-primary border border-transparent"
      )}
    >
      <span className={cn("shrink-0", isActive ? "text-primary-foreground" : "")}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default SidebarItem;
