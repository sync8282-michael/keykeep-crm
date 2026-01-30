import { useState, useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, getMonth, getDate, parseISO, differenceInYears } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar, Home, Mail, MessageCircle, Bell, Cake, Send, Clock } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useLiveQuery } from "dexie-react-hooks";
import { db, Client, Reminder } from "@/db/database";
import { Link } from "react-router-dom";
import { useReminderMutations } from "@/hooks/useRemindersLocal";

interface DayEvent {
  type: 'anniversary' | 'birthday' | 'reminder';
  client?: Client;
  reminder?: Reminder;
  label: string;
}

export default function CalendarLocal() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const clients = useLiveQuery(() => db.clients.toArray()) ?? [];
  const reminders = useLiveQuery(() => db.reminders.where('isCompleted').equals(0).toArray()) ?? [];
  
  const { markAsSent, snoozeReminder } = useReminderMutations();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDay = monthStart.getDay();
  const emptyDays = Array(startDay).fill(null);

  // Get all events for a specific day
  const getEventsForDay = (date: Date): DayEvent[] => {
    const targetMonth = getMonth(date);
    const targetDate = getDate(date);
    const dateStr = format(date, 'yyyy-MM-dd');
    const events: DayEvent[] = [];

    // Client anniversaries (move-in dates)
    clients.forEach((client) => {
      if (!client.moveInDate) return;
      const moveIn = parseISO(client.moveInDate);
      if (getMonth(moveIn) === targetMonth && getDate(moveIn) === targetDate) {
        events.push({
          type: 'anniversary',
          client,
          label: `${client.name.split(" ")[0]}'s Anniversary`
        });
      }
    });

    // Client birthdays
    clients.forEach((client) => {
      if (!client.birthday) return;
      const bday = parseISO(client.birthday);
      if (getMonth(bday) === targetMonth && getDate(bday) === targetDate) {
        events.push({
          type: 'birthday',
          client,
          label: `${client.name.split(" ")[0]}'s Birthday`
        });
      }
    });

    // Scheduled reminders
    reminders.forEach((reminder) => {
      const dueDate = reminder.nextDueDate || reminder.reminderDate;
      if (dueDate === dateStr) {
        const client = clients.find(c => c.id === reminder.clientId);
        events.push({
          type: 'reminder',
          reminder,
          client,
          label: reminder.title
        });
      }
    });

    return events;
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDay(selectedDate);
  }, [selectedDate, clients, reminders]);

  const eventColors = {
    anniversary: "bg-amber-500/20 text-amber-700 dark:text-amber-400",
    birthday: "bg-pink-500/20 text-pink-700 dark:text-pink-400",
    reminder: "bg-blue-500/20 text-blue-700 dark:text-blue-400",
  };

  const eventIcons = {
    anniversary: Home,
    birthday: Cake,
    reminder: Bell,
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendar</h1>
          <p className="text-muted-foreground">
            View anniversaries, birthdays, and scheduled reminders.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
            <span className="text-muted-foreground">Anniversary</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500/50"></div>
            <span className="text-muted-foreground">Birthday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500/50"></div>
            <span className="text-muted-foreground">Reminder</span>
          </div>
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
                  const dayEvents = getEventsForDay(day);
                  const hasEvents = dayEvents.length > 0;
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
                        {dayEvents.slice(0, 2).map((event, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded truncate",
                              eventColors[event.type]
                            )}
                          >
                            {event.label.length > 12 ? event.label.substring(0, 10) + '...' : event.label}
                          </div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="text-xs text-muted-foreground px-1">
                            +{dayEvents.length - 2} more
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
              {selectedDate && selectedDayEvents.length > 0 && (
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedDayEvents.length} event{selectedDayEvents.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <div className="p-6 max-h-[500px] overflow-y-auto">
              {selectedDate ? (
                selectedDayEvents.length > 0 ? (
                  <div className="space-y-3">
                    {selectedDayEvents.map((event, idx) => {
                      const Icon = eventIcons[event.type];
                      
                      if (event.type === 'reminder' && event.reminder) {
                        return (
                          <div
                            key={idx}
                            className="p-4 rounded-lg border border-blue-500/30 bg-blue-500/5"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                                <Bell className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground">
                                  {event.reminder.title}
                                </p>
                                {event.client && (
                                  <Link 
                                    to={`/clients/${event.client.id}`}
                                    className="text-sm text-muted-foreground hover:text-primary"
                                  >
                                    {event.client.name}
                                  </Link>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge variant="outline" className="text-xs">
                                    {event.reminder.channel}
                                  </Badge>
                                  {event.reminder.isRecurring && (
                                    <Badge variant="secondary" className="text-xs">
                                      {event.reminder.recurrencePattern}
                                    </Badge>
                                  )}
                                </div>
                                <div className="flex gap-2 mt-3">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => markAsSent(event.reminder!.id!)}
                                  >
                                    <Send className="w-3 h-3 mr-1" />
                                    Done
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost"
                                    onClick={() => snoozeReminder(event.reminder!.id!, 1)}
                                  >
                                    <Clock className="w-3 h-3 mr-1" />
                                    Snooze
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      // Anniversary or Birthday
                      const yearsOwned = event.client?.moveInDate && event.type === 'anniversary'
                        ? differenceInYears(new Date(), parseISO(event.client.moveInDate))
                        : 0;

                      return (
                        <Link
                          key={idx}
                          to={`/clients/${event.client?.id}`}
                          className={cn(
                            "block p-4 rounded-lg border transition-colors",
                            event.type === 'anniversary' && "border-amber-500/30 bg-amber-500/5 hover:bg-amber-500/10",
                            event.type === 'birthday' && "border-pink-500/30 bg-pink-500/5 hover:bg-pink-500/10"
                          )}
                        >
                          <div className="flex items-start gap-3">
                            {event.client?.avatarPath ? (
                              <img
                                src={event.client.avatarPath}
                                alt={event.client.name}
                                className="w-10 h-10 object-cover rounded-full flex-shrink-0"
                              />
                            ) : (
                              <div className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                event.type === 'anniversary' && "bg-amber-500/20",
                                event.type === 'birthday' && "bg-pink-500/20"
                              )}>
                                <Icon className={cn(
                                  "w-5 h-5",
                                  event.type === 'anniversary' && "text-amber-600",
                                  event.type === 'birthday' && "text-pink-600"
                                )} />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-foreground">
                                {event.client?.name}
                              </p>
                              {event.type === 'anniversary' && (
                                <>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {event.client?.address}
                                  </p>
                                  <p className={cn(
                                    "text-sm font-semibold mt-1",
                                    "text-amber-600"
                                  )}>
                                    {yearsOwned} Year Anniversary 🎉
                                  </p>
                                </>
                              )}
                              {event.type === 'birthday' && (
                                <p className="text-sm font-semibold text-pink-600 mt-1">
                                  Birthday 🎂
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-1">
                                {event.client?.optInEmail && (
                                  <Mail className="w-3.5 h-3.5 text-primary" />
                                )}
                                {event.client?.optInWhatsApp && (
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
                    <p className="text-muted-foreground">No events on this day.</p>
                  </div>
                )
              ) : (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">Click on a date to see events.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
