import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import ProfilePage from "./pages/ProfilePage";
import CommunityPage from "./pages/CommunityPage";
import MessagesPage from "./pages/MessagesPage";
import HousingPage from "./pages/HousingPage";
import LocalServicesPage from "./pages/LocalServicesPage";
import AcademicResourcesPage from "./pages/AcademicResourcesPage";
import AdminDashboard from "./pages/AdminDashboard";
import AboutPage from "./pages/AboutPage";
import FAQPage from "./pages/FAQPage";
import CareersPage from "./pages/CareersPage";
import BlogPage from "./pages/BlogPage";
import ContactPage from "./pages/ContactPage";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy";
import TermsOfService from "./pages/legal/TermsOfService";
import CookiePolicy from "./pages/legal/CookiePolicy";
import LegalDisclaimer from "./pages/legal/LegalDisclaimer";
import NotFound from "./pages/NotFound";
// LPU Campus Assist Pages
import LPUCampusAssist from "./pages/lpu/LPUCampusAssist";
import LPUEmergency from "./pages/lpu/LPUEmergency";
import LPUHostels from "./pages/lpu/LPUHostels";
import LPUHealthCentre from "./pages/lpu/LPUHealthCentre";
import LPUCampusMap from "./pages/lpu/LPUCampusMap";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/community" element={<CommunityPage />} />
            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/housing" element={<HousingPage />} />
            <Route path="/academic-resources" element={<AcademicResourcesPage />} />
            <Route path="/local-services" element={<LocalServicesPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* LPU Campus Assist */}
            <Route path="/lpu" element={<LPUCampusAssist />} />
            <Route path="/lpu/emergency" element={<LPUEmergency />} />
            <Route path="/lpu/hostels" element={<LPUHostels />} />
            <Route path="/lpu/health-centre" element={<LPUHealthCentre />} />
            <Route path="/lpu/map" element={<LPUCampusMap />} />
            {/* Public Pages */}
            <Route path="/about" element={<AboutPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/careers" element={<CareersPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/contact" element={<ContactPage />} />
            {/* Legal Pages */}
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/cookies" element={<CookiePolicy />} />
            <Route path="/disclaimer" element={<LegalDisclaimer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
