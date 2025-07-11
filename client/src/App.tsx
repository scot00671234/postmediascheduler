import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthLayout } from "@/components/layout/auth-layout";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Subscribe from "@/pages/subscribe";
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
