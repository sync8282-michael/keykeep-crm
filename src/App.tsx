import { useState, useCallback, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SplashScreen } from "@/components/SplashScreen";
import { initializeSettings, db } from "@/db/database";
import DashboardLocal from "./pages/DashboardLocal";
import ClientsLocal from "./pages/ClientsLocal";
import ClientDetailLocal from "./pages/ClientDetailLocal";
import CalendarLocal from "./pages/CalendarLocal";
import SettingsLocal from "./pages/SettingsLocal";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [dbReady, setDbReady] = useState(false);

  // Initialize database and settings
  useEffect(() => {
    const init = async () => {
      await initializeSettings();
      
      // Apply saved theme
      const settings = await db.settings.get('app');
      if (settings?.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else if (settings?.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      }
      
      setDbReady(true);
    };
    init();
  }, []);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  if (!dbReady) {
    return null; // Wait for database initialization
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
        <div
          className={`transition-opacity duration-500 ${
            showSplash ? "opacity-0" : "opacity-100"
          }`}
        >
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<DashboardLocal />} />
              <Route path="/clients" element={<ClientsLocal />} />
              <Route path="/clients/new" element={<ClientsLocal />} />
              <Route path="/clients/:id" element={<ClientDetailLocal />} />
              <Route path="/calendar" element={<CalendarLocal />} />
              <Route path="/settings" element={<SettingsLocal />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
