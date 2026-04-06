import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import AppLayout from "@/components/AppLayout";
import Dashboard from "@/pages/Dashboard";
import OrdersList from "@/pages/OrdersList";
import OrderForm from "@/pages/OrderForm";
import OrderDetails from "@/pages/OrderDetails";
import Debts from "@/pages/Debts";
import ServicesSettings from "@/pages/ServicesSettings";
import ChangePassword from "@/pages/ChangePassword";
import NotFound from "@/pages/NotFound";
import LoginPage, { isAuthenticated } from "@/pages/LoginPage";

const queryClient = new QueryClient();

const App = () => {
  if (!isAuthenticated()) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <LoginPage />
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
              <Route path="/debts" element={<Debts />} />
              <Route path="/services" element={<ServicesSettings />} />
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
