import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  variant?: "default" | "primary" | "success" | "warning";
  description?: string;
}

export function StatsCard({ title, value, icon: Icon, variant = "default", description }: StatsCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className={cn(
            "text-2xl sm:text-3xl font-bold mt-1",
            variant === "primary" && "text-primary",
            variant === "success" && "text-success",
            variant === "warning" && "text-warning",
            variant === "default" && "text-foreground"
          )}>
            {value}
          </p>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 truncate">{description}</p>
          )}
        </div>
        <div className={cn(
          "w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          variant === "primary" && "bg-primary/10 text-primary",
          variant === "success" && "bg-success/10 text-success",
          variant === "warning" && "bg-warning/10 text-warning",
          variant === "default" && "bg-muted text-muted-foreground"
        )}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>
      </div>
    </div>
  );
}
