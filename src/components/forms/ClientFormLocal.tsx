import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
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
import { Client } from "@/db/database";
import { useSettings } from "@/hooks/useSettings";
import { toast } from "@/hooks/use-toast";

interface ClientFormLocalProps {
  onSubmit: (data: Omit<Client, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialData?: Client;
  isLoading?: boolean;
}

const houseTypes = [
  { value: "house", label: "House" },
  { value: "apartment", label: "Apartment" },
  { value: "condo", label: "Condo" },
  { value: "townhouse", label: "Townhouse" },
  { value: "farm", label: "Farm" },
  { value: "land", label: "Land" },
];

export function ClientFormLocal({ onSubmit, onCancel, initialData, isLoading }: ClientFormLocalProps) {
  const { settings } = useSettings();
  
  const [name, setName] = useState(initialData?.name || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [houseType, setHouseType] = useState(initialData?.houseType || "house");
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(
    initialData?.moveInDate ? new Date(initialData.moveInDate) : undefined
  );
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [imagePath, setImagePath] = useState(initialData?.imagePath || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [optInEmail, setOptInEmail] = useState(initialData?.optInEmail ?? true);
  const [optInWhatsApp, setOptInWhatsApp] = useState(initialData?.optInWhatsApp ?? false);
  const [fetchingStreetView, setFetchingStreetView] = useState(false);

  const handleFetchStreetView = async () => {
    if (!address.trim()) {
      toast({
        title: "Address Required",
        description: "Please enter an address first.",
        variant: "destructive",
      });
      return;
    }

    if (!settings?.googleMapsApiKey) {
      toast({
        title: "API Key Required",
        description: "Please add your Google Maps API key in Settings.",
        variant: "destructive",
      });
      return;
    }

    setFetchingStreetView(true);
    
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${encodedAddress}&key=${settings.googleMapsApiKey}`;
      
      // Verify the image is valid by checking if it loads
      const img = new Image();
      img.onload = () => {
        setImagePath(url);
        setFetchingStreetView(false);
        toast({
          title: "Street View Loaded",
          description: "Property image has been set.",
        });
      };
      img.onerror = () => {
        setFetchingStreetView(false);
        toast({
          title: "Could not load image",
          description: "Street View might not be available for this address.",
          variant: "destructive",
        });
      };
      img.src = url;
    } catch (error) {
      setFetchingStreetView(false);
      toast({
        title: "Error",
        description: "Failed to fetch Street View image.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address) return;

    onSubmit({
      name,
      address,
      houseType,
      moveInDate: moveInDate ? format(moveInDate, "yyyy-MM-dd") : new Date().toISOString().split('T')[0],
      email,
      phone,
      imagePath: imagePath || undefined,
      notes: notes || undefined,
      optInEmail,
      optInWhatsApp,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-section space-y-6">
      <h3 className="text-lg font-semibold text-foreground">
        {initialData ? "Edit Client" : "New Client"}
      </h3>

      {/* Image Preview */}
      {imagePath && (
        <div className="rounded-lg overflow-hidden border border-border">
          <img 
            src={imagePath} 
            alt="Property" 
            className="w-full h-48 object-cover"
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">Full Name *</Label>
          <Input
            id="name"
            placeholder="John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="houseType">Property Type *</Label>
          <Select value={houseType} onValueChange={setHouseType}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              {houseTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">Property Address *</Label>
          <div className="flex gap-2">
            <Input
              id="address"
              placeholder="123 Main St, City, State"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              className="flex-1"
            />
            <Button 
              type="button" 
              variant="outline"
              onClick={handleFetchStreetView}
              disabled={fetchingStreetView || !settings?.googleMapsApiKey}
              title={!settings?.googleMapsApiKey ? "Add Google Maps API key in Settings" : "Fetch Street View"}
            >
              {fetchingStreetView ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MapPin className="h-4 w-4" />
              )}
              <span className="ml-2 hidden sm:inline">Fetch Street View</span>
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            placeholder="+1 555-0123"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Move-In Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !moveInDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {moveInDate ? format(moveInDate, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={moveInDate}
                onSelect={setMoveInDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imagePath">Image URL (optional)</Label>
          <Input
            id="imagePath"
            placeholder="https://..."
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          placeholder="Additional notes about this client..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />
      </div>

      {/* Communication Preferences */}
      <div className="space-y-4">
        <Label className="text-base">Communication Preferences</Label>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="optInEmail"
              checked={optInEmail}
              onCheckedChange={(checked) => setOptInEmail(checked === true)}
            />
            <label
              htmlFor="optInEmail"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Email notifications
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="optInWhatsApp"
              checked={optInWhatsApp}
              onCheckedChange={(checked) => setOptInWhatsApp(checked === true)}
            />
            <label
              htmlFor="optInWhatsApp"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              WhatsApp messages
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Saving..." : initialData ? "Update Client" : "Add Client"}
        </Button>
      </div>
    </form>
  );
}
