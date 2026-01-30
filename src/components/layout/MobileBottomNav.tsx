import { Home, Users, Calendar, Settings } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";

const navItems = [
  { title: "Home", url: "/", icon: Home },
  { title: "Clients", url: "/clients", icon: Users },
  { title: "Calendar", url: "/calendar", icon: Calendar },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border md:hidden">
      <div className="flex items-center justify-around h-16 px-2 safe-area-inset-bottom">
        {navItems.map((item) => (
          <NavLink
            key={item.url}
            to={item.url}
            end={item.url === "/"}
            className={cn(
              "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg text-muted-foreground transition-colors min-w-[60px]"
            )}
            activeClassName="text-primary"
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                <span className={cn("text-xs font-medium", isActive && "text-primary")}>
                  {item.title}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
