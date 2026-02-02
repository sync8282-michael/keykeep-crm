import { useState } from "react";
import { differenceInYears, parseISO, format } from "date-fns";
import { Users, Calendar, Plus, Home, Mail, MessageCircle, Cake, Bell, Phone } from "lucide-react";
import { Layout } from "@/components/layout/Layout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import { useDashboardStats } from "@/hooks/useDashboardLocal";
import { useClientSearch } from "@/hooks/useLocalClients";
import { DashboardSkeleton } from "@/components/skeletons/PageSkeletons";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardLocal() {
  const [searchQuery, setSearchQuery] = useState("");
  const { stats, recentClients, isLoading } = useDashboardStats();
  const { clients: searchResults } = useClientSearch(searchQuery);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <Layout>
        <DashboardSkeleton />
      </Layout>
    );
  }

  const displayClients = searchQuery ? searchResults : recentClients;

  return (
    <Layout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome to KeyKeep — your client anniversary tracker.
            </p>
          </div>
          <Button onClick={() => navigate("/clients/new")}>
            <Plus className="w-4 h-4 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatsCard
            title="Total Clients"
            value={stats.totalClients}
            icon={Users}
            variant="primary"
          />
          <StatsCard
            title="Anniversaries This Month"
            value={stats.anniversariesThisMonth}
            icon={Calendar}
            variant="warning"
          />
          <StatsCard
            title="Birthdays This Month"
            value={stats.birthdaysThisMonth}
            icon={Cake}
            variant="success"
          />
          <StatsCard
            title="Reminders This Month"
            value={stats.remindersThisMonth}
            icon={Bell}
            variant="primary"
          />
        </div>

        {/* Global Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search clients by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Recent Activity / Search Results */}
        <div className="card-elevated">
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                {searchQuery ? "Search Results" : "Recent Activity"}
              </h2>
              <Button variant="outline" size="sm" asChild>
                <Link to="/clients">View All</Link>
              </Button>
            </div>
          </div>
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
                        <div className="flex-1 min-w-0 flex flex-col justify-center py-0.5">
                          <h3 className="font-semibold text-foreground text-base group-hover:text-primary transition-colors truncate">
                            {client.name}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {client.address}
                          </p>
                          
                          {/* Info row with details */}
                          <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-4 h-4" />
                              <span>{yearsOwned} yr{yearsOwned !== 1 ? "s" : ""}</span>
                            </div>
                            {client.phone && (
                              <div className="flex items-center gap-1.5">
                                <Phone className="w-4 h-4" />
                                <span>{client.phone}</span>
                              </div>
                            )}
                            {client.birthday && (
                              <div className="flex items-center gap-1.5">
                                <Cake className="w-4 h-4" />
                                <span>{format(parseISO(client.birthday), "MMM d")}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Contact preferences - Right side */}
                        <div className="flex flex-col items-end justify-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-2">
                            {client.optInEmail && (
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 hover:bg-primary/20 transition-colors">
                                <Mail className="w-4 h-4 text-primary" />
                              </div>
                            )}
                            {client.optInWhatsApp && (
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-success/10 hover:bg-success/20 transition-colors">
                                <MessageCircle className="w-4 h-4 text-success" />
                              </div>
                            )}
                            {client.optInSMS && (
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 transition-colors">
                                <Phone className="w-4 h-4 text-orange-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">
                  {searchQuery ? "No clients found" : "No clients yet"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery
                    ? "Try a different search term."
                    : "Add your first client to get started."}
                </p>
                {!searchQuery && (
                  <Button asChild>
                    <Link to="/clients/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Client
                    </Link>
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
