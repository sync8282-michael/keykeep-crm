import { format, parseISO } from "date-fns";
import { User, Mail, Phone, Calendar, ChevronRight } from "lucide-react";
import { Client, Property } from "@/types";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface ClientCardProps {
  client: Client;
  properties: Property[];
}

const propertyTypeLabels = {
  house: "House",
  farm: "Farm",
  apartment: "Apartment",
  plot: "Plot",
};

export function ClientCard({ client, properties }: ClientCardProps) {
  return (
    <Link 
      to={`/clients/${client.id}`}
      className="card-elevated p-4 block hover:shadow-lg transition-shadow duration-200 group"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <User className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {client.name}
            </h3>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Mail className="w-4 h-4" />
              {client.email}
            </span>
            <span className="flex items-center gap-1">
              <Phone className="w-4 h-4" />
              {client.phone}
            </span>
          </div>

          {properties.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {properties.map((property) => (
                <span
                  key={property.id}
                  className={cn(
                    "badge-property",
                    property.type === "house" && "badge-house",
                    property.type === "farm" && "badge-farm",
                    property.type === "apartment" && "badge-apartment",
                    property.type === "plot" && "bg-muted text-muted-foreground"
                  )}
                >
                  {propertyTypeLabels[property.type]}
                </span>
              ))}
            </div>
          )}

          {client.birthday && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Birthday: {format(parseISO(client.birthday), "MMMM d")}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
