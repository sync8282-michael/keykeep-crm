import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getMonth, getDate, parseISO, differenceInYears } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Home, Mail, MessageCircle } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Client } from "@/db/database";
import { Link } from "react-router-dom";

export default function CalendarLocal() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const clients = useLiveQuery(() => db.clients.toArray()) ?? [];

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  // Get clients with anniversaries on a specific day (month/day match)
  const getClientsForDay = (date: Date): Client[] => {
    const targetMonth = getMonth(date);
    const targetDate = getDate(date);

    return clients.filter((client) => {
      if (!client.moveInDate) return false;
      const moveIn = parseISO(client.moveInDate);
      return getMonth(moveIn) === targetMonth && getDate(moveIn) === targetDate;
    });
  };

  const selectedDayClients = useMemo(() => {
    if (!selectedDate) return [];
    return getClientsForDay(selectedDate);
  }, [selectedDate, clients]);

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">
            View all client anniversaries in one place.
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
                  const dayClients = getClientsForDay(day);
                  const hasAnniversaries = dayClients.length > 0;
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
                        {dayClients.slice(0, 2).map((client) => (
                          <div
                            key={client.id}
                            className="text-xs px-1.5 py-0.5 rounded bg-accent/20 text-accent truncate"
                          >
                            {client.name.split(" ")[0]}
                          </div>
                        ))}
                        {dayClients.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayClients.length - 2} more
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
                selectedDayClients.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayClients.map((client) => {
                      const yearsOwned = client.moveInDate
                        ? differenceInYears(new Date(), parseISO(client.moveInDate))
                        : 0;

                      return (
                        <Link
                          key={client.id}
                          to={`/clients/${client.id}`}
                          className="block p-4 rounded-lg border border-accent/30 bg-accent/5 hover:bg-accent/10 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            {client.imagePath ? (
                              <img
                                src={client.imagePath}
                                alt={client.address}
                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
                                <Home className="w-5 h-5 text-accent" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">
                                {client.name}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {client.address}
                              </p>
                              <p className="text-sm font-semibold text-accent mt-1">
                                {yearsOwned} Year Anniversary 🎉
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                {client.optInEmail && (
                                  <Mail className="w-3.5 h-3.5 text-primary" />
                                )}
                                {client.optInWhatsApp && (
                                  <MessageCircle className="w-3.5 h-3.5 text-success" />
                                )}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No anniversaries on this day.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Click on a date to see anniversaries.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
