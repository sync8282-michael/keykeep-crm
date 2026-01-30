import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO, differenceInYears } from "date-fns";
import { ArrowLeft, Mail, Phone, Calendar, Home, Edit, MessageCircle, Trash2, Send, Loader2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ClientFormLocal } from "@/components/forms/ClientFormLocal";
import { Button } from "@/components/ui/button";
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
import { ClientDetailSkeleton } from "@/components/skeletons/PageSkeletons";
import { useLocalClient, useClientMutations } from "@/hooks/useLocalClients";
import { useResendEmail } from "@/hooks/useResendEmail";
import { useSettings } from "@/hooks/useSettings";
import { cn } from "@/lib/utils";

export default function ClientDetailLocal() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { client, isLoading } = useLocalClient(id);
  const { updateClient, deleteClient } = useClientMutations();
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
            {!client.imagePath && (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Home className="w-10 h-10 text-primary" />
              </div>
            )}

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
                    <span className={cn(
                      "badge-property",
                      client.houseType === "house" && "badge-house",
                      client.houseType === "farm" && "badge-farm",
                      client.houseType === "apartment" && "badge-apartment",
                      !["house", "farm", "apartment"].includes(client.houseType) && "bg-secondary text-secondary-foreground"
                    )}>
                      {client.houseType}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{client.address}</p>
                  <p className="text-lg font-semibold text-primary mt-2">
                    {yearsOwned} Year{yearsOwned !== 1 ? "s" : ""} Owned
                  </p>
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 flex-shrink-0" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 flex-shrink-0" />
                  <span>{client.phone}</span>
                </div>
                {client.moveInDate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>Move-in: {format(parseISO(client.moveInDate), "MMMM d, yyyy")}</span>
                  </div>
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

        {/* Action Buttons */}
        <div className="card-elevated p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Send Anniversary Message</h2>
          <div className="flex flex-wrap gap-3">
            {settings?.resendApiKey && (
              <Button
                onClick={() => sendAnniversaryEmail(client)}
                disabled={!client.optInEmail || isSending}
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
              variant={settings?.resendApiKey ? "outline" : "default"}
              disabled={!client.optInEmail}
              className="gap-2"
            >
              <Mail className="w-4 h-4" />
              Open Email Client
            </Button>
            <Button
              onClick={handleSendWhatsApp}
              variant="outline"
              disabled={!client.optInWhatsApp}
              className="gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Send WhatsApp
            </Button>
          </div>
          {(!client.optInEmail && !client.optInWhatsApp) && (
            <p className="text-sm text-muted-foreground mt-3">
              This client has not opted in to receive messages.
            </p>
          )}
          {!settings?.resendApiKey && (
            <p className="text-sm text-muted-foreground mt-3">
              Add your Resend API key in Settings to send emails directly.
            </p>
          )}
        </div>
      </div>
    </Layout>
  );
}
