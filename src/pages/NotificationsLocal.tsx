import { useState } from "react";
import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from "date-fns";
import { 
  Bell, BellRing, Calendar, Mail, MessageCircle, Phone, 
  Plus, Check, Clock, Trash2, Filter, Send, AlertCircle,
  ChevronRight, User
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ReminderFormDialog } from "@/components/reminders/ReminderFormDialog";
import { useReminders, useTodaysReminders, useUpcomingReminders, useReminderMutations } from "@/hooks/useRemindersLocal";
import { useLocalClients } from "@/hooks/useLocalClients";
import { Reminder } from "@/db/database";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const channelIcons = {
  email: Mail,
  whatsapp: MessageCircle,
  sms: Phone,
  push: Bell,
  all: BellRing,
};

const typeColors = {
  anniversary: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  birthday: "bg-pink-500/10 text-pink-600 border-pink-500/20",
  follow_up: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  custom: "bg-purple-500/10 text-purple-600 border-purple-500/20",
};

export default function NotificationsLocal() {
  const navigate = useNavigate();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterChannel, setFilterChannel] = useState<string>("all");

  const { reminders: allReminders, isLoading } = useReminders();
  const { reminders: todaysReminders } = useTodaysReminders();
  const { reminders: upcomingReminders } = useUpcomingReminders(7);
  const { clients } = useLocalClients();
  const { markAsSent, snoozeReminder, deleteReminder } = useReminderMutations();

  const getClientName = (clientId: string) => {
    return clients?.find(c => c.id === clientId)?.name || "Unknown Client";
  };

  const getClientAvatar = (clientId: string) => {
    return clients?.find(c => c.id === clientId)?.avatarPath;
  };

  const getDueDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return `${differenceInDays(new Date(), date)} days overdue`;
    const daysUntil = differenceInDays(date, new Date());
    if (daysUntil <= 7) return `In ${daysUntil} days`;
    return format(date, "MMM d, yyyy");
  };

  const filteredReminders = allReminders?.filter(r => {
    if (filterType !== "all" && r.type !== filterType) return false;
    if (filterChannel !== "all" && r.channel !== filterChannel) return false;
    return !r.isCompleted;
  }) || [];

  const completedReminders = allReminders?.filter(r => r.isCompleted) || [];

  const ReminderCard = ({ reminder }: { reminder: Reminder }) => {
    const ChannelIcon = channelIcons[reminder.channel];
    const dueDate = reminder.nextDueDate || reminder.reminderDate;
    const isOverdue = isPast(parseISO(dueDate)) && !isToday(parseISO(dueDate));
    const clientAvatar = getClientAvatar(reminder.clientId);

    return (
      <div className={cn(
        "p-4 rounded-xl border transition-all hover:shadow-md",
        isOverdue ? "border-destructive/50 bg-destructive/5" : "border-border bg-card"
      )}>
        <div className="flex items-start gap-4">
          {/* Client Avatar */}
          <div className="flex-shrink-0">
            {clientAvatar ? (
              <img 
                src={clientAvatar} 
                alt="" 
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-6 h-6 text-primary" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-foreground truncate">{reminder.title}</h3>
                <button 
                  onClick={() => navigate(`/clients/${reminder.clientId}`)}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {getClientName(reminder.clientId)}
                </button>
              </div>
              <Badge variant="outline" className={cn("flex-shrink-0", typeColors[reminder.type])}>
                {reminder.type.replace('_', ' ')}
              </Badge>
            </div>

            {reminder.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {reminder.description}
              </p>
            )}

            <div className="flex items-center gap-4 mt-3">
              <div className={cn(
                "flex items-center gap-1.5 text-sm",
                isOverdue ? "text-destructive font-medium" : "text-muted-foreground"
              )}>
                {isOverdue ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                {getDueDateLabel(dueDate)}
              </div>
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <ChannelIcon className="w-4 h-4" />
                {reminder.channel}
              </div>
              {reminder.isRecurring && (
                <Badge variant="secondary" className="text-xs">
                  {reminder.recurrencePattern} 
                  {reminder.recurrenceCount && ` (${reminder.completedCount}/${reminder.recurrenceCount})`}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4">
              <Button size="sm" onClick={() => markAsSent(reminder.id!)}>
                <Send className="w-4 h-4 mr-1" />
                Mark Sent
              </Button>
              <Button size="sm" variant="outline" onClick={() => snoozeReminder(reminder.id!, 1)}>
                <Clock className="w-4 h-4 mr-1" />
                Snooze
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Reminder?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this reminder. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => deleteReminder(reminder.id!)}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
            <p className="text-muted-foreground">
              Manage your client reminders and scheduled messages
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Reminder
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertCircle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{todaysReminders?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Due Today</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{upcomingReminders?.length || 0}</p>
                <p className="text-sm text-muted-foreground">This Week</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{filteredReminders.length}</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </div>
          <div className="card-elevated p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Check className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{completedReminders.length}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="today">Today</TabsTrigger>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filterChannel} onValueChange={setFilterChannel}>
                <SelectTrigger className="w-[130px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <TabsContent value="all" className="space-y-4">
            {filteredReminders.length === 0 ? (
              <div className="card-elevated p-12 text-center">
                <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Reminders</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first reminder to stay on top of client communications.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Reminder
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="today" className="space-y-4">
            {!todaysReminders?.length ? (
              <div className="card-elevated p-12 text-center">
                <Check className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">All Clear!</h3>
                <p className="text-muted-foreground">No reminders due today.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaysReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="space-y-4">
            {!upcomingReminders?.length ? (
              <div className="card-elevated p-12 text-center">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Nothing Upcoming</h3>
                <p className="text-muted-foreground">No reminders scheduled for the next 7 days.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {completedReminders.length === 0 ? (
              <div className="card-elevated p-12 text-center">
                <Check className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Completed Reminders</h3>
                <p className="text-muted-foreground">Completed reminders will appear here.</p>
              </div>
            ) : (
              <div className="space-y-3 opacity-75">
                {completedReminders.map(reminder => (
                  <ReminderCard key={reminder.id} reminder={reminder} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <ReminderFormDialog 
        open={showCreateDialog} 
        onOpenChange={setShowCreateDialog}
        clients={clients || []}
      />
    </Layout>
  );
}
