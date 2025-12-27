import { ReactNode, useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { DashboardSidebar } from "./DashboardSidebar";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import LoadingScreen from "@/components/LoadingScreen";
import logo from "@/assets/logo.png";

interface DashboardLayoutProps {
  children: ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingScreen message="Loading dashboard..." />;
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-xl border-b border-border flex items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <img src={logo} alt="Sympan" className="h-8 w-8 rounded-lg" />
          <span className="text-lg font-bold gradient-text">Sympan</span>
        </Link>
        
        <div className="flex items-center gap-2">
          <ThemeToggle variant="minimal" />
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72">
              <DashboardSidebar onNavigate={() => setIsMobileOpen(false)} />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <DashboardSidebar />
      </div>
      
      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        {children}
      </main>
    </div>
  );
};
