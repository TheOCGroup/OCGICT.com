import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import HowItWorks from "./pages/HowItWorks";
import Marketplace from "./pages/Marketplace";
import LenderNetwork from "./pages/LenderNetwork";
import CaseStudies from "./pages/CaseStudies";
import Contact from "./pages/Contact";
import SubmitDeal from "./pages/SubmitDeal";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminListings from "./pages/admin/AdminListings";
import AdminListingForm from "./pages/admin/AdminListingForm";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import { useEffect } from "react";

// Protected route — redirects to /admin/login if not authenticated
function AdminGuard({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdminAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/admin/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/invest" component={Services} />
      <Route path="/strategies" component={Services} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/how-ocg-works" component={HowItWorks} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/lender-network" component={LenderNetwork} />
      <Route path="/case-studies" component={CaseStudies} />
      <Route path="/contact" component={Contact} />
      <Route path="/submit-deal" component={SubmitDeal} />
      <Route path="/sell" component={SubmitDeal} />

      {/* Admin routes */}
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">
        {() => <AdminGuard component={AdminListings} />}
      </Route>
      <Route path="/admin/listings/new">
        {() => <AdminGuard component={AdminListingForm} />}
      </Route>
      <Route path="/admin/listings/:id/edit">
        {() => <AdminGuard component={AdminListingForm} />}
      </Route>
      <Route path="/admin/submissions">
        {() => <AdminGuard component={AdminSubmissions} />}
      </Route>

      {/* Fallback */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AdminAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
