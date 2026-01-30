import { Link, useLocation } from "react-router-dom";
import { Home, Users, Calendar, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import shieldLogo from "@/assets/shield-logo.svg";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/clients", label: "Clients", icon: Users },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/notifications", label: "Alerts", icon: Bell },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function TabletHeader() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src={shieldLogo} alt="KeyKeep" className="h-8 w-8" />
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => {
            const isActive = 
              item.path === "/" 
                ? location.pathname === "/" 
                : location.pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
