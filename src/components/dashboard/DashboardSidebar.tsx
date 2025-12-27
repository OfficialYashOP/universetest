import { Link, useLocation } from "react-router-dom";
import { 
  Home, 
  Users, 
  MessageSquare, 
  Building2, 
  BookOpen, 
  Store, 
  User,
  LogOut,
  BadgeCheck,
  Shield,
  MapPin,
  ShoppingBag,
  Briefcase,
  Compass,
  AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.png";

const navItems = [
  { icon: Home, label: "Feed", href: "/dashboard" },
  { icon: Compass, label: "Explore", href: "/explore" },
  { icon: Users, label: "Community", href: "/community" },
  { icon: MessageSquare, label: "Messages", href: "/messages" },
  { icon: Building2, label: "Housing", href: "/housing" },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: Briefcase, label: "Jobs", href: "/jobs" },
  { icon: BookOpen, label: "Resources", href: "/academic-resources" },
  { icon: Store, label: "Services", href: "/local-services" },
  { icon: MapPin, label: "LPU Campus Assist", href: "/lpu", highlight: true },
];

export const DashboardSidebar = () => {
  const location = useLocation();
  const { signOut } = useAuth();
  const { profile } = useProfile();

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
    <aside className="w-64 h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src={logo} alt="Sympan" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-bold gradient-text">Sympan</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href || 
            (item.href !== "/dashboard" && location.pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
                (item as any).highlight && !isActive && "bg-green-500/10 text-green-500 hover:bg-green-500/20"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Incomplete Profile Warning */}
      {profile && (!profile.full_name || !profile.bio || !profile.branch) && (
        <div className="mx-4 mb-2 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-medium text-amber-500">Incomplete Profile</p>
              <p className="text-xs text-amber-500/80">Complete your profile to unlock full experience</p>
              <Link to="/profile" className="text-xs text-amber-500 underline mt-1 inline-block">
                Complete now →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* User Section */}
      <div className="p-4 border-t border-sidebar-border space-y-2">
        <Link
          to="/profile"
          className={cn(
            "flex items-center gap-3 p-3 rounded-lg transition-all",
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

        {/* Verification Status */}
        {!profile?.is_verified && (
          <Link
            to="/profile?tab=verification"
            className="flex items-center gap-2 px-3 py-2 text-sm text-amber-400 bg-amber-400/10 rounded-lg hover:bg-amber-400/20 transition-colors"
          >
            <Shield className="w-4 h-4" />
            <span>Complete verification</span>
          </Link>
        )}

        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 w-full rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
