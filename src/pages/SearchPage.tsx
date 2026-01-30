import { useState, useMemo } from "react";
import { format, parseISO } from "date-fns";
import { Search as SearchIcon, User, Home, Bell } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClientCard } from "@/components/clients/ClientCard";
import { ReminderCard } from "@/components/dashboard/ReminderCard";
import { useClients } from "@/hooks/useClients";
import { useProperties } from "@/hooks/useProperties";
import { useReminders } from "@/hooks/useReminders";
import { cn } from "@/lib/utils";
import { ClientsSkeleton } from "@/components/skeletons/PageSkeletons";

const propertyTypeLabels: Record<string, string> = {
  house: "House",
  farm: "Farm",
  apartment: "Apartment",
};

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const { data: reminders = [], isLoading: remindersLoading } = useReminders();

  const isLoading = clientsLoading || propertiesLoading || remindersLoading;

  const results = useMemo(() => {
    if (!searchQuery.trim()) {
      return { clients: [], properties: [], reminders: [] };
    }

    const query = searchQuery.toLowerCase();

    const filteredClients = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query)) ||
        (c.phone && c.phone.includes(query))
    );

    const filteredProperties = properties.filter(
      (p) =>
        p.address.toLowerCase().includes(query) ||
        p.type.toLowerCase().includes(query)
    );

    const filteredReminders = reminders.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
    );

    return {
      clients: filteredClients,
      properties: filteredProperties,
      reminders: filteredReminders,
    };
  }, [searchQuery, clients, properties, reminders]);

  const totalResults =
    results.clients.length + results.properties.length + results.reminders.length;

  const getClientById = (id: string) => clients.find((c) => c.id === id);
  const getPropertyById = (id: string) => properties.find((p) => p.id === id);

  if (isLoading) {
    return (
      <Layout>
        <ClientsSkeleton />
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Search</h1>
          <p className="text-muted-foreground">
            Find clients, properties, and reminders.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative max-w-2xl">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, address, email, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 text-lg"
            autoFocus
          />
        </div>

        {/* Results */}
        {searchQuery.trim() && (
          <div className="card-elevated">
            <div className="p-6 border-b border-border">
              <p className="text-muted-foreground">
                {totalResults} {totalResults === 1 ? "result" : "results"} for "{searchQuery}"
              </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="px-6 pt-4 border-b border-border overflow-x-auto">
                <TabsList>
                  <TabsTrigger value="all" className="gap-2">
                    All ({totalResults})
                  </TabsTrigger>
                  <TabsTrigger value="clients" className="gap-2">
                    <User className="w-4 h-4" />
                    Clients ({results.clients.length})
                  </TabsTrigger>
                  <TabsTrigger value="properties" className="gap-2">
                    <Home className="w-4 h-4" />
                    Properties ({results.properties.length})
                  </TabsTrigger>
                  <TabsTrigger value="reminders" className="gap-2">
                    <Bell className="w-4 h-4" />
                    Reminders ({results.reminders.length})
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="all" className="p-6 space-y-6">
                {results.clients.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Clients
                    </h3>
                    <div className="grid gap-3">
                      {results.clients.map((client) => (
                        <ClientCard
                          key={client.id}
                          client={{
                            id: client.id,
                            name: client.name,
                            email: client.email || "",
                            phone: client.phone || "",
                            birthday: client.birthday || undefined,
                            notes: client.notes || undefined,
                            createdAt: client.created_at,
                          }}
                          properties={properties
                            .filter((p) => p.client_id === client.id)
                            .map((p) => ({
                              id: p.id,
                              clientId: p.client_id,
                              type: p.type,
                              address: p.address,
                              purchaseDate: p.purchase_date || undefined,
                              purchasePrice: p.purchase_price || undefined,
                              createdAt: p.created_at,
                            }))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {results.properties.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Home className="w-4 h-4" />
                      Properties
                    </h3>
                    <div className="grid gap-3">
                      {results.properties.map((property) => {
                        const client = getClientById(property.client_id);
                        return (
                          <div
                            key={property.id}
                            className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={cn(
                                  "w-10 h-10 rounded-lg flex items-center justify-center",
                                  property.type === "house" && "bg-primary/10 text-primary",
                                  property.type === "farm" && "bg-success/10 text-success",
                                  property.type === "apartment" && "bg-accent/10 text-accent"
                                )}
                              >
                                <Home className="w-5 h-5" />
                              </div>
                              <div>
                                <span
                                  className={cn(
                                    "badge-property",
                                    property.type === "house" && "badge-house",
                                    property.type === "farm" && "badge-farm",
                                    property.type === "apartment" && "badge-apartment"
                                  )}
                                >
                                  {propertyTypeLabels[property.type]}
                                </span>
                                <h4 className="font-medium text-foreground mt-1">
                                  {property.address}
                                </h4>
                                {client && (
                                  <p className="text-sm text-muted-foreground">
                                    Owner: {client.name}
                                  </p>
                                )}
                                {property.purchase_date && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Purchased: {format(parseISO(property.purchase_date), "MMM d, yyyy")}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {results.reminders.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      Reminders
                    </h3>
                    <div className="grid gap-3">
                      {results.reminders.map((reminder) => {
                        const client = getClientById(reminder.client_id);
                        const property = reminder.property_id
                          ? getPropertyById(reminder.property_id)
                          : undefined;
                        return (
                          <ReminderCard
                            key={reminder.id}
                            reminder={{
                              id: reminder.id,
                              clientId: reminder.client_id,
                              propertyId: reminder.property_id || undefined,
                              type: reminder.type,
                              title: reminder.title,
                              description: reminder.description || undefined,
                              baseDate: reminder.base_date,
                              reminderDate: reminder.reminder_date,
                              channel: reminder.channel,
                              isRecurring: reminder.is_recurring,
                              isCompleted: reminder.is_completed,
                              createdAt: reminder.created_at,
                            }}
                            client={
                              client
                                ? {
                                    id: client.id,
                                    name: client.name,
                                    email: client.email || "",
                                    phone: client.phone || "",
                                    createdAt: client.created_at,
                                  }
                                : undefined
                            }
                            property={
                              property
                                ? {
                                    id: property.id,
                                    clientId: property.client_id,
                                    type: property.type,
                                    address: property.address,
                                    createdAt: property.created_at,
                                  }
                                : undefined
                            }
                          />
                        );
                      })}
                    </div>
                  </div>
                )}

                {totalResults === 0 && (
                  <div className="text-center py-12">
                    <SearchIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">No results found.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="clients" className="p-6">
                {results.clients.length > 0 ? (
                  <div className="grid gap-3">
                    {results.clients.map((client) => (
                      <ClientCard
                        key={client.id}
                        client={{
                          id: client.id,
                          name: client.name,
                          email: client.email || "",
                          phone: client.phone || "",
                          birthday: client.birthday || undefined,
                          notes: client.notes || undefined,
                          createdAt: client.created_at,
                        }}
                        properties={properties
                          .filter((p) => p.client_id === client.id)
                          .map((p) => ({
                            id: p.id,
                            clientId: p.client_id,
                            type: p.type,
                            address: p.address,
                            purchaseDate: p.purchase_date || undefined,
                            purchasePrice: p.purchase_price || undefined,
                            createdAt: p.created_at,
                          }))}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No clients found.</p>
                )}
              </TabsContent>

              <TabsContent value="properties" className="p-6">
                {results.properties.length > 0 ? (
                  <div className="grid gap-3">
                    {results.properties.map((property) => {
                      const client = getClientById(property.client_id);
                      return (
                        <div
                          key={property.id}
                          className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors"
                        >
                          <div className="flex items-start gap-4">
                            <div
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center",
                                property.type === "house" && "bg-primary/10 text-primary",
                                property.type === "farm" && "bg-success/10 text-success",
                                property.type === "apartment" && "bg-accent/10 text-accent"
                              )}
                            >
                              <Home className="w-5 h-5" />
                            </div>
                            <div>
                              <span
                                className={cn(
                                  "badge-property",
                                  property.type === "house" && "badge-house",
                                  property.type === "farm" && "badge-farm",
                                  property.type === "apartment" && "badge-apartment"
                                )}
                              >
                                {propertyTypeLabels[property.type]}
                              </span>
                              <h4 className="font-medium text-foreground mt-1">
                                {property.address}
                              </h4>
                              {client && (
                                <p className="text-sm text-muted-foreground">
                                  Owner: {client.name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No properties found.</p>
                )}
              </TabsContent>

              <TabsContent value="reminders" className="p-6">
                {results.reminders.length > 0 ? (
                  <div className="grid gap-3">
                    {results.reminders.map((reminder) => {
                      const client = getClientById(reminder.client_id);
                      const property = reminder.property_id
                        ? getPropertyById(reminder.property_id)
                        : undefined;
                      return (
                        <ReminderCard
                          key={reminder.id}
                          reminder={{
                            id: reminder.id,
                            clientId: reminder.client_id,
                            propertyId: reminder.property_id || undefined,
                            type: reminder.type,
                            title: reminder.title,
                            description: reminder.description || undefined,
                            baseDate: reminder.base_date,
                            reminderDate: reminder.reminder_date,
                            channel: reminder.channel,
                            isRecurring: reminder.is_recurring,
                            isCompleted: reminder.is_completed,
                            createdAt: reminder.created_at,
                          }}
                          client={
                            client
                              ? {
                                  id: client.id,
                                  name: client.name,
                                  email: client.email || "",
                                  phone: client.phone || "",
                                  createdAt: client.created_at,
                                }
                              : undefined
                          }
                          property={
                            property
                              ? {
                                  id: property.id,
                                  clientId: property.client_id,
                                  type: property.type,
                                  address: property.address,
                                  createdAt: property.created_at,
                                }
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-12">No reminders found.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery.trim() && (
          <div className="card-elevated">
            <div className="text-center py-16">
              <SearchIcon className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Start searching</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Search for clients by name, email, or phone. Find properties by address or type. Look
                up reminders by title.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
