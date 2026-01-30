import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, differenceInYears } from "date-fns";
import { 
  ArrowLeft, Mail, Phone, Calendar, Home, Edit, MessageCircle, 
  Trash2, Send, Loader2, User, Cake, Bell, Plus, MapPin
} from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ClientFormLocal } from "@/components/forms/ClientFormLocal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { ReminderFormDialog } from "@/components/reminders/ReminderFormDialog";
import { ClientDetailSkeleton } from "@/components/skeletons/PageSkeletons";
import { useLocalClient, useClientMutations, useLocalClients } from "@/hooks/useLocalClients";
import { useRemindersByClient, useReminderMutations } from "@/hooks/useRemindersLocal";
import { useResendEmail } from "@/hooks/useResendEmail";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

const contactMethodLabels = {
  email: "Email",
  whatsapp: "WhatsApp",
  sms: "SMS",
  phone: "Phone Call",
};

export default function ClientDetailLocal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReminderDialog, setShowReminderDialog] = useState(false);

  const { client, isLoading } = useLocalClient(id);
  const { clients } = useLocalClients();
  const { updateClient, deleteClient } = useClientMutations();
  const { reminders } = useRemindersByClient(id);
  const { markAsSent, deleteReminder } = useReminderMutations();
  const { sendAnniversaryEmail, isSending } = useResendEmail();
  const { settings } = useSettings();

  const handleUpdate = async (data: Parameters<typeof updateClient>[1]) => {
    if (!id) return;
    setIsSubmitting(true);
    try {
      await updateClient(id, data);
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    await deleteClient(id);
    navigate("/clients");
  };

  const handleSendEmail = () => {
    if (!client) return;
    const subject = encodeURIComponent(`Happy Anniversary from KeyKeep Pro!`);
    const body = encodeURIComponent(
      `Dear ${client.name},\n\nCongratulations on your home anniversary! We hope you're enjoying your property at ${client.address}.\n\nBest regards`
    );
    window.open(`mailto:${client.email}?subject=${subject}&body=${body}`);
  };

  const handleSendWhatsApp = () => {
    if (!client) return;
    const message = encodeURIComponent(
      `Hi ${client.name}! 🎉 Congratulations on your home anniversary! We hope you're enjoying your property at ${client.address}.`
    );
    const phone = client.phone.replace(/\D/g, "");
    window.open(`https://wa.me/${phone}?text=${message}`);
  };

  const handleSendSMS = () => {
    if (!client) return;
    const message = encodeURIComponent(
      `Hi ${client.name}! Congratulations on your home anniversary at ${client.address}!`
    );
    const phone = client.phone.replace(/\D/g, "");
    window.open(`sms:${phone}?body=${message}`);
  };

  const handleCall = () => {
    if (!client) return;
    window.open(`tel:${client.phone}`);
  };

  if (isLoading) {
    return (
      <Layout>
        <ClientDetailSkeleton />
      </Layout>
    );
  }

  if (!client) {
    navigate("/clients");
    return null;
  }

  const yearsOwned = client.moveInDate
    ? differenceInYears(new Date(), parseISO(client.moveInDate))
    : 0;

  const activeReminders = reminders?.filter(r => !r.isCompleted) || [];

  if (isEditing) {
    return (
      <Layout>
        <div className="space-y-6 animate-fade-in">
          <Button variant="ghost" onClick={() => setIsEditing(false)} className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            Cancel Edit
          </Button>
          <ClientFormLocal
            initialData={client}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isLoading={isSubmitting}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/clients")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Button>

        {/* Property Image */}
        {client.imagePath && (
          <div className="rounded-xl overflow-hidden border border-border">
            <img
              src={client.imagePath}
              alt={client.address}
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>
        )}

        {/* Client Info Header */}
        <div className="card-elevated p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="flex-shrink-0">
              {client.avatarPath ? (
                <img 
                  src={client.avatarPath} 
                  alt={client.name}
                  className="w-24 h-24 rounded-full object-cover border-4 border-background shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center border-4 border-background shadow-lg">
                  <User className="w-12 h-12 text-primary" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
                    <Badge variant="outline" className={cn(
                      "capitalize",
                      client.houseType === "house" && "bg-green-500/10 text-green-600 border-green-500/20",
                      client.houseType === "farm" && "bg-amber-500/10 text-amber-600 border-amber-500/20",
                      client.houseType === "apartment" && "bg-blue-500/10 text-blue-600 border-blue-500/20"
                    )}>
                      {client.houseType}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{client.address}</span>
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <p className="text-lg font-semibold text-primary">
                      {yearsOwned} Year{yearsOwned !== 1 ? "s" : ""} Owned
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      Prefers {contactMethodLabels[client.preferredContactMethod || 'email']}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Client?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete {client.name} and all their data. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {/* Contact Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <a href={`mailto:${client.email}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </a>
                <a href={`tel:${client.phone}`} className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{client.phone}</span>
                </a>
                {client.moveInDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>Move-in: {format(parseISO(client.moveInDate), "MMM d, yyyy")}</span>
                  </div>
                )}
                {client.birthday && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Cake className="w-4 h-4 flex-shrink-0" />
                    <span>Birthday: {format(parseISO(client.birthday), "MMM d")}</span>
                  </div>
                )}
              </div>

              {/* Opt-in Status */}
              <div className="flex items-center gap-2 mt-4 flex-wrap">
                <span className="text-sm text-muted-foreground">Opted in:</span>
                {client.optInEmail && <Badge variant="outline" className="text-xs">Email</Badge>}
                {client.optInWhatsApp && <Badge variant="outline" className="text-xs">WhatsApp</Badge>}
                {client.optInSMS && <Badge variant="outline" className="text-xs">SMS</Badge>}
                {!client.optInEmail && !client.optInWhatsApp && !client.optInSMS && (
                  <span className="text-sm text-muted-foreground italic">None</span>
                )}
              </div>

              {client.notes && (
                <p className="mt-4 text-sm text-muted-foreground border-t border-border pt-4">
                  {client.notes}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Reminders Section */}
        <div className="card-elevated p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Scheduled Reminders
            </h2>
            <Button size="sm" onClick={() => setShowReminderDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Reminder
            </Button>
          </div>

          {activeReminders.length === 0 ? (
            <p className="text-muted-foreground text-sm">No active reminders for this client.</p>
          ) : (
            <div className="space-y-3">
              {activeReminders.map(reminder => (
                <div key={reminder.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-foreground">{reminder.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(reminder.nextDueDate || reminder.reminderDate), "MMM d, yyyy")} 
                      {reminder.isRecurring && ` • Repeats ${reminder.recurrencePattern}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{reminder.channel}</Badge>
                    <Button size="sm" variant="outline" onClick={() => markAsSent(reminder.id!)}>
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Send Message</h2>
          <div className="flex flex-wrap gap-3">
            {settings?.resendApiKey && client.optInEmail && (
              <Button
                onClick={() => sendAnniversaryEmail(client)}
                disabled={isSending}
                className="gap-2"
              >
                {isSending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send via Resend
              </Button>
            )}
            <Button
              onClick={handleSendEmail}
              variant="outline"
              disabled={!client.optInEmail}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Email
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              variant="outline"
              disabled={!client.optInWhatsApp}
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button
              onClick={handleSendSMS}
              variant="outline"
              disabled={!client.optInSMS}
              className="gap-2"
            >
              <Phone className="w-4 h-4" />
              SMS
            </Button>
            <Button
              onClick={handleCall}
              variant="outline"
              className="gap-2"
            >
              <Phone className="w-4 h-4" />
              Call
            </Button>
          </div>
          {!settings?.resendApiKey && client.optInEmail && (
            <p className="text-sm text-muted-foreground mt-3">
              Add your Resend API key in Settings to send emails directly.
            </p>
          )}
        </div>
      </div>

      <ReminderFormDialog
        open={showReminderDialog}
        onOpenChange={setShowReminderDialog}
        clients={clients || []}
        initialData={id ? { clientId: id } as any : undefined}
      />
    </Layout>
  );
}
