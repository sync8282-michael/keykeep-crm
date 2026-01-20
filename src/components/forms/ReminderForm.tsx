import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Client, Property, PropertyType, ReminderChannel, ReminderType } from "@/types";
import { cn } from "@/lib/utils";

interface ReminderFormProps {
  clients: Client[];
  properties: Property[];
  onSubmit: (data: ReminderFormData) => void;
  onCancel: () => void;
}

export interface ReminderFormData {
  clientId: string;
  propertyId?: string;
  type: ReminderType;
  title: string;
  description?: string;
  baseDate: Date;
  daysAfter?: number;
  specificDate?: Date;
  channel: ReminderChannel;
  isRecurring: boolean;
}

export function ReminderForm({ clients, properties, onSubmit, onCancel }: ReminderFormProps) {
  const [clientId, setClientId] = useState("");
  const [propertyId, setPropertyId] = useState("");
  const [type, setType] = useState<ReminderType>("anniversary");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [baseDate, setBaseDate] = useState<Date>();
  const [daysAfter, setDaysAfter] = useState<string>("");
  const [specificDate, setSpecificDate] = useState<Date>();
  const [channel, setChannel] = useState<ReminderChannel>("email");
  const [isRecurring, setIsRecurring] = useState(true);
  const [useSpecificDate, setUseSpecificDate] = useState(false);

  const clientProperties = properties.filter((p) => p.clientId === clientId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseDate || !title || !clientId) return;

    onSubmit({
      clientId,
      propertyId: propertyId || undefined,
      type,
      title,
      description: description || undefined,
      baseDate,
      daysAfter: daysAfter ? parseInt(daysAfter) : undefined,
      specificDate,
      channel,
      isRecurring,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-section space-y-6">
      <h3 className="text-lg font-semibold text-foreground">New Reminder</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Client Selection */}
        <div className="space-y-2">
          <Label htmlFor="client">Client</Label>
          <Select value={clientId} onValueChange={setClientId}>
            <SelectTrigger id="client">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  {client.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Property Selection */}
        <div className="space-y-2">
          <Label htmlFor="property">Property (Optional)</Label>
          <Select value={propertyId} onValueChange={setPropertyId} disabled={!clientId}>
            <SelectTrigger id="property">
              <SelectValue placeholder="Select property" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              {clientProperties.map((property) => (
                <SelectItem key={property.id} value={property.id}>
                  {property.address}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reminder Type */}
        <div className="space-y-2">
          <Label htmlFor="type">Reminder Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as ReminderType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="anniversary">Property Anniversary</SelectItem>
              <SelectItem value="birthday">Birthday</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Channel */}
        <div className="space-y-2">
          <Label htmlFor="channel">Notification Channel</Label>
          <Select value={channel} onValueChange={(v) => setChannel(v as ReminderChannel)}>
            <SelectTrigger id="channel">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="both">Both</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          placeholder="e.g., 1 Year Home Anniversary"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          placeholder="Additional notes..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
        />
      </div>

      {/* Date Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label>Base Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !baseDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {baseDate ? format(baseDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={baseDate}
                onSelect={setBaseDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Switch
              id="use-specific"
              checked={useSpecificDate}
              onCheckedChange={setUseSpecificDate}
            />
            <Label htmlFor="use-specific" className="text-sm">
              Use specific date instead of days after
            </Label>
          </div>
          
          {useSpecificDate ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !specificDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {specificDate ? format(specificDate, "PPP") : "Pick reminder date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={specificDate}
                  onSelect={setSpecificDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <Input
              type="number"
              placeholder="Days after base date (e.g., 365)"
              value={daysAfter}
              onChange={(e) => setDaysAfter(e.target.value)}
            />
          )}
        </div>
      </div>

      {/* Recurring */}
      <div className="flex items-center gap-2">
        <Switch
          id="recurring"
          checked={isRecurring}
          onCheckedChange={setIsRecurring}
        />
        <Label htmlFor="recurring">Recurring yearly</Label>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Create Reminder
        </Button>
      </div>
    </form>
  );
}
