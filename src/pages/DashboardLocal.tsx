import { useState } from "react";
import { differenceInYears, parseISO } from "date-fns";
import { Users, Calendar, Plus, Home, Mail, MessageCircle, Cake, Bell } from "lucide-react";
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
              Welcome to KeyKeep Pro — your client anniversary tracker.
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
            variant="default"
          />
          <StatsCard
            title="Reminders This Month"
            value={stats.remindersThisMonth}
            icon={Bell}
            variant="default"
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
                      className="flex items-start gap-4 p-4 rounded-lg border border-border hover:border-primary/30 hover:bg-muted/30 transition-all"
                    >
                      {client.imagePath ? (
                        <img
                          src={client.imagePath}
                          alt={client.address}
                          className="w-20 h-16 object-cover rounded-lg flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-16 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Home className="w-6 h-6 text-primary" />
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-foreground truncate">
                              {client.name}
                            </h3>
                            <p className="text-sm text-muted-foreground truncate">
                              {client.address}
                            </p>
                          </div>
                          <span className={cn(
                            "badge-property flex-shrink-0",
                            client.houseType === "house" && "badge-house",
                            client.houseType === "farm" && "badge-farm",
                            client.houseType === "apartment" && "badge-apartment",
                            !["house", "farm", "apartment"].includes(client.houseType) && "bg-secondary text-secondary-foreground"
                          )}>
                            {client.houseType}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                          <span>{yearsOwned} year{yearsOwned !== 1 ? "s" : ""} owned</span>
                          {client.optInEmail && (
                            <Mail className="w-3.5 h-3.5 text-primary" />
                          )}
                          {client.optInWhatsApp && (
                            <MessageCircle className="w-3.5 h-3.5 text-success" />
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
