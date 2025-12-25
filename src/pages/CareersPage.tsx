import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { 
  Rocket, 
  Heart, 
  Users, 
  Zap, 
  Code, 
  Palette, 
  MessageSquare, 
  GraduationCap,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";

const openRoles = [
  {
    title: "Frontend Developer",
    type: "Full-time",
    location: "Remote",
    description: "Build beautiful, responsive interfaces using React and TypeScript."
  },
  {
    title: "Backend Developer",
    type: "Full-time",
    location: "Remote",
    description: "Design and implement scalable APIs and database systems."
  },
  {
    title: "UI/UX Designer",
    type: "Full-time",
    location: "Remote",
    description: "Create intuitive, student-friendly experiences across web and mobile."
  },
  {
    title: "Community Manager",
    type: "Part-time",
    location: "Remote",
    description: "Build and nurture our university communities, handle support, and gather feedback."
  },
  {
    title: "Campus Ambassador",
    type: "Part-time / Internship",
    location: "On Campus",
    description: "Represent UniVerse at your university, onboard students, and grow our community."
  },
];

const perks = [
  { icon: Rocket, title: "Impact", desc: "Directly help thousands of students" },
  { icon: Zap, title: "Growth", desc: "Learn fast in a startup environment" },
  { icon: Heart, title: "Culture", desc: "Collaborative, supportive team" },
  { icon: Users, title: "Flexibility", desc: "Remote-first, async-friendly" },
];

const CareersPage = () => {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-universe-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-universe-cyan/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">We're Hiring</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Build the Future of <span className="gradient-text">Student Communities</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Join our mission to create safe, connected university ecosystems. 
              Help millions of students find housing, resources, and genuine connections.
            </p>
          </div>
        </div>
      </section>

      {/* Why Join */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Join UniVerse?</h2>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {perks.map((perk) => (
                <div 
                  key={perk.title}
                  className="bg-card border border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors"
                >
                  <perk.icon className="w-10 h-10 text-primary mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">{perk.title}</h3>
                  <p className="text-sm text-muted-foreground">{perk.desc}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-12 bg-gradient-to-r from-universe-blue/20 to-universe-purple/20 border border-border rounded-xl p-8">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">Early-Stage Startup Culture</h3>
                  <p className="text-muted-foreground">
                    We're a small, passionate team building something meaningful. You'll have real ownership, 
                    work directly with founders, and see your impact on students' lives every day.
                  </p>
                </div>
                <GraduationCap className="w-20 h-20 text-primary/50" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Roles */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8">Open Positions</h2>
            
            <div className="space-y-4">
              {openRoles.map((role) => (
                <div 
                  key={role.title}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{role.title}</h3>
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {role.type}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{role.description}</p>
                      <span className="text-xs text-muted-foreground">{role.location}</span>
                    </div>
                    <Button variant="outline" className="gap-2 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      Apply
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Internships */}
      <section className="py-16 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="bg-card border border-border rounded-xl p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-universe-cyan/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-6 h-6 text-universe-cyan" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-3">Internship Opportunities</h2>
                  <p className="text-muted-foreground mb-4">
                    We love working with ambitious students! Our internship program offers hands-on experience 
                    in product development, community building, and startup operations. Interns work on real 
                    projects that impact our users.
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-primary" />
                      Engineering Intern
                    </li>
                    <li className="flex items-center gap-2">
                      <Palette className="w-4 h-4 text-primary" />
                      Design Intern
                    </li>
                    <li className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      Marketing Intern
                    </li>
                    <li className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Community Intern
                    </li>
                  </ul>
                  <Button className="gap-2">
                    Apply for Internship
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Don't See Your Role?</h2>
            <p className="text-muted-foreground mb-8">
              We're always looking for talented, passionate people. Send us your resume and tell us 
              how you'd like to contribute to UniVerse.
            </p>
            <a 
              href="mailto:careers@universe.app"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
            >
              Send Your Resume
              <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default CareersPage;
