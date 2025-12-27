import { motion } from "framer-motion";
import { 
  MessageCircle, 
  Home, 
  BookOpen, 
  Utensils, 
  Users, 
  Shield,
  GraduationCap,
  Heart
} from "lucide-react";

const features = [
  {
    icon: MessageCircle,
    title: "Campus Feed",
    description: "Share posts, ask questions anonymously, and stay updated with your university community.",
    color: "universe-blue",
  },
  {
    icon: Home,
    title: "Housing Finder",
    description: "Find verified PGs, hostels, and roommates near your campus with trusted listings.",
    color: "universe-purple",
  },
  {
    icon: BookOpen,
    title: "Academic Resources",
    description: "Buy, sell, or share books, notes, and study materials with fellow students.",
    color: "universe-cyan",
  },
  {
    icon: Utensils,
    title: "Local Services",
    description: "Discover trusted restaurants, cafes, laundry, and essential services near campus.",
    color: "universe-pink",
  },
  {
    icon: Users,
    title: "Mentorship",
    description: "Connect with seniors and alumni for guidance, career advice, and mentorship.",
    color: "universe-blue",
  },
  {
    icon: Shield,
    title: "Trusted Network",
    description: "A secure community where every user is part of your university ecosystem.",
    color: "universe-purple",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-universe-cyan text-sm font-medium uppercase tracking-wider">
            Everything You Need
          </span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mt-3 mb-4">
            One Platform, <span className="gradient-text">Endless Possibilities</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            From finding your perfect roommate to connecting with alumni mentors, 
            Sympan has everything to make campus life easier.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group"
            >
              <div className="h-full p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 hover-lift">
                <div className={`w-12 h-12 rounded-xl bg-${feature.color}/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-card border border-border">
            <Heart className="w-5 h-5 text-universe-pink" />
            <span className="text-muted-foreground">
              Loved by <span className="text-foreground font-semibold">10,000+</span> students across India
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default FeaturesSection;
