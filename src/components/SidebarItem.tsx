
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
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all mb-1",
        isActive 
          ? "bg-primary text-primary-foreground font-semibold border border-primary/50 shadow-sm" 
          : "text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-transparent"
      )}
    >
      <span className="text-inherit shrink-0">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

export default SidebarItem;
