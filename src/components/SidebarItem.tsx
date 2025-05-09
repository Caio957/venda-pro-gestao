
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
          ? "sidebar-item-active" 
          : "sidebar-item-inactive"
      )}
    >
      <span className="shrink-0 text-inherit">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
};

export default SidebarItem;
