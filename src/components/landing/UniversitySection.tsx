import { motion } from "framer-motion";
import { MapPin, Users, Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import lpuLogo from "@/assets/lpu-logo.png";
const universities = [
  {
    name: "Lovely Professional University",
    shortName: "LPU",
    location: "Phagwara, Punjab",
    students: "2,500+",
    verified: true,
    featured: true,
  },
  {
    name: "Delhi University",
    shortName: "DU",
    location: "Delhi",
    students: "Coming Soon",
    verified: false,
  },
  {
    name: "IIT Delhi",
    shortName: "IITD",
    location: "Delhi",
    students: "Coming Soon",
    verified: false,
  },
  {
    name: "BITS Pilani",
    shortName: "BITS",
    location: "Pilani, Rajasthan",
    students: "Coming Soon",
    verified: false,
  },
];

const UniversitySection = () => {
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
          {universities.map((uni, index) => (
            <motion.div
              key={uni.shortName}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div 
                className={`relative h-full p-6 rounded-2xl border transition-all duration-300 hover-lift ${
                  uni.featured 
                    ? "bg-gradient-card border-primary/30 shadow-glow" 
                    : "bg-card border-border opacity-70"
                }`}
              >
                {uni.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-primary text-xs font-medium text-primary-foreground">
                    Now Live
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center overflow-hidden">
                    {uni.shortName === "LPU" ? (
                      <img src={lpuLogo} alt="LPU" className="w-10 h-10 object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{uni.shortName}</h3>
                    <p className="text-sm text-muted-foreground truncate max-w-[120px]">{uni.name}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{uni.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="w-4 h-4 text-universe-cyan" />
                    <span className={uni.verified ? "text-foreground font-medium" : "text-muted-foreground"}>
                      {uni.students}
                    </span>
                  </div>
                </div>

                {uni.featured && (
                  <Link to="/auth?mode=signup" className="block mt-4">
                    <Button variant="hero" size="sm" className="w-full">
                      Join LPU Community
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          ))}
        </div>

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
