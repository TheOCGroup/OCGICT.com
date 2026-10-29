import { MotionConfig } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { PersistentG } from "./components/PersistentG";
import { GExperience } from "./components/GExperience";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AdminAuthProvider, useAdminAuth } from "./contexts/AdminAuthContext";
import { Home } from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Invest from "./pages/Invest";
import HowItWorks from "./pages/HowItWorks";
import Marketplace from "./pages/Marketplace";
import LenderNetwork from "./pages/LenderNetwork";
import CaseStudies from "./pages/CaseStudies";
import Contact from "./pages/Contact";
import SubmitDeal from "./pages/SubmitDeal";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import { Sell } from "./pages/Sell";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminListings from "./pages/admin/AdminListings";
import AdminListingForm from "./pages/admin/AdminListingForm";
import AdminSubmissions from "./pages/admin/AdminSubmissions";
import { useEffect } from "react";

function AdminGuard({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated } = useAdminAuth();
  const [, navigate] = useLocation();
  useEffect(() => { if (!isAuthenticated) navigate("/admin/login"); }, [isAuthenticated, navigate]);
  if (!isAuthenticated) return null;
  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/g">{() => <GExperience />}</Route>
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/invest" component={Invest} />
      <Route path="/strategies" component={Services} />
      <Route path="/how-it-works" component={HowItWorks} />
      <Route path="/how-ocg-works" component={HowItWorks} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/lender-network" component={LenderNetwork} />
      <Route path="/case-studies" component={CaseStudies} />
      <Route path="/contact" component={Contact} />
      <Route path="/submit-deal" component={SubmitDeal} />
      <Route path="/sell" component={Sell} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin">{() => <AdminGuard component={AdminListings} />}</Route>
      <Route path="/admin/listings/new">{() => <AdminGuard component={AdminListingForm} />}</Route>
      <Route path="/admin/listings/:id/edit">{() => <AdminGuard component={AdminListingForm} />}</Route>
      <Route path="/admin/submissions">{() => <AdminGuard component={AdminSubmissions} />}</Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

const PAGE_TITLES: Record<string, string> = {
  "/": "The OC Group — Real Estate Investment, Acquisition & Consulting | Wichita, KS",
  "/g": "Talk to G — The OC Group Assistant",
  "/about": "About — The OC Group | Wichita, KS",
  "/services": "Services — The OC Group",
  "/invest": "Invest — The OC Group",
  "/strategies": "Investment Strategies — The OC Group",
  "/how-it-works": "How It Works — The OC Group",
  "/how-ocg-works": "How It Works — The OC Group",
  "/marketplace": "Marketplace — The OC Group",
  "/lender-network": "Lender Network — The OC Group",
  "/case-studies": "Case Studies — The OC Group",
  "/contact": "Contact — The OC Group",
  "/submit-deal": "Submit a Deal — The OC Group",
  "/sell": "Sell Your Property — The OC Group | Wichita, KS",
  "/privacy": "Privacy Policy — The OC Group",
  "/terms": "Terms — The OC Group",
};

function PublicChrome() {
  const [location] = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }); }, [location]);
  useEffect(() => {
    document.title = PAGE_TITLES[location] ?? "The OC Group | Wichita, KS";
  }, [location]);
  if (location.startsWith("/admin")) return <Router />;
  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100">
      <Navbar />
      <main className="pt-20"><Router /></main>
      <Footer />
      {location !== "/g" && <PersistentG />}
    </div>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user"><ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <AdminAuthProvider>
          <TooltipProvider>
            <Toaster />
            <PublicChrome />
          </TooltipProvider>
        </AdminAuthProvider>
      </ThemeProvider>
    </ErrorBoundary></MotionConfig>
  );
}

export default App;

