import { ReactNode } from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { MobileBottomNav } from "./MobileBottomNav";
import { TabletHeader } from "./TabletHeader";
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile";

interface LayoutProps {
  children: ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  // Tablet layout: horizontal header nav, no sidebar
  if (isTablet) {
    return (
      <div className="min-h-screen flex flex-col w-full bg-background">
        <TabletHeader />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6 max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    );
  }

  // Mobile layout: bottom nav, no sidebar
  // Desktop layout: sidebar with trigger
  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="min-h-screen flex w-full bg-background">
        {/* Desktop Sidebar - hidden on mobile */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>

        {/* Main Content Area */}
        <SidebarInset className="flex-1 flex flex-col min-h-screen">
          {/* Desktop Header with trigger */}
          <header className="hidden md:flex h-14 items-center gap-4 border-b border-border px-6 bg-card">
            <SidebarTrigger className="-ml-2" />
            <div className="flex-1" />
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            <div className="container mx-auto px-4 py-6 max-w-7xl pb-24 md:pb-6">
              {children}
            </div>
          </main>
        </SidebarInset>

        {/* Mobile Bottom Navigation */}
        {isMobile && <MobileBottomNav />}
      </div>
    </SidebarProvider>
  );
}
