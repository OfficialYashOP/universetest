import { Lock, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface EncryptionBadgeProps {
  variant?: "small" | "default";
  verified?: boolean;
  className?: string;
}

export function EncryptionBadge({ variant = "default", verified = false, className }: EncryptionBadgeProps) {
  if (variant === "small") {
    return (
      <span className={cn("text-xs text-muted-foreground flex items-center gap-1", className)}>
        <Lock className="w-3 h-3" />
        Encrypted
      </span>
    );
  }

  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium",
      verified 
        ? "bg-green-500/10 text-green-600 dark:text-green-400"
        : "bg-primary/10 text-primary",
      className
    )}>
      {verified ? (
        <>
          <ShieldCheck className="w-3.5 h-3.5" />
          Verified
        </>
      ) : (
        <>
          <Lock className="w-3.5 h-3.5" />
          End-to-End Encrypted
        </>
      )}
    </div>
  );
}
