import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import CompleteProfile from "./pages/Profile";
import Browse from "./pages/Browse";
import SeatSelection from "./pages/SeatSelection";
import Booking from "./pages/Booking";
import Dashboard from "./pages/Dashboard";
import AdminAuth from "./pages/AdminAuth";
import AdminSignup from "./pages/AdminSignup";
import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import Payment from "./pages/Payment";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/profile" element={<CompleteProfile />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/seat-selection/:busId" element={<SeatSelection />} />
          <Route path="/booking/:busId" element={<Booking />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/admin" element={<AdminAuth />} />
          <Route path="/kyahaalhaibrosabbadhiyapadhailikhaikaisachllrhahai" element={<AdminSignup />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
