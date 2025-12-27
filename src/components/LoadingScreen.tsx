import { motion } from "framer-motion";
import logo from "@/assets/logo.png";

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

const LoadingScreen = ({ message = "Loading...", fullScreen = true }: LoadingScreenProps) => {
  return (
    <div 
      className={`flex flex-col items-center justify-center bg-background ${
        fullScreen ? "fixed inset-0 z-50" : "min-h-[400px]"
      }`}
    >
      {/* Animated Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-universe-purple/20 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-universe-cyan/20 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Logo Container */}
      <div className="relative z-10">
        {/* Outer Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-universe-purple/30"
          style={{ margin: "-20px" }}
          animate={{
            rotate: 360,
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 8, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
          }}
        />
        
        {/* Middle Ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-universe-cyan/40"
          style={{ margin: "-10px" }}
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        {/* Glowing Pulse Behind Logo */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-universe-purple to-universe-cyan rounded-2xl blur-xl"
          animate={{
            opacity: [0.3, 0.6, 0.3],
            scale: [0.8, 1.1, 0.8],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative"
        >
          <motion.img
            src={logo}
            alt="Sympan"
            className="h-20 w-20 rounded-2xl relative z-10"
            animate={{
              y: [0, -8, 0],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>

      {/* Brand Name */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mt-8 relative z-10"
      >
        <span className="text-2xl font-bold gradient-text">Sympan</span>
      </motion.div>

      {/* Loading Dots */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-2 mt-4 relative z-10"
      >
        {[0, 1, 2].map((index) => (
          <motion.div
            key={index}
            className="w-2 h-2 rounded-full bg-gradient-to-r from-universe-purple to-universe-cyan"
            animate={{
              y: [0, -8, 0],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: index * 0.15,
              ease: "easeInOut",
            }}
          />
        ))}
      </motion.div>

      {/* Message */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-muted-foreground text-sm mt-4 relative z-10"
      >
        {message}
      </motion.p>
    </div>
  );
};

export default LoadingScreen;
