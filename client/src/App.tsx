import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/app-layout";
import { AuthLayout } from "@/components/layout/auth-layout";
import { ProtectedRoute } from "@/components/ui/protected-route";
import Dashboard from "@/pages/dashboard";
import Composer from "@/pages/composer";
import Connections from "@/pages/connections";
import Scheduled from "@/pages/scheduled";
import Settings from "@/pages/settings";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Landing from "@/pages/landing";
import Subscribe from "@/pages/subscribe";
import Billing from "@/pages/billing";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      {/* Landing page */}
      <Route path="/" component={Landing} />
      
      {/* Auth routes */}
      <Route path="/login">
        <AuthLayout>
          <Login />
        </AuthLayout>
      </Route>
      <Route path="/register">
        <AuthLayout>
          <Register />
        </AuthLayout>
      </Route>
      <Route path="/subscribe" component={Subscribe} />
      
      <Route path="/billing">
        <ProtectedRoute>
          <AppLayout>
            <Billing />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Protected app routes */}
      <Route path="/dashboard">
        <ProtectedRoute>
          <AppLayout>
            <Dashboard />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/compose">
        <ProtectedRoute>
          <AppLayout>
            <Composer />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/connections">
        <ProtectedRoute>
          <AppLayout>
            <Connections />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/scheduled">
        <ProtectedRoute>
          <AppLayout>
            <Scheduled />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <AppLayout>
            <Settings />
          </AppLayout>
        </ProtectedRoute>
      </Route>
      
      {/* Fallback to 404 */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
