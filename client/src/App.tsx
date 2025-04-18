import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect } from "wouter";
import TransactionsPage from "./pages/transactions-page";
import BudgetsPage from "./pages/budgets-page";
import GoalsPage from "./pages/goals-page";
import RemindersPage from "./pages/reminders-page";
import SettingsPage from "./pages/settings-page";

// Protected component wrapper
function Protected({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/auth" />;
  }

  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/">
        <Protected>
          <HomePage />
        </Protected>
      </Route>
      <Route path="/transactions">
        <Protected>
          <TransactionsPage />
        </Protected>
      </Route>
      <Route path="/budgets">
        <Protected>
          <BudgetsPage />
        </Protected>
      </Route>
      <Route path="/goals">
        <Protected>
          <GoalsPage />
        </Protected>
      </Route>
      <Route path="/reminders">
        <Protected>
          <RemindersPage />
        </Protected>
      </Route>
      <Route path="/settings">
        <Protected>
          <SettingsPage />
        </Protected>
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </AuthProvider>
  );
}

export default App;