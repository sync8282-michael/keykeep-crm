import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Plus, Search as SearchIcon } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ClientCard } from "@/components/clients/ClientCard";
import { ClientForm, ClientFormData } from "@/components/forms/ClientForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Client, Property } from "@/types";
import { getClients, getProperties, saveClients, generateId } from "@/lib/store";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setClients(getClients());
    setProperties(getProperties());
  }, []);

  const filteredClients = clients.filter((client) =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    client.phone.includes(searchQuery)
  );

  const handleCreateClient = (data: ClientFormData) => {
    const newClient: Client = {
      id: generateId(),
      name: data.name,
      email: data.email,
      phone: data.phone,
      birthday: data.birthday ? format(data.birthday, "yyyy-MM-dd") : undefined,
      notes: data.notes,
      createdAt: format(new Date(), "yyyy-MM-dd"),
    };

    const updatedClients = [...clients, newClient];
    setClients(updatedClients);
    saveClients(updatedClients);
    setShowForm(false);
  };

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
                    client={client}
                    properties={properties.filter((p) => p.clientId === client.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  {searchQuery ? "No clients match your search." : "No clients yet. Add your first client to get started."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
