import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteLayout } from "@/components/SiteLayout";
import Home from "./pages/Home";
import InsuranceAnalysis from "./pages/InsuranceAnalysis";
import Businesses from "./pages/Businesses";
import BrokerOwners from "./pages/BrokerOwners";
import Partners from "./pages/Partners";
import Investors from "./pages/Investors";
import Platform from "./pages/Platform";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SiteLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/insurance-analysis" element={<InsuranceAnalysis />} />
            <Route path="/businesses" element={<Businesses />} />
            <Route path="/broker-owners" element={<BrokerOwners />} />
            <Route path="/partners" element={<Partners />} />
            <Route path="/platform" element={<Platform />} />
            <Route path="/investors" element={<Investors />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SiteLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
