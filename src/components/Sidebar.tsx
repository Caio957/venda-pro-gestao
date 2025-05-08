
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
        "sidebar-item flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-all duration-200 border",
        isActive 
          ? "active border-primary/30 bg-primary-light" 
          : "border-transparent hover:border-primary/20"
      )}
    >
      <span className="shrink-0 text-primary">{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

export default SidebarItem;
