import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { Sparkles, Rocket } from "lucide-react";

const CareersPage = () => {
  return (
    <PublicPageLayout>
      {/* Hero */}
      <section className="relative overflow-hidden py-32 min-h-[60vh] flex items-center">
        <div className="absolute inset-0 bg-gradient-hero opacity-50" />
        <div className="absolute top-20 right-1/4 w-96 h-96 bg-universe-purple/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/4 w-96 h-96 bg-universe-cyan/20 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">Careers at Sympan</span>
            </div>
            
            <Rocket className="w-20 h-20 text-primary/50 mx-auto mb-8" />
            
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              We Will Be <span className="gradient-text">Hiring Soon</span>
            </h1>
            
            <p className="text-xl text-muted-foreground leading-relaxed mb-8">
              We're building something special for students across India. 
              Stay tuned for exciting opportunities to join our team.
            </p>
            
            <div className="bg-card/50 border border-border rounded-xl p-8 max-w-md mx-auto">
              <p className="text-muted-foreground">
                Follow us on social media or check back later for updates on open positions.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicPageLayout>
  );
};

export default CareersPage;
