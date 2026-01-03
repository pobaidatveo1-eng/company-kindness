import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Tasks from "./pages/Tasks";
import Departments from "./pages/Departments";
import DelayedTasks from "./pages/DelayedTasks";
import LoadBalance from "./pages/LoadBalance";
import TeamSettings from "./pages/TeamSettings";
import CompanySettings from "./pages/CompanySettings";
import AIInsights from "./pages/AIInsights";
import Events from "./pages/Events";
import ManualItems from "./pages/ManualItems";
import MyAccount from "./pages/MyAccount";
import TeamManagement from "./pages/TeamManagement";
import Employees from "./pages/Employees";
import DashboardLayout from "./components/layout/DashboardLayout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="tasks" element={<Tasks />} />
                  <Route path="departments" element={<Departments />} />
                  <Route path="delayed" element={<DelayedTasks />} />
                  <Route path="balance" element={<LoadBalance />} />
                  <Route path="team" element={<TeamSettings />} />
                  <Route path="settings" element={<CompanySettings />} />
                  <Route path="ai-insights" element={<AIInsights />} />
                  <Route path="events" element={<Events />} />
                  <Route path="manual" element={<ManualItems />} />
                  <Route path="account" element={<MyAccount />} />
                  <Route path="team-management" element={<TeamManagement />} />
                  <Route path="employees" element={<Employees />} />
                </Route>
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
