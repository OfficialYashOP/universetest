import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { AlertTriangle, Building2, Home, Store, MessageSquare, ExternalLink, Info } from "lucide-react";

const LegalDisclaimer = () => {
  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-500/10 mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Legal Disclaimer</h1>
          <p className="text-muted-foreground">
            Last Updated: December 2024
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground leading-relaxed">
              Please read this Legal Disclaimer carefully before using Sympan. 
              This disclaimer outlines the limitations of our platform and clarifies what Sympan is and is not responsible for.
            </p>
          </section>

          {/* Platform Nature */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Building2 className="w-6 h-6 text-universe-cyan" />
              <h2 className="text-2xl font-bold">Platform Nature</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
                <p className="text-blue-400">
                  <strong>Sympan is an independent platform</strong> — we are not affiliated with, endorsed by, 
                  or acting as an official representative of any university or educational institution.
                </p>
              </div>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Sympan is a technology platform that connects verified university community members</li>
                <li>We do not have official authority over university matters</li>
                <li>Our verification process confirms university affiliation but does not grant official status</li>
                <li>University-specific information should be verified through official university channels</li>
              </ul>
            </div>
          </section>

          {/* User Content */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-universe-purple" />
              <h2 className="text-2xl font-bold">User-Posted Content</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Sympan is not responsible for content posted by users.</strong> This includes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Posts, comments, and messages shared on the platform</li>
                <li>Opinions, advice, or recommendations from other users</li>
                <li>Accuracy of information provided in user profiles</li>
                <li>Quality or reliability of services offered by users</li>
              </ul>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
                <p className="text-amber-400 text-sm">
                  <strong>Advice Disclaimer:</strong> Any advice, tips, or recommendations shared by users 
                  is for informational purposes only. Always verify important information through official sources.
                </p>
              </div>
            </div>
          </section>

          {/* Housing Listings */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Home className="w-6 h-6 text-universe-blue" />
              <h2 className="text-2xl font-bold">Housing & Listings</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Sympan does not guarantee the accuracy of housing or resource listings.</strong>
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>We do not verify the physical condition, availability, or legality of listed properties</li>
                <li>Rental agreements and transactions are between users — UniVerse is not a party to these</li>
                <li>Always visit properties in person before making commitments</li>
                <li>We recommend using secure payment methods and documented agreements</li>
                <li>Report suspicious listings immediately to help keep the community safe</li>
              </ul>
            </div>
          </section>

          {/* Third-Party Services */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Store className="w-6 h-6 text-universe-pink" />
              <h2 className="text-2xl font-bold">Third-Party Services</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p className="text-muted-foreground">
                <strong className="text-foreground">Sympan is not responsible for third-party services listed on our platform.</strong>
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Local businesses and service providers are independent entities</li>
                <li>We do not guarantee the quality, safety, or reliability of their services</li>
                <li>Reviews and ratings are user-generated and may not reflect actual experiences</li>
                <li>Any disputes with service providers should be resolved directly with them</li>
              </ul>
            </div>
          </section>

          {/* External Links */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <ExternalLink className="w-6 h-6 text-universe-cyan" />
              <h2 className="text-2xl font-bold">External Links</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground">
                Sympan may contain links to external websites or services. We are not responsible for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li>The content, privacy practices, or policies of external sites</li>
                <li>Any damages or losses resulting from visiting external links</li>
                <li>The availability or accuracy of external resources</li>
              </ul>
              <p className="text-muted-foreground mt-4">
                External links are provided for convenience only and do not constitute endorsement.
              </p>
            </div>
          </section>

          {/* Limitation */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Info className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Limitation of Liability</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground">
                To the maximum extent permitted by law, Sympan and its team shall not be liable for:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li>Any direct, indirect, incidental, or consequential damages</li>
                <li>Loss of data, profits, or business opportunities</li>
                <li>Damages arising from user interactions or transactions</li>
                <li>Platform downtime or technical issues</li>
                <li>Actions of third parties or other users</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-universe-blue/20 to-universe-purple/20 border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">Questions?</h2>
            <p className="text-muted-foreground">
              If you have questions about this Legal Disclaimer, please contact us at{" "}
              <a href="mailto:legal@sympan.app" className="text-primary hover:underline">legal@sympan.app</a>
            </p>
          </section>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default LegalDisclaimer;
