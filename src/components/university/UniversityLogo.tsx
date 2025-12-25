import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UniversityLogoProps {
  logoUrl?: string | null;
  name: string;
  shortName?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showFallback?: boolean;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-12 h-12",
  lg: "w-16 h-16",
  xl: "w-24 h-24",
};

const iconSizes = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
};

const UniversityLogo = ({
  logoUrl,
  name,
  shortName,
  size = "md",
  className,
  showFallback = true,
}: UniversityLogoProps) => {
  if (logoUrl) {
    return (
      <div
        className={cn(
          "rounded-xl bg-white flex items-center justify-center overflow-hidden p-1",
          sizeClasses[size],
          className
        )}
      >
        <img
          src={logoUrl}
          alt={`${name} logo`}
          className="w-full h-full object-contain"
          loading="lazy"
        />
      </div>
    );
  }

  if (!showFallback) return null;

  return (
    <div
      className={cn(
        "rounded-xl bg-muted flex items-center justify-center",
        sizeClasses[size],
        className
      )}
    >
      {shortName ? (
        <span className="font-bold text-muted-foreground text-xs">
          {shortName.slice(0, 3)}
        </span>
      ) : (
        <Building2 className={cn("text-muted-foreground", iconSizes[size])} />
      )}
    </div>
  );
};

export default UniversityLogo;
