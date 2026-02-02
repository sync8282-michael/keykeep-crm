import { useState, useRef } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, MapPin, Loader2, Upload, User, ImageIcon } from "lucide-react";
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

const contactMethods = [
  { value: "email", label: "Email" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "sms", label: "SMS" },
  { value: "phone", label: "Phone Call" },
];

export function ClientFormLocal({ onSubmit, onCancel, initialData, isLoading }: ClientFormLocalProps) {
  const { settings } = useSettings();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  
  const [name, setName] = useState(initialData?.name || "");
  const [address, setAddress] = useState(initialData?.address || "");
  const [houseType, setHouseType] = useState(initialData?.houseType || "house");
  const [moveInDate, setMoveInDate] = useState<Date | undefined>(
    initialData?.moveInDate ? new Date(initialData.moveInDate) : undefined
  );
  const [birthday, setBirthday] = useState<Date | undefined>(
    initialData?.birthday ? new Date(initialData.birthday) : undefined
  );
  const [email, setEmail] = useState(initialData?.email || "");
  const [phone, setPhone] = useState(initialData?.phone || "");
  const [avatarPath, setAvatarPath] = useState(initialData?.avatarPath || "");
  const [imagePath, setImagePath] = useState(initialData?.imagePath || "");
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [optInEmail, setOptInEmail] = useState(initialData?.optInEmail ?? true);
  const [optInWhatsApp, setOptInWhatsApp] = useState(initialData?.optInWhatsApp ?? false);
  const [optInSMS, setOptInSMS] = useState(initialData?.optInSMS ?? false);
  const [preferredContactMethod, setPreferredContactMethod] = useState<Client['preferredContactMethod']>(
    initialData?.preferredContactMethod || 'email'
  );
  const [fetchingStreetView, setFetchingStreetView] = useState(false);
  const [fetchingAvatarStreetView, setFetchingAvatarStreetView] = useState(false);

  const handleFetchAvatarStreetView = async () => {
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

    setFetchingAvatarStreetView(true);
    
    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `https://maps.googleapis.com/maps/api/streetview?size=400x400&location=${encodedAddress}&key=${settings.googleMapsApiKey}`;
      
      const img = new Image();
      img.onload = () => {
        setAvatarPath(url);
        setFetchingAvatarStreetView(false);
        toast({
          title: "Street View Loaded",
          description: "Profile photo set to property Street View.",
        });
      };
      img.onerror = () => {
        setFetchingAvatarStreetView(false);
        toast({
          title: "Could not load image",
          description: "Street View might not be available for this address.",
          variant: "destructive",
        });
      };
      img.src = url;
    } catch (error) {
      setFetchingAvatarStreetView(false);
      toast({
        title: "Error",
        description: "Failed to fetch Street View image.",
        variant: "destructive",
      });
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please select an image file.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB.",
        variant: "destructive",
      });
      return;
    }

    // Convert to base64 for local storage
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      setAvatarPath(result);
      toast({
        title: "Photo Added",
        description: "Profile photo has been set.",
      });
    };
    reader.readAsDataURL(file);
  };

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
      birthday: birthday ? format(birthday, "yyyy-MM-dd") : undefined,
      email,
      phone,
      avatarPath: avatarPath || undefined,
      imagePath: imagePath || undefined,
      notes: notes || undefined,
      optInEmail,
      optInWhatsApp,
      optInSMS,
      preferredContactMethod,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="form-section space-y-6">
      <h3 className="text-lg font-semibold text-foreground">
        {initialData ? "Edit Client" : "New Client"}
      </h3>

      {/* Profile Photo & Property Image */}
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Avatar Upload */}
        <div className="flex flex-col items-center gap-3">
          <Label className="text-sm text-muted-foreground">Profile Photo</Label>
          <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-border">
            {fetchingAvatarStreetView ? (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-muted-foreground animate-spin" />
              </div>
            ) : avatarPath ? (
              <img src={avatarPath} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            className="hidden"
          />
          {/* Photo Source Options */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => avatarInputRef.current?.click()}
              disabled={fetchingAvatarStreetView}
            >
              <Upload className="w-4 h-4 mr-1" />
              Upload
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFetchAvatarStreetView}
              disabled={fetchingAvatarStreetView || !settings?.googleMapsApiKey}
              title={!settings?.googleMapsApiKey ? "Add Google Maps API key in Settings" : "Use Street View as profile photo"}
            >
              {fetchingAvatarStreetView ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <MapPin className="w-4 h-4 mr-1" />
              )}
              Street View
            </Button>
          </div>
          {avatarPath && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAvatarPath("")}
              className="text-xs text-muted-foreground hover:text-destructive"
            >
              Remove photo
            </Button>
          )}
        </div>

        {/* Property Image Preview */}
        {imagePath && (
          <div className="flex-1 rounded-lg overflow-hidden border border-border">
            <img 
              src={imagePath} 
              alt="Property" 
              className="w-full h-40 object-cover"
            />
          </div>
        )}
      </div>

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
            />
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
          <Label>Birthday (Optional)</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !birthday && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {birthday ? format(birthday, "PPP") : "Pick a date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={birthday}
                onSelect={setBirthday}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Preferred Contact Method</Label>
          <Select value={preferredContactMethod} onValueChange={(v) => setPreferredContactMethod(v as Client['preferredContactMethod'])}>
            <SelectTrigger>
              <SelectValue placeholder="Select method" />
            </SelectTrigger>
            <SelectContent>
              {contactMethods.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="imagePath">Property Image URL (optional)</Label>
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

      {/* Communication Preferences - Disabled for now */}
      <div className="space-y-4 p-4 rounded-lg bg-muted/50 opacity-60">
        <Label className="text-base">Communication Preferences</Label>
        <p className="text-sm text-muted-foreground">
          Automated communications coming soon.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="optInEmail"
              checked={false}
              disabled
            />
            <label
              htmlFor="optInEmail"
              className="text-sm font-medium leading-none cursor-not-allowed opacity-70"
            >
              Email
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="optInWhatsApp"
              checked={false}
              disabled
            />
            <label
              htmlFor="optInWhatsApp"
              className="text-sm font-medium leading-none cursor-not-allowed opacity-70"
            >
              WhatsApp
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="optInSMS"
              checked={false}
              disabled
            />
            <label
              htmlFor="optInSMS"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              SMS
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
