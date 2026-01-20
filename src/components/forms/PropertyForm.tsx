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
import { PropertyType } from "@/types";
import { cn } from "@/lib/utils";

interface PropertyFormProps {
  clientId: string;
  onSubmit: (data: PropertyFormData) => void;
  onCancel: () => void;
  initialData?: Partial<PropertyFormData>;
}

export interface PropertyFormData {
  type: PropertyType;
  address: string;
  purchaseDate: Date;
  notes?: string;
}

export function PropertyForm({ clientId, onSubmit, onCancel, initialData }: PropertyFormProps) {
  const [type, setType] = useState<PropertyType>(initialData?.type || "house");
  const [address, setAddress] = useState(initialData?.address || "");
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(initialData?.purchaseDate);
  const [notes, setNotes] = useState(initialData?.notes || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !address || !purchaseDate) return;

    onSubmit({
      type,
      address,
      purchaseDate,
      notes: notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-section space-y-6">
      <h3 className="text-lg font-semibold text-foreground">
        {initialData ? "Edit Property" : "Add Property"}
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="type">Property Type</Label>
          <Select value={type} onValueChange={(v) => setType(v as PropertyType)}>
            <SelectTrigger id="type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="house">House</SelectItem>
              <SelectItem value="farm">Farm</SelectItem>
              <SelectItem value="apartment">Apartment</SelectItem>
              <SelectItem value="plot">Plot</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Purchase Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !purchaseDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {purchaseDate ? format(purchaseDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={purchaseDate}
                onSelect={setPurchaseDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Address</Label>
        <Input
          id="address"
          placeholder="123 Oak Street, Springfield"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Additional details about the property..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? "Update Property" : "Add Property"}
        </Button>
      </div>
    </form>
  );
}
