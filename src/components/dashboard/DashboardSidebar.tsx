import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, BadgeCheck, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserSearchModal } from "@/components/search/UserSearchModal";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import logo from "@/assets/logo.png";

// Import custom PNG icons
import offrecordIcon from "@/assets/icons/offrecord.png";
import flexuIcon from "@/assets/icons/flexu.png";
import trendingIcon from "@/assets/icons/trending.png";
import chatIcon from "@/assets/icons/chat.png";
import housingIcon from "@/assets/icons/housing.png";
import marketplaceIcon from "@/assets/icons/marketplace.png";
import jobsIcon from "@/assets/icons/jobs.png";
import resourcesIcon from "@/assets/icons/resources.png";
import servicesIcon from "@/assets/icons/services.png";
import lpuCampusAssistIcon from "@/assets/icons/lpu-campus-assist.png";

const navItems = [
  { icon: offrecordIcon, label: "OffRecord", href: "/offrecord" },
  { icon: flexuIcon, label: "FlexU", href: "/flexu" },
  { icon: trendingIcon, label: "Trending", href: "/trending" },
  { icon: chatIcon, label: "Chat", href: "/chat" },
  { icon: housingIcon, label: "Housing", href: "/housing" },
  { icon: marketplaceIcon, label: "Marketplace", href: "/marketplace" },
  { icon: jobsIcon, label: "Jobs", href: "/jobs" },
  { icon: resourcesIcon, label: "Resources", href: "/academic-resources" },
  { icon: servicesIcon, label: "Services", href: "/local-services" },
  { icon: lpuCampusAssistIcon, label: "LPU Campus Assist", href: "/lpu", highlight: true },
];

interface DashboardSidebarProps {
  onNavigate?: () => void;
}

export const DashboardSidebar = ({ onNavigate }: DashboardSidebarProps) => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile } = useProfile();
  const [showUserSearch, setShowUserSearch] = useState(false);

  const handleNavClick = () => {
    onNavigate?.();
  };

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getRoleBadgeColor = (role: string | undefined) => {
    switch (role) {
      case "alumni": return "bg-universe-purple/20 text-universe-purple border-universe-purple/30";
      case "senior": return "bg-universe-cyan/20 text-universe-cyan border-universe-cyan/30";
      case "staff": return "bg-universe-pink/20 text-universe-pink border-universe-pink/30";
      default: return "bg-primary/20 text-primary border-primary/30";
    }
  };

  return (
    <TooltipProvider delayDuration={150}>
      <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
        {/* Logo - Hidden on mobile since we have header */}
        <div className="p-6 border-b border-sidebar-border hidden lg:block">
          <Link to="/dashboard" className="flex items-center gap-3" onClick={handleNavClick}>
            <img src={logo} alt="Sympan" className="h-10 w-10 rounded-lg" />
            <span className="text-xl font-bold gradient-text">Sympan</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {/* User Search Button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setShowUserSearch(true)}
                className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 cursor-pointer"
              >
                <Search className="w-5 h-5" />
                <span className="font-medium">Find People</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border border-border shadow-lg z-50">
              <p>Search for users</p>
            </TooltipContent>
          </Tooltip>
          
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
              (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
            const isHighlight = (item as any).highlight;
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group cursor-pointer",
                      "will-change-transform",
                      isActive 
                        ? "bg-primary/10 shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]" 
                        : "hover:bg-muted/60",
                      isHighlight && !isActive && "bg-green-500/5 hover:bg-green-500/10"
                    )}
                  >
                    {/* Icon Container with hover effects */}
                    <div className={cn(
                      "relative w-10 h-10 rounded-xl overflow-hidden flex-shrink-0",
                      "transition-all duration-200 ease-out",
                      "group-hover:scale-105 group-hover:shadow-lg",
                      isActive 
                        ? "shadow-[0_0_16px_-2px_hsl(var(--primary)/0.4)] scale-105" 
                        : "group-hover:shadow-[0_0_12px_-2px_hsl(var(--primary)/0.25)]",
                      isHighlight && "group-hover:shadow-[0_0_12px_-2px_hsl(142_76%_36%/0.3)]"
                    )}>
                      <img 
                        src={item.icon} 
                        alt={item.label}
                        loading="lazy"
                        decoding="async"
                        className={cn(
                          "w-full h-full object-cover",
                          "transition-all duration-200 ease-out",
                          "group-hover:brightness-110",
                          isActive && "brightness-110"
                        )}
                      />
                    </div>
                    
                    {/* Label */}
                    <span className={cn(
                      "font-medium transition-colors duration-200",
                      isActive 
                        ? "text-primary" 
                        : "text-muted-foreground group-hover:text-foreground",
                      isHighlight && !isActive && "text-green-500"
                    )}>
                      {item.label}
                    </span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-popover border border-border shadow-lg z-50">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          {/* Theme Toggle - Only show on desktop */}
          <div className="hidden lg:flex justify-end mb-2">
            <ThemeToggle variant="minimal" />
          </div>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                to="/profile"
                onClick={handleNavClick}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-all duration-200 cursor-pointer",
                  location.pathname === "/profile"
                    ? "bg-primary/10"
                    : "hover:bg-muted"
                )}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-universe-blue to-universe-purple text-white">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {profile?.username ? `@${profile.username}` : profile?.full_name || "User"}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={cn("text-xs capitalize", getRoleBadgeColor(profile?.role))}>
                      {profile?.role || "student"}
                    </Badge>
                    {profile?.is_verified && (
                      <BadgeCheck className="w-4 h-4 text-universe-cyan" />
                    )}
                  </div>
                </div>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border border-border shadow-lg z-50">
              <p>View your profile</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  signOut();
                  handleNavClick();
                }}
                className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200 cursor-pointer"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Sign Out</span>
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="bg-popover border border-border shadow-lg z-50">
              <p>Sign out of your account</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* User Search Modal */}
        <UserSearchModal 
          isOpen={showUserSearch} 
          onClose={() => setShowUserSearch(false)} 
        />
      </aside>
    </TooltipProvider>
  );
};
