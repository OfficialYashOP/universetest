import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Briefcase, 
  Home, 
  Utensils, 
  ShoppingBag,
  ArrowRight,
  CheckCircle,
  Users,
  TrendingUp,
  Shield,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

const PARTNER_BENEFITS = [
  {
    icon: Users,
    title: "Verified Student Audience",
    description: "Reach thousands of verified university students actively looking for services.",
  },
  {
    icon: Shield,
    title: "Trusted Platform",
    description: "Your listings appear on a scam-free, university-verified platform.",
  },
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Get direct inquiries from students through our seamless contact system.",
  },
  {
    icon: Star,
    title: "Build Reputation",
    description: "Collect reviews and build trust within the university community.",
  },
];

const PARTNER_TYPES = [
  {
    icon: Home,
    title: "Housing Providers",
    description: "List PG accommodations, hostels, flats, and rooms near universities.",
    features: ["PG listings", "Flat rentals", "Hostel alternatives", "Room sharing"],
  },
  {
    icon: Briefcase,
    title: "Job Posters",
    description: "Post part-time jobs, internships, and freelance opportunities.",
    features: ["Part-time jobs", "Internships", "Freelance work", "Campus jobs"],
  },
  {
    icon: Utensils,
    title: "Restaurants & Cafes",
    description: "Promote your food business to hungry students nearby.",
    features: ["Restaurant listings", "Cafe promotions", "Delivery services", "Student discounts"],
  },
  {
    icon: ShoppingBag,
    title: "Local Services",
    description: "Offer laundry, repair, stationery, and other essential services.",
    features: ["Laundry services", "Repair shops", "Stationery", "Essential services"],
  },
];

const PartnersLandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="UniVerse" className="h-8 w-8 rounded-lg" />
            <span className="font-bold gradient-text">UniVerse Partners</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth/partner?mode=login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth/partner?mode=signup">
              <Button variant="hero">Become a Partner</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-hero" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-universe-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-universe-blue/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6">
              <Briefcase className="w-4 h-4 text-primary" />
              <span className="text-sm text-primary font-medium">UniVerse Partners Program</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Reach Thousands of
              <span className="block gradient-text">Verified Students</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Partner with UniVerse to promote your housing, jobs, and services 
              directly to verified university students across India.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/auth/partner?mode=signup">
                <Button variant="hero" size="lg" className="gap-2">
                  Become a Partner
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/auth/partner?mode=login">
                <Button variant="outline" size="lg">
                  Partner Sign In
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Why Partner with UniVerse?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Join hundreds of businesses reaching verified students through our trusted platform.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PARTNER_BENEFITS.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Types Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Who Can Partner?</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We welcome businesses that serve university students with essential services.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8">
            {PARTNER_TYPES.map((type, index) => (
              <motion.div
                key={type.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <type.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{type.title}</h3>
                    <p className="text-muted-foreground text-sm mb-4">{type.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {type.features.map((feature) => (
                        <span
                          key={feature}
                          className="inline-flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded-full"
                        >
                          <CheckCircle className="w-3 h-3 text-primary" />
                          {feature}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-card/50">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Get started in 3 simple steps.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Register", description: "Create your partner account with business details and documents." },
              { step: "2", title: "Get Verified", description: "Our team reviews your application within 24-48 hours." },
              { step: "3", title: "Start Posting", description: "Once approved, start posting your listings to reach students." },
            ].map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="text-center"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="glass-card p-8 md:p-12 text-center max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold mb-4">Ready to Grow Your Business?</h2>
            <p className="text-muted-foreground mb-8">
              Join UniVerse Partners today and start reaching verified students.
            </p>
            <Link to="/auth/partner?mode=signup">
              <Button variant="hero" size="lg" className="gap-2">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src={logo} alt="UniVerse" className="h-6 w-6 rounded" />
            <span className="text-sm text-muted-foreground">© 2024 UniVerse Partners</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/terms" className="hover:text-foreground">Terms</Link>
            <Link to="/privacy" className="hover:text-foreground">Privacy</Link>
            <Link to="/contact" className="hover:text-foreground">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PartnersLandingPage;
