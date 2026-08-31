import React, { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import { PersistentG } from "./components/PersistentG";
import { ThemeProvider } from "./contexts/ThemeContext";

const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Invest = lazy(() => import("./pages/Invest"));
const HowItWorks = lazy(() => import("./pages/HowItWorks"));
const Marketplace = lazy(() => import("./pages/Marketplace"));
const LenderNetwork = lazy(() => import("./pages/LenderNetwork"));
const CaseStudies = lazy(() => import("./pages/CaseStudies"));
const Contact = lazy(() => import("./pages/Contact"));
const Sell = lazy(() => import("./pages/Sell"));
const NotFound = lazy(() => import("./pages/NotFound"));

function RouteFallback() {
  return (
    <div className="flex min-h-[55vh] items-center justify-center bg-[#070A0F] text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
      Loading OCG…
    </div>
  );
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
        <Route path="/submit-deal" component={Sell} />
        <Route path="/sell" component={Sell} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <div className="min-h-screen bg-[#070A0F] text-slate-100">
            <Navbar />
            <main className="pt-20"><Router /></main>
            <Footer />
            <PersistentG />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
