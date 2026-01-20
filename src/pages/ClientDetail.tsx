import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { ArrowLeft, User, Mail, Phone, Calendar, Home, Plus, Edit, Trash2 } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { PropertyForm, PropertyFormData } from "@/components/forms/PropertyForm";
import { Button } from "@/components/ui/button";
import { Client, Property, Reminder } from "@/types";
import {
  getClients,
  getProperties,
  getReminders,
  saveProperties,
  generateId,
} from "@/lib/store";
import { cn } from "@/lib/utils";

const propertyTypeLabels = {
  house: "House",
  farm: "Farm",
  apartment: "Apartment",
  plot: "Plot",
};

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showPropertyForm, setShowPropertyForm] = useState(false);

  useEffect(() => {
    const clients = getClients();
    const foundClient = clients.find((c) => c.id === id);
    if (!foundClient) {
      navigate("/clients");
      return;
    }
    setClient(foundClient);

    const allProperties = getProperties();
    setProperties(allProperties.filter((p) => p.clientId === id));

    const allReminders = getReminders();
    setReminders(allReminders.filter((r) => r.clientId === id));
  }, [id, navigate]);

  const handleCreateProperty = (data: PropertyFormData) => {
    if (!client) return;

    const newProperty: Property = {
      id: generateId(),
      clientId: client.id,
      type: data.type,
      address: data.address,
      purchaseDate: format(data.purchaseDate, "yyyy-MM-dd"),
      notes: data.notes,
      createdAt: format(new Date(), "yyyy-MM-dd"),
    };

    const allProperties = getProperties();
    const updatedProperties = [...allProperties, newProperty];
    saveProperties(updatedProperties);
    setProperties([...properties, newProperty]);
    setShowPropertyForm(false);
  };

  if (!client) return null;

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
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-primary" />
            </div>

            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
                  <p className="text-muted-foreground">Client since {format(parseISO(client.createdAt), "MMMM yyyy")}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4 mr-1" />
                    Edit
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{client.phone}</span>
                </div>
                {client.birthday && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-4 h-4" />
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
              />
            </div>
          )}

          <div className="p-6">
            {properties.length > 0 ? (
              <div className="grid gap-4">
                {properties.map((property) => (
                  <div
                    key={property.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className={cn(
                      "w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0",
                      property.type === "house" && "bg-primary/10 text-primary",
                      property.type === "farm" && "bg-success/10 text-success",
                      property.type === "apartment" && "bg-accent/10 text-accent",
                      property.type === "plot" && "bg-muted text-muted-foreground"
                    )}>
                      <Home className="w-6 h-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={cn(
                            "badge-property mb-1",
                            property.type === "house" && "badge-house",
                            property.type === "farm" && "badge-farm",
                            property.type === "apartment" && "badge-apartment",
                            property.type === "plot" && "bg-muted text-muted-foreground"
                          )}>
                            {propertyTypeLabels[property.type]}
                          </span>
                          <h3 className="font-medium text-foreground mt-1">{property.address}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Purchased: {format(parseISO(property.purchaseDate), "MMMM d, yyyy")}
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                      {property.notes && (
                        <p className="text-sm text-muted-foreground mt-2">{property.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
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
                      reminder.isCompleted && "opacity-60"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{reminder.title}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(reminder.reminderDate), "MMM d, yyyy")}
                      </span>
                    </div>
                    {reminder.description && (
                      <p className="text-sm text-muted-foreground mt-1">{reminder.description}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No reminders for this client.</p>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
