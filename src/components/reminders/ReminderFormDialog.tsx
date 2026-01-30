import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Client, Reminder } from "@/db/database";
import { useReminderMutations } from "@/hooks/useRemindersLocal";

interface ReminderFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: Client[];
  initialData?: Reminder;
}

export function ReminderFormDialog({ 
  open, 
  onOpenChange, 
  clients,
  initialData 
}: ReminderFormDialogProps) {
  const { createReminder, updateReminder } = useReminderMutations();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [clientId, setClientId] = useState(initialData?.clientId || "");
  const [title, setTitle] = useState(initialData?.title || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [type, setType] = useState<Reminder['type']>(initialData?.type || "custom");
  const [channel, setChannel] = useState<Reminder['channel']>(initialData?.channel || "email");
  const [reminderDate, setReminderDate] = useState<Date | undefined>(
    initialData?.reminderDate ? new Date(initialData.reminderDate) : undefined
  );
  const [isRecurring, setIsRecurring] = useState(initialData?.isRecurring ?? false);
  const [recurrencePattern, setRecurrencePattern] = useState<'yearly' | 'monthly' | 'weekly'>(
    initialData?.recurrencePattern || 'yearly'
  );
  const [recurrenceCount, setRecurrenceCount] = useState<string>(
    initialData?.recurrenceCount?.toString() || ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || !title || !reminderDate) return;

    setIsSubmitting(true);
    try {
      const data = {
        clientId,
        title,
        description: description || undefined,
        type,
        channel,
        baseDate: format(reminderDate, 'yyyy-MM-dd'),
        reminderDate: format(reminderDate, 'yyyy-MM-dd'),
        isRecurring,
        recurrencePattern: isRecurring ? recurrencePattern : undefined,
        recurrenceCount: isRecurring && recurrenceCount ? parseInt(recurrenceCount) : undefined,
        isCompleted: false,
      };

      if (initialData?.id) {
        await updateReminder(initialData.id, data);
      } else {
        await createReminder(data);
      }

      onOpenChange(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setClientId("");
    setTitle("");
    setDescription("");
    setType("custom");
    setChannel("email");
    setReminderDate(undefined);
    setIsRecurring(false);
    setRecurrencePattern("yearly");
    setRecurrenceCount("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Reminder" : "Create Reminder"}</DialogTitle>
          <DialogDescription>
            Schedule a reminder to contact your client.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Client *</Label>
            <Select value={clientId} onValueChange={setClientId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(client => (
                  <SelectItem key={client.id} value={client.id!}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Home Anniversary Reminder"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Type *</Label>
              <Select value={type} onValueChange={(v) => setType(v as Reminder['type'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="anniversary">Anniversary</SelectItem>
                  <SelectItem value="birthday">Birthday</SelectItem>
                  <SelectItem value="follow_up">Follow Up</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Channel *</Label>
              <Select value={channel} onValueChange={(v) => setChannel(v as Reminder['channel'])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="push">Push Notification</SelectItem>
                  <SelectItem value="all">All Channels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reminder Date *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !reminderDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {reminderDate ? format(reminderDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={reminderDate}
                  onSelect={setReminderDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional details..."
              rows={2}
            />
          </div>

          {/* Recurring Options */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/50">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="recurring" className="text-base">Recurring Reminder</Label>
                <p className="text-sm text-muted-foreground">
                  Repeat this reminder automatically
                </p>
              </div>
              <Switch
                id="recurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
            </div>

            {isRecurring && (
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label>Repeat Every</Label>
                  <Select 
                    value={recurrencePattern} 
                    onValueChange={(v) => setRecurrencePattern(v as typeof recurrencePattern)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Year</SelectItem>
                      <SelectItem value="monthly">Month</SelectItem>
                      <SelectItem value="weekly">Week</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recurrenceCount">Number of Times</Label>
                  <Input
                    id="recurrenceCount"
                    type="number"
                    min="1"
                    value={recurrenceCount}
                    onChange={(e) => setRecurrenceCount(e.target.value)}
                    placeholder="Forever"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty to repeat forever
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : initialData ? "Update" : "Create Reminder"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
