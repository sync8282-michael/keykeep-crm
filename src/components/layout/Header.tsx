import { Link, useLocation } from "react-router-dom";
import { Home, Calendar, Search, Bell, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import shieldLogo from "@/assets/shield-logo.svg";
import nameLogo from "@/assets/name-logo.svg";

const navItems = [
  { path: "/", label: "Home", icon: Home },
  { path: "/calendar", label: "Calendar", icon: Calendar },
  { path: "/search", label: "Search", icon: Search },
  { path: "/notifications", label: "Notifications", icon: Bell },
];

export function Header() {
  const location = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img src={shieldLogo} alt="KeyKeep Shield" className="h-10 w-auto" />
            <img src={nameLogo} alt="KeyKeep" className="h-6 w-auto" />
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/settings"
              className="ml-2 p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
            >
              <Settings className="w-5 h-5" />
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
