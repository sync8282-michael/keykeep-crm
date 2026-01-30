import { useState } from "react";
import { format } from "date-fns";
import { Plus, Search as SearchIcon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientForm, ClientFormData } from "@/components/forms/ClientForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientsSkeleton } from "@/components/skeletons/PageSkeletons";
import { useClients, useCreateClient } from "@/hooks/useClients";
import { useProperties } from "@/hooks/useProperties";

export default function Clients() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: clients = [], isLoading: clientsLoading } = useClients();
  const { data: properties = [], isLoading: propertiesLoading } = useProperties();
  const createClient = useCreateClient();

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email && client.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.phone && client.phone.includes(searchQuery))
  );

  const handleCreateClient = async (data: ClientFormData) => {
    await createClient.mutateAsync({
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      birthday: data.birthday ? format(data.birthday, "yyyy-MM-dd") : null,
      notes: data.notes || null,
    });
    setShowForm(false);
  };

  if (clientsLoading || propertiesLoading) {
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Clients</h1>
            <p className="text-muted-foreground">
              Manage your client database.
            </p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Add Client Form */}
        {showForm && (
          <ClientForm
            onSubmit={handleCreateClient}
            onCancel={() => setShowForm(false)}
            isLoading={createClient.isPending}
          />
        )}

        {/* Search */}
        <div className="relative max-w-md">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Clients List */}
        <div className="card-elevated">
          <div className="p-6">
            {filteredClients.length > 0 ? (
              <div className="grid gap-3">
                {filteredClients.map((client) => (
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
                        notes: p.notes || undefined,
                        createdAt: p.created_at,
                      }))}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery
                    ? "No clients match your search."
                    : "No clients yet. Add your first client to get started."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
