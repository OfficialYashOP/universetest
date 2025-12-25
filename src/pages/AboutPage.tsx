import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { 
  Target, 
  Eye, 
  Heart, 
  Shield, 
  Users, 
  Zap, 
  TrendingUp,
  GraduationCap,
  Building2,
  CheckCircle
} from "lucide-react";
import logo from "@/assets/logo.png";

const values = [
  { icon: Shield, title: "Trust", desc: "Verification-first approach ensuring genuine university members only" },
  { icon: Users, title: "Community", desc: "Building meaningful connections within campus ecosystems" },
  { icon: Zap, title: "Safety", desc: "Zero tolerance for scams, fraud, and harmful behavior" },
  { icon: TrendingUp, title: "Growth", desc: "Empowering students to help each other succeed" },
];

const problems = [
  { 
    title: "Scattered Groups", 
    desc: "Fragmented WhatsApp, Telegram, and Facebook groups with no verification" 
  },
  { 
    title: "Scams & Fraud", 
    desc: "Fake listings, impersonators, and unverified service providers" 
  },
  { 
    title: "Information Chaos", 
    desc: "Hard to find housing, notes, seniors, or reliable local services" 
  },
  { 
    title: "No Central Hub", 
    desc: "No single trusted platform for university community needs" 
  },
];

const AboutPage = () => {
  return (
    <PublicPageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-universe-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-universe-blue/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <img 
              src={logo} 
              alt="UniVerse" 
              className="w-24 h-24 mx-auto rounded-2xl shadow-glow mb-8" 
            />
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              About <span className="gradient-text">UniVerse</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              The digital campus for verified students. A secure, scam-free ecosystem where 
              university communities connect, collaborate, and thrive together.
            </p>
          </div>
        </div>
      </section>

      {/* What We Do */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h2 className="text-3xl font-bold">What is UniVerse?</h2>
            </div>
            <p className="text-lg text-muted-foreground leading-relaxed mb-6">
              UniVerse is a university-exclusive social platform that brings together verified students, 
              seniors, alumni, staff, and trusted local service providers. Think of it as your digital campus 
              — a single, trusted place for everything you need during your university journey.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Campus social feed & community",
                "Housing & roommate finder",
                "Academic resource marketplace",
                "Trusted local services directory",
                "Senior & alumni mentorship",
                "Secure 1-to-1 messaging",
              ].map((feature) => (
                <div key={feature} className="flex items-center gap-3 bg-muted rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 text-universe-cyan flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">The Problem We Solve</h2>
            <p className="text-muted-foreground mb-8">
              University life is amazing, but finding reliable information and trustworthy 
              connections shouldn't be this hard.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {problems.map((problem) => (
                <div 
                  key={problem.title}
                  className="bg-card border border-border rounded-xl p-5"
                >
                  <h3 className="font-semibold text-destructive mb-2">{problem.title}</h3>
                  <p className="text-sm text-muted-foreground">{problem.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-8">
            <div className="bg-gradient-to-br from-universe-blue/20 to-universe-purple/20 border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-8 h-8 text-universe-cyan" />
                <h3 className="text-2xl font-bold">Our Mission</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                To create a trusted digital ecosystem where university students can safely connect, 
                find resources, and help each other succeed — because <strong className="text-foreground">students 
                helping students</strong> is the most powerful support system.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-universe-purple/20 to-universe-pink/20 border border-border rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-8 h-8 text-universe-purple" />
                <h3 className="text-2xl font-bold">Our Vision</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                One trusted platform for every university. A world where every student has access 
                to verified community support, reliable local services, and genuine mentorship from 
                those who've walked the path before.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-8">
              <Heart className="w-8 h-8 text-universe-pink" />
              <h2 className="text-3xl font-bold">Our Values</h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {values.map((value) => (
                <div 
                  key={value.title}
                  className="bg-card border border-border rounded-xl p-5 hover:border-primary/50 transition-colors"
                >
                  <value.icon className="w-8 h-8 text-primary mb-3" />
                  <h3 className="font-semibold text-lg mb-2">{value.title}</h3>
                  <p className="text-sm text-muted-foreground">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Meet the Founder</h2>
            <div className="bg-gradient-to-br from-universe-blue/10 to-universe-purple/10 border border-border rounded-xl p-8">
              <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-universe-blue to-universe-purple flex items-center justify-center text-3xl font-bold text-white flex-shrink-0">
                  YP
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-bold mb-2">Yash Pandey</h3>
                  <p className="text-primary font-medium mb-3">Founder & Developer</p>
                  <p className="text-muted-foreground leading-relaxed mb-4">
                    A B.Tech Computer Science student at Lovely Professional University with a passion for 
                    Cyber Security and Software Development. Skilled in Java, Python, JavaScript, and Cloud Platforms, 
                    Yash founded UniVerse to solve the fragmented communication and trust issues 
                    in university communities.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                    <a 
                      href="https://linkedin.com/in/yashpandeyofficial007" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm hover:bg-muted/80 transition-colors"
                    >
                      LinkedIn
                    </a>
                    <a 
                      href="https://github.com/OfficialYashOp" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm hover:bg-muted/80 transition-colors"
                    >
                      GitHub
                    </a>
                    <a 
                      href="mailto:Pandey97828@gmail.com"
                      className="inline-flex items-center gap-2 bg-muted rounded-full px-4 py-2 text-sm hover:bg-muted/80 transition-colors"
                    >
                      Email
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Starting Point */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Building2 className="w-5 h-5" />
              <span className="font-medium">Now Live</span>
            </div>
            <h2 className="text-3xl font-bold mb-4">
              Starting with Lovely Professional University
            </h2>
            <p className="text-muted-foreground mb-8">
              We're launching UniVerse with LPU — one of India's largest private universities. 
              Our goal is to perfect the platform here before expanding to universities across the country and beyond.
            </p>
            <p className="text-sm text-muted-foreground">
              Want UniVerse at your university?{" "}
              <a href="/contact" className="text-primary hover:underline">Get in touch</a>
            </p>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default AboutPage;
