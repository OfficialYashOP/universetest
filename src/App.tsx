import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { UniversityThemeProvider } from "@/hooks/useUniversityTheme";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import VerifyPage from "./pages/VerifyPage";
import SelectUniversityPage from "./pages/SelectUniversityPage";
import Dashboard from "./pages/Dashboard";
import UniversityDashboard from "./pages/UniversityDashboard";
import ProfilePage from "./pages/ProfilePage";
import CommunityPage from "./pages/CommunityPage";
import MessagesPage from "./pages/MessagesPage";
import HousingPage from "./pages/HousingPage";
import LocalServicesPage from "./pages/LocalServicesPage";
import AcademicResourcesPage from "./pages/AcademicResourcesPage";
import MarketplacePage from "./pages/MarketplacePage";
import JobsPage from "./pages/JobsPage";
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
import RequestUniversityPage from "./pages/RequestUniversityPage";

// Auth Pages
import StudentAuthPage from "./pages/auth/StudentAuthPage";
import PartnerAuthPage from "./pages/auth/PartnerAuthPage";

// Partner Pages
import PartnersLandingPage from "./pages/partners/PartnersLandingPage";
import PartnerDashboard from "./pages/partners/PartnerDashboard";

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
      <UniversityThemeProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/auth/student" element={<StudentAuthPage />} />
              <Route path="/auth/partner" element={<PartnerAuthPage />} />
              <Route path="/auth/verify" element={<VerifyPage />} />
              <Route path="/select-university" element={<SelectUniversityPage />} />
              
              {/* Partner Routes */}
              <Route path="/partners" element={<PartnersLandingPage />} />
              <Route path="/partners/dashboard" element={<PartnerDashboard />} />
              
              {/* Protected App Routes */}
              <Route path="/app/university/:slug" element={
                <ProtectedRoute>
                  <UniversityDashboard />
                </ProtectedRoute>
              } />
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } />
              <Route path="/community" element={
                <ProtectedRoute>
                  <CommunityPage />
                </ProtectedRoute>
              } />
              <Route path="/messages" element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              } />
              <Route path="/housing" element={
                <ProtectedRoute>
                  <HousingPage />
                </ProtectedRoute>
              } />
              <Route path="/academic-resources" element={
                <ProtectedRoute>
                  <AcademicResourcesPage />
                </ProtectedRoute>
              } />
              <Route path="/local-services" element={
                <ProtectedRoute>
                  <LocalServicesPage />
                </ProtectedRoute>
              } />
              <Route path="/marketplace" element={
                <ProtectedRoute>
                  <MarketplacePage />
                </ProtectedRoute>
              } />
              <Route path="/jobs" element={
                <ProtectedRoute>
                  <JobsPage />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              
              {/* LPU Campus Assist (Protected) */}
              <Route path="/lpu" element={
                <ProtectedRoute>
                  <LPUCampusAssist />
                </ProtectedRoute>
              } />
              <Route path="/lpu/emergency" element={
                <ProtectedRoute>
                  <LPUEmergency />
                </ProtectedRoute>
              } />
              <Route path="/lpu/hostels" element={
                <ProtectedRoute>
                  <LPUHostels />
                </ProtectedRoute>
              } />
              <Route path="/lpu/health-centre" element={
                <ProtectedRoute>
                  <LPUHealthCentre />
                </ProtectedRoute>
              } />
              <Route path="/lpu/map" element={
                <ProtectedRoute>
                  <LPUCampusMap />
                </ProtectedRoute>
              } />
              
              {/* Public Pages */}
              <Route path="/about" element={<AboutPage />} />
              <Route path="/faq" element={<FAQPage />} />
              <Route path="/careers" element={<CareersPage />} />
              <Route path="/blog" element={<BlogPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/request-university" element={<RequestUniversityPage />} />
              
              {/* Legal Pages */}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/cookies" element={<CookiePolicy />} />
              <Route path="/disclaimer" element={<LegalDisclaimer />} />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </UniversityThemeProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
