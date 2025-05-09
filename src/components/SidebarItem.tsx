
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
}

const SidebarItem = ({ href, icon, label }: SidebarItemProps) => {
  const location = useLocation();
  const isActive = location.pathname === href;
  const [mounted, setMounted] = useState(false);

  // Ensure component is mounted before applying styles 
  // to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link
      to={href}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all mb-1",
        isActive 
          ? "bg-primary text-primary-foreground font-semibold border border-primary/50 shadow-sm" 
          : mounted 
            ? "text-foreground hover:bg-primary/10 hover:text-primary hover:border-primary/30 border border-transparent" 
            : "text-foreground border border-transparent"
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
