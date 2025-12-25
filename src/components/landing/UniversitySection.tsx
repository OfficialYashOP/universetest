import { motion } from "framer-motion";
import { MapPin, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import UniversityLogo from "@/components/university/UniversityLogo";
import { useUniversities } from "@/hooks/useUniversities";
import { Skeleton } from "@/components/ui/skeleton";

const UniversitySection = () => {
  const { data: universities, isLoading } = useUniversities();

  return (
    <section id="universities" className="py-24 relative overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-universe-purple/10 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-universe-purple text-sm font-medium uppercase tracking-wider">
            University Network
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            Find <span className="gradient-text">Your Campus</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Join your university's exclusive community. Starting with LPU, 
            we're expanding to campuses across India.
          </p>
        </motion.div>

        {/* Universities Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {isLoading ? (
            // Loading skeletons
            Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="p-6 rounded-2xl border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Skeleton className="w-12 h-12 rounded-xl" />
                  <div>
                    <Skeleton className="h-5 w-16 mb-1" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))
          ) : (
            universities?.map((uni, index) => (
              <motion.div
                key={uni.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <div 
                  className={`group relative h-full p-6 rounded-2xl border transition-all duration-300 hover-lift ${
                    uni.is_active 
                      ? "bg-gradient-card border-primary/30 shadow-glow" 
                      : "bg-card border-border hover:border-border/80"
                  }`}
                >
                  {uni.is_active && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-xs font-medium text-primary-foreground">
                      Now Live
                    </div>
                  )}
                  
                  <div className="flex items-center gap-3 mb-4">
                    <UniversityLogo
                      logoUrl={uni.logo_url}
                      name={uni.name}
                      shortName={uni.short_name || undefined}
                      size="md"
                      className="transition-transform group-hover:scale-105"
                    />
                    <div>
                      <h3 className="font-semibold text-lg">{uni.short_name || uni.name}</h3>
                      <p className="text-sm text-muted-foreground truncate max-w-[120px]" title={uni.name}>
                        {uni.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{uni.location || "India"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-universe-cyan flex-shrink-0" />
                      <span className={uni.is_active ? "text-foreground font-medium" : "text-muted-foreground"}>
                        {uni.is_active ? "2,500+ Students" : "Coming Soon"}
                      </span>
                    </div>
                  </div>

                  {uni.is_active ? (
                    <Link to="/auth?mode=signup" className="block mt-4">
                      <Button variant="hero" size="sm" className="w-full">
                        Join {uni.short_name || "Community"}
                      </Button>
                    </Link>
                  ) : (
                    <div className="mt-4 text-center">
                      <span className="text-xs text-muted-foreground">
                        Launching soon
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Trademark Disclaimer */}
        <p className="text-center text-xs text-muted-foreground mb-8">
          University logos are trademarks of their respective institutions.
        </p>

        {/* Request University CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 p-6 rounded-2xl bg-muted/50 border border-border">
            <p className="text-muted-foreground">
              Don't see your university?
            </p>
            <Button variant="outline" className="group">
              Request Your Campus
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default UniversitySection;
