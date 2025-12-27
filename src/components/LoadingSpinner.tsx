import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  message?: string;
}

const LoadingSpinner = ({ size = "md", message }: LoadingSpinnerProps) => {
  const sizes = {
    sm: { logo: "h-8 w-8", container: "gap-2", text: "text-xs" },
    md: { logo: "h-12 w-12", container: "gap-3", text: "text-sm" },
    lg: { logo: "h-16 w-16", container: "gap-4", text: "text-base" },
  };

  return (
    <div className={`flex flex-col items-center justify-center ${sizes[size].container}`}>
      <div className="relative">
        {/* Glow effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-universe-purple to-universe-cyan rounded-xl blur-lg"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        
        {/* Spinning ring */}
        <motion.div
          className="absolute inset-0 rounded-xl border-2 border-transparent"
          style={{
            borderTopColor: "hsl(var(--universe-purple))",
            borderRightColor: "hsl(var(--universe-cyan))",
          }}
          animate={{ rotate: 360 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            ease: "linear",
          }}
        />
        
        {/* Logo */}
        <motion.img
          src={logo}
          alt="Loading"
          className={`${sizes[size].logo} rounded-xl relative z-10`}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      
      {message && (
        <motion.p
          className={`text-muted-foreground ${sizes[size].text}`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {message}
        </motion.p>
      )}
    </div>
  );
};

export default LoadingSpinner;
