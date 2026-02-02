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
                      className="group flex items-stretch gap-5 p-4 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
                    >
                      {/* Profile Picture - Square */}
                      <div className="relative flex-shrink-0">
                        {client.avatarPath ? (
                          <img
                            src={client.avatarPath}
                            alt={client.name}
                            className="w-20 h-20 object-cover rounded-xl"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                            <span className="text-primary font-bold text-xl">
                              {client.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                        )}
                        {/* Property type indicator */}
                        <div className={cn(
                          "absolute -bottom-1 -right-1 w-6 h-6 rounded-md flex items-center justify-center shadow-sm",
                          client.houseType === "house" && "bg-blue-500",
                          client.houseType === "farm" && "bg-green-500",
                          client.houseType === "apartment" && "bg-purple-500",
                          !["house", "farm", "apartment"].includes(client.houseType) && "bg-secondary"
                        )}>
                          <Home className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>

                      {/* Client Info */}
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors">
                            {client.name}
                          </h3>
                        </div>
                        <p className="text-sm text-muted-foreground truncate mt-0.5">
                          {client.address}
                        </p>
                        
                        {/* Info row with details */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2.5 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-primary/70" />
                            <span>{yearsOwned} yr{yearsOwned !== 1 ? "s" : ""}</span>
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3.5 h-3.5 text-primary/70" />
                              <span>{client.phone}</span>
                            </div>
                          )}
                          {client.birthday && (
                            <div className="flex items-center gap-1">
                              <Cake className="w-3.5 h-3.5 text-primary/70" />
                              <span>{format(parseISO(client.birthday), "MMM d")}</span>
                            </div>
                          )}
                        </div>

                        {/* Contact preferences */}
                        <div className="flex items-center gap-1.5 mt-2">
                          {client.optInEmail && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10">
                              <Mail className="w-3 h-3 text-primary" />
                            </div>
                          )}
                          {client.optInWhatsApp && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-success/10">
                              <MessageCircle className="w-3 h-3 text-success" />
                            </div>
                          )}
                          {client.optInSMS && (
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-orange-500/10">
                              <Phone className="w-3 h-3 text-orange-500" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Property Image on the right */}
                      {client.imagePath && (
                        <div className="hidden sm:block flex-shrink-0">
                          <img
                            src={client.imagePath}
                            alt={client.address}
                            className="w-24 h-20 object-cover rounded-lg"
                          />
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
