import { useState, useEffect, useMemo } from "react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Home, Cake } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Client, Property, Reminder } from "@/types";
import { getClients, getProperties, getReminders } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function CalendarPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    setClients(getClients());
    setProperties(getProperties());
    setReminders(getReminders());
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get day offset for first day of month
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  const getReminderForDay = (date: Date) => {
    return reminders.filter((r) => 
      !r.isCompleted && isSameDay(parseISO(r.reminderDate), date)
    );
  };

  const selectedDayReminders = useMemo(() => {
    if (!selectedDate) return [];
    return reminders.filter((r) => 
      isSameDay(parseISO(r.reminderDate), selectedDate)
    );
  }, [selectedDate, reminders]);

  const getClientById = (id: string) => clients.find((c) => c.id === id);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">
            View all your reminders in one place.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Grid */}
          <div className="lg:col-span-2 card-elevated">
            <div className="p-6 border-b border-border">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  {format(currentDate, "MMMM yyyy")}
                </h2>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(subMonths(currentDate, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentDate(new Date())}
                  >
                    Today
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div
                    key={day}
                    className="text-center text-sm font-medium text-muted-foreground py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="h-24" />
                ))}
                {daysInMonth.map((day) => {
                  const dayReminders = getReminderForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const isSelected = selectedDate && isSameDay(day, selectedDate);

                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => setSelectedDate(day)}
                      className={cn(
                        "h-24 p-2 rounded-lg text-left transition-all duration-200 hover:bg-muted",
                        isToday && "bg-primary/5 border border-primary/20",
                        isSelected && "bg-primary/10 border-2 border-primary",
                        !isToday && !isSelected && "border border-transparent"
                      )}
                    >
                      <span className={cn(
                        "text-sm font-medium",
                        isToday && "text-primary",
                        !isToday && "text-foreground"
                      )}>
                        {format(day, "d")}
                      </span>

                      <div className="mt-1 space-y-1">
                        {dayReminders.slice(0, 2).map((reminder) => (
                          <div
                            key={reminder.id}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded truncate",
                              reminder.type === "birthday" 
                                ? "bg-accent/20 text-accent" 
                                : "bg-primary/20 text-primary"
                            )}
                          >
                            {reminder.title.slice(0, 15)}...
                          </div>
                        ))}
                        {dayReminders.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayReminders.length - 2} more
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Day Details */}
          <div className="card-elevated">
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold text-foreground">
                {selectedDate 
                  ? format(selectedDate, "EEEE, MMMM d") 
                  : "Select a date"}
              </h3>
            </div>
            <div className="p-6">
              {selectedDate ? (
                selectedDayReminders.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayReminders.map((reminder) => {
                      const client = getClientById(reminder.clientId);
                      return (
                        <div
                          key={reminder.id}
                          className={cn(
                            "p-3 rounded-lg border",
                            reminder.isCompleted 
                              ? "border-border opacity-60" 
                              : reminder.type === "birthday"
                              ? "border-accent/30 bg-accent/5"
                              : "border-primary/30 bg-primary/5"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center",
                              reminder.type === "birthday" 
                                ? "bg-accent/20 text-accent" 
                                : "bg-primary/20 text-primary"
                            )}>
                              {reminder.type === "birthday" ? (
                                <Cake className="w-4 h-4" />
                              ) : (
                                <Home className="w-4 h-4" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-foreground text-sm">
                                {reminder.title}
                              </p>
                              {client && (
                                <p className="text-xs text-muted-foreground">
                                  {client.name}
                                </p>
                              )}
                              {reminder.description && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  {reminder.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No reminders for this day.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Click on a date to see details.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
