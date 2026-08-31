import React, { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { PersistentG } from "./components/PersistentG";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Invest = lazy(() => import("./pages/Invest"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const LenderNetwork = lazy(() => import("./pages/LenderNetwork"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const Contact = lazy(() => import("./pages/Contact"));
const SubmitDeal = lazy(() => import("./pages/SubmitDeal"));
const Sell = lazy(() => import("./pages/Sell"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminListings = lazy(() => import("./pages/admin/AdminListings"));
const AdminListingForm = lazy(() => import("./pages/admin/AdminListingForm"));
const AdminSubmissions = lazy(() => import("./pages/admin/AdminSubmissions"));

function RouteFallback() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center bg-[#070A0F] text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
      Loading OCG…
    </div>
  );
}

function AdminGuard({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdminAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) navigate("/admin/login");
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <Component />;
}

function Router() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/about" component={About} />
        <Route path="/services" component={Services} />
        <Route path="/invest" component={Invest} />
        <Route path="/strategies" component={Invest} />
        <Route path="/how-it-works" component={HowItWorks} />
        <Route path="/how-ocg-works" component={HowItWorks} />
        <Route path="/marketplace" component={Marketplace} />
        <Route path="/lender-network" component={LenderNetwork} />
        <Route path="/case-studies" component={CaseStudies} />
        <Route path="/contact" component={Contact} />
        <Route path="/submit-deal" component={SubmitDeal} />
        <Route path="/sell" component={Sell} />
        <Route path="/admin/login" component={AdminLogin} />
        <Route path="/admin">{() => <AdminGuard component={AdminListings} />}</Route>
        <Route path="/admin/listings/new">{() => <AdminGuard component={AdminListingForm} />}</Route>
        <Route path="/admin/listings/:id/edit">{() => <AdminGuard component={AdminListingForm} />}</Route>
        <Route path="/admin/submissions">{() => <AdminGuard component={AdminSubmissions} />}</Route>
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function PublicChrome() {
  const [location] = useLocation();
  if (location.startsWith("/admin")) return <Router />;

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100">
      <Navbar />
      <main className="pt-20"><Router /></main>
      <Footer />
      <PersistentG />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AdminAuthProvider>
          <TooltipProvider>
            <Toaster />
            <PublicChrome />
          </TooltipProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
