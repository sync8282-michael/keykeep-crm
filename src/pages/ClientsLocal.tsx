import { useState } from "react";
import { Plus, Search as SearchIcon, Home, Mail, MessageCircle, Phone, Calendar, Cake } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { ClientFormLocal } from "@/components/forms/ClientFormLocal";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClientsSkeleton } from "@/components/skeletons/PageSkeletons";
import { useLocalClients, useClientMutations, useClientSearch } from "@/hooks/useLocalClients";
import { Link } from "react-router-dom";
import { format, parseISO, differenceInYears } from "date-fns";
import { cn } from "@/lib/utils";

export default function ClientsLocal() {
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { clients: allClients, isLoading } = useLocalClients();
  const { clients: searchResults } = useClientSearch(searchQuery);
  const { createClient } = useClientMutations();

  const displayClients = searchQuery ? searchResults : allClients;

  const handleCreateClient = async (data: Parameters<typeof createClient>[0]) => {
    setIsSubmitting(true);
    try {
      await createClient(data);
      setShowForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <ClientFormLocal
            onSubmit={handleCreateClient}
            onCancel={() => setShowForm(false)}
            isLoading={isSubmitting}
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
            {displayClients.length > 0 ? (
              <div className="grid gap-4">
                {displayClients.map((client) => {
                  const yearsOwned = client.moveInDate
                    ? differenceInYears(new Date(), parseISO(client.moveInDate))
                    : 0;

                  return (
                    <Link
                      key={client.id}
                      to={`/clients/${client.id}`}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                    >
                      {/* Profile Picture */}
                      <Avatar className="h-14 w-14 flex-shrink-0">
                        {client.avatarPath ? (
                          <AvatarImage src={client.avatarPath} alt={client.name} />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                          {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      {/* Client Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground truncate">
                            {client.name}
                          </h3>
                          <span className={cn(
                            "badge-property flex-shrink-0 text-xs",
                            client.houseType === "house" && "badge-house",
                            client.houseType === "farm" && "badge-farm",
                            client.houseType === "apartment" && "badge-apartment",
                            !["house", "farm", "apartment"].includes(client.houseType) && "bg-secondary text-secondary-foreground"
                          )}>
                            {client.houseType}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {client.address}
                        </p>
                        
                        {/* Info row with details */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{yearsOwned} year{yearsOwned !== 1 ? "s" : ""} owned</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.birthday && (
                            <div className="flex items-center gap-1.5">
                              <Cake className="w-3.5 h-3.5" />
                              <span>{format(parseISO(client.birthday), "MMM d")}</span>
                            </div>
                          )}
                        </div>

                        {/* Contact preferences */}
                        <div className="flex items-center gap-2 mt-2">
                          {client.optInEmail && (
                            <div className="flex items-center gap-1 text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                              <Mail className="w-3 h-3" />
                              <span>Email</span>
                            </div>
                          )}
                          {client.optInWhatsApp && (
                            <div className="flex items-center gap-1 text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                              <MessageCircle className="w-3 h-3" />
                              <span>WhatsApp</span>
                            </div>
                          )}
                          {client.optInSMS && (
                            <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-500/10 px-2 py-0.5 rounded-full">
                              <Phone className="w-3 h-3" />
                              <span>SMS</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Property Image on the right */}
                      {client.imagePath ? (
                        <img
                          src={client.imagePath}
                          alt={client.address}
                          className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                  );
                })}
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
