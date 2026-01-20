import { format, differenceInDays, parseISO, isToday } from "date-fns";
import { Calendar, Home, Cake, Clock, CheckCircle } from "lucide-react";
import { Reminder, Client, Property } from "@/types";
import { cn } from "@/lib/utils";

interface ReminderCardProps {
  reminder: Reminder;
  client?: Client;
  property?: Property;
  onComplete?: (id: string) => void;
}

export function ReminderCard({ reminder, client, property, onComplete }: ReminderCardProps) {
  const reminderDate = parseISO(reminder.reminderDate);
  const daysUntil = differenceInDays(reminderDate, new Date());
  const isOverdue = daysUntil < 0;
  const isTodayReminder = isToday(reminderDate);

  const getStatusClass = () => {
    if (reminder.isCompleted) return "";
    if (isOverdue) return "reminder-overdue";
    if (isTodayReminder) return "reminder-today";
    if (daysUntil <= 7) return "reminder-upcoming";
    return "";
  };

  const getIcon = () => {
    switch (reminder.type) {
      case "birthday":
        return Cake;
      case "anniversary":
        return Home;
      default:
        return Calendar;
    }
  };

  const Icon = getIcon();

  return (
    <div className={cn(
      "card-elevated p-4 animate-fade-in",
      getStatusClass(),
      reminder.isCompleted && "opacity-60"
    )}>
      <div className="flex items-start gap-4">
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          reminder.type === "birthday" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
        )}>
          <Icon className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-medium text-foreground truncate">{reminder.title}</h4>
              {client && (
                <p className="text-sm text-muted-foreground">{client.name}</p>
              )}
            </div>
            {!reminder.isCompleted && onComplete && (
              <button
                onClick={() => onComplete(reminder.id)}
                className="p-1.5 rounded-lg hover:bg-success/10 text-muted-foreground hover:text-success transition-colors"
                title="Mark as completed"
              >
                <CheckCircle className="w-5 h-5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-4 h-4" />
              {format(reminderDate, "MMM d, yyyy")}
            </span>
            {!reminder.isCompleted && (
              <span className={cn(
                "text-xs font-medium px-2 py-0.5 rounded-full",
                isOverdue && "bg-destructive/10 text-destructive",
                isTodayReminder && "bg-success/10 text-success",
                daysUntil > 0 && daysUntil <= 7 && "bg-warning/10 text-warning",
                daysUntil > 7 && "bg-muted text-muted-foreground"
              )}>
                {isOverdue ? `${Math.abs(daysUntil)} days overdue` :
                 isTodayReminder ? "Today" :
                 daysUntil === 1 ? "Tomorrow" :
                 `In ${daysUntil} days`}
              </span>
            )}
            {reminder.isCompleted && (
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-success/10 text-success">
                Completed
              </span>
            )}
          </div>

          {property && (
            <p className="text-xs text-muted-foreground mt-2 truncate">
              📍 {property.address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
