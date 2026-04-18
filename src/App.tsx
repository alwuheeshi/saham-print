import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import OrdersList from "@/pages/OrdersList";
import OrderForm from "@/pages/OrderForm";
import OrderDetails from "@/pages/OrderDetails";
import InvoicePage from "@/pages/InvoicePage";
import Debts from "@/pages/Debts";
import CustomersPage from "@/pages/CustomersPage";
import ServicesSettings from "@/pages/ServicesSettings";
import BackupPage from "@/pages/BackupPage";
import ReportsPage from "@/pages/ReportsPage";
import ChangePassword from "@/pages/ChangePassword";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import { getAuthStatus } from "@/lib/database";

const queryClient = new QueryClient();

const App = () => {
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let cancelled = false;

    getAuthStatus()
      .then(status => {
        if (!cancelled) setAuthenticated(status.authenticated);
      })
      .catch(error => {
        console.error(error);
        if (!cancelled) setAuthenticated(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingAuth(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (loadingAuth) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
            جاري التحميل...
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!authenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <LoginPage onAuthenticated={() => setAuthenticated(true)} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner />
        <BrowserRouter>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<OrdersList />} />
              <Route path="/orders/new" element={<OrderForm />} />
              <Route path="/orders/:id" element={<OrderDetails />} />
              <Route path="/orders/:id/edit" element={<OrderForm />} />
              <Route path="/orders/:id/invoice" element={<InvoicePage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/debts" element={<Debts />} />
              <Route path="/reports" element={<ReportsPage />} />
              <Route path="/services" element={<ServicesSettings />} />
              <Route path="/backup" element={<BackupPage />} />
              <Route path="/change-password" element={<ChangePassword />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
