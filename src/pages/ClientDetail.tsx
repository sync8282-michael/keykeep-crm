import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, User, Mail, Phone, Calendar, Home, Plus, Edit, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PropertyForm, PropertyFormData } from "@/components/forms/PropertyForm";
import { PropertyDocuments } from "@/components/properties/PropertyDocuments";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ClientDetailSkeleton } from "@/components/skeletons/PageSkeletons";
import { useClient } from "@/hooks/useClients";
import { useProperties, useCreateProperty } from "@/hooks/useProperties";
import { useClientReminders } from "@/hooks/useReminders";
import { cn } from "@/lib/utils";

const propertyTypeLabels: Record<string, string> = {
  house: "House",
  farm: "Farm",
  apartment: "Apartment",
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showPropertyForm, setShowPropertyForm] = useState(false);
  const [expandedPropertyId, setExpandedPropertyId] = useState<string | null>(null);

  const { data: client, isLoading: clientLoading } = useClient(id);
  const { data: properties = [], isLoading: propertiesLoading } = useProperties(id);
  const { data: reminders = [], isLoading: remindersLoading } = useClientReminders(id);
  const createProperty = useCreateProperty();

  const isLoading = clientLoading || propertiesLoading || remindersLoading;

  const handleCreateProperty = async (data: PropertyFormData) => {
    if (!client) return;

    await createProperty.mutateAsync({
      client_id: client.id,
      type: data.type,
      address: data.address,
      purchase_date: data.purchaseDate ? format(data.purchaseDate, "yyyy-MM-dd") : null,
      purchase_price: data.purchasePrice || null,
      notes: data.notes || null,
    });

    setShowPropertyForm(false);
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

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/clients")} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Button>

        {/* Client Info Header */}
        <div className="card-elevated p-6">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-primary" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
                  <p className="text-muted-foreground">
                    Client since {format(parseISO(client.created_at), "MMMM yyyy")}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  <Edit className="w-4 h-4 mr-1" />
                  Edit
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                {client.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-4 h-4 flex-shrink-0" />
                    <span>{client.phone}</span>
                  </div>
                )}
                {client.birthday && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4 flex-shrink-0" />
                    <span>Birthday: {format(parseISO(client.birthday), "MMMM d")}</span>
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

        {/* Properties Section */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Properties</h2>
                <p className="text-sm text-muted-foreground">
                  {properties.length} {properties.length === 1 ? "property" : "properties"} owned
                </p>
              </div>
              <Button onClick={() => setShowPropertyForm(!showPropertyForm)} size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Property
              </Button>
            </div>
          </div>

          {showPropertyForm && (
            <div className="p-6 border-b border-border bg-muted/30">
              <PropertyForm
                clientId={client.id}
                onSubmit={handleCreateProperty}
                onCancel={() => setShowPropertyForm(false)}
                isLoading={createProperty.isPending}
              />
            </div>
          )}

          <div className="p-6">
            {properties.length > 0 ? (
              <div className="grid gap-4">
                {properties.map((property) => {
                  const isExpanded = expandedPropertyId === property.id;

                  return (
                    <Collapsible
                      key={property.id}
                      open={isExpanded}
                      onOpenChange={() =>
                        setExpandedPropertyId(isExpanded ? null : property.id)
                      }
                    >
                      <div className="rounded-lg border border-border hover:border-primary/30 transition-colors">
                        <div className="flex items-start gap-4 p-4">
                          <div
                            className={cn(
                              "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                              property.type === "house" && "bg-primary/10 text-primary",
                              property.type === "farm" && "bg-success/10 text-success",
                              property.type === "apartment" && "bg-accent/10 text-accent"
                            )}
                          >
                            <Home className="w-6 h-6" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                              <div>
                                <span
                                  className={cn(
                                    "badge-property mb-1",
                                    property.type === "house" && "badge-house",
                                    property.type === "farm" && "badge-farm",
                                    property.type === "apartment" && "badge-apartment"
                                  )}
                                >
                                  {propertyTypeLabels[property.type]}
                                </span>
                                <h3 className="font-medium text-foreground mt-1">
                                  {property.address}
                                </h3>
                                {property.purchase_date && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Purchased:{" "}
                                    {format(parseISO(property.purchase_date), "MMMM d, yyyy")}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <CollapsibleTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <FileText className="w-4 h-4 mr-1" />
                                    Documents
                                    {isExpanded ? (
                                      <ChevronUp className="w-4 h-4 ml-1" />
                                    ) : (
                                      <ChevronDown className="w-4 h-4 ml-1" />
                                    )}
                                  </Button>
                                </CollapsibleTrigger>
                                <Button variant="ghost" size="sm">
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                            {property.notes && (
                              <p className="text-sm text-muted-foreground mt-2">
                                {property.notes}
                              </p>
                            )}
                          </div>
                        </div>

                        <CollapsibleContent>
                          <div className="px-4 pb-4 border-t border-border pt-4 bg-muted/20">
                            <PropertyDocuments propertyId={property.id} />
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Home className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">No properties recorded yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Reminders Section */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Reminders</h2>
          </div>
          <div className="p-6">
            {reminders.length > 0 ? (
              <div className="space-y-3">
                {reminders.map((reminder) => (
                  <div
                    key={reminder.id}
                    className={cn(
                      "p-3 rounded-lg border border-border",
                      reminder.is_completed && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{reminder.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(reminder.reminder_date), "MMM d, yyyy")}
                      </span>
                    </div>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {reminder.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                No reminders for this client.
              </p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
