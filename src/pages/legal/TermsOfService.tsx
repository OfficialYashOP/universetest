import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { FileText, UserCheck, AlertTriangle, Shield, Scale, Bell } from "lucide-react";

const TermsOfService = () => {
  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last Updated: December 2024
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground leading-relaxed">
              Welcome to Sympan! These Terms of Service govern your use of our platform. 
              By creating an account or using Sympan, you agree to these terms. 
              Please read them carefully.
            </p>
          </section>

          {/* Eligibility */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-universe-cyan" />
              <h2 className="text-2xl font-bold">Eligibility</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p className="text-muted-foreground">To use Sympan, you must:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Be a current or former university student, staff member, or approved service provider</li>
                <li>Complete the verification process to prove your university affiliation</li>
                <li>Be at least 18 years old (or the age of majority in your jurisdiction)</li>
                <li>Have the legal capacity to enter into a binding agreement</li>
              </ul>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 mt-4">
                <p className="text-amber-400 text-sm">
                  <strong>Important:</strong> Accounts that cannot be verified will be suspended. 
                  False verification attempts may result in permanent bans.
                </p>
              </div>
            </div>
          </section>

          {/* User Responsibilities */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-universe-purple" />
              <h2 className="text-2xl font-bold">Your Responsibilities</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <h3 className="font-semibold text-lg">You agree to:</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Provide accurate and truthful information during registration and verification</li>
                <li>Keep your account credentials secure and confidential</li>
                <li>Use Sympan for lawful purposes only</li>
                <li>Treat other community members with respect</li>
                <li>Report suspicious activity or policy violations</li>
              </ul>
              
              <h3 className="font-semibold text-lg mt-6">You agree NOT to:</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  "Create fake or impersonating accounts",
                  "Harass, bully, or threaten other users",
                  "Post scams, fraud, or misleading content",
                  "Share illegal or harmful content",
                  "Spam or send unsolicited messages",
                  "Attempt to hack or exploit the platform",
                  "Collect user data without consent",
                  "Violate intellectual property rights",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-muted-foreground">
                    <AlertTriangle className="w-4 h-4 text-destructive mt-1 flex-shrink-0" />
                    <span className="text-sm">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Content Ownership */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-6 h-6 text-universe-blue" />
              <h2 className="text-2xl font-bold">Content Ownership</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Your Content</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>You retain ownership of all content you create and post on Sympan</li>
                  <li>You grant Sympan a limited license to display, distribute, and promote your content on our platform</li>
                  <li>You are responsible for ensuring you have the rights to share any content you post</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Sympan Content</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>The Sympan platform, logo, design, and features are our intellectual property</li>
                  <li>You may not copy, modify, or distribute our platform without permission</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Platform Rights */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Scale className="w-6 h-6 text-universe-pink" />
              <h2 className="text-2xl font-bold">Platform Rights</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p className="text-muted-foreground">Sympan reserves the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Suspend or terminate accounts that violate these terms</li>
                <li>Remove content that violates our policies or applicable laws</li>
                <li>Modify or discontinue features at any time</li>
                <li>Investigate and take action against policy violations</li>
                <li>Cooperate with legal authorities when required</li>
              </ul>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
              <h2 className="text-2xl font-bold">Limitation of Liability</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p className="text-muted-foreground">
                Sympan is provided "as is" without warranties of any kind. To the maximum extent permitted by law:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>We are not liable for user-generated content or interactions between users</li>
                <li>We do not guarantee the accuracy of listings, reviews, or user information</li>
                <li>We are not responsible for any damages arising from your use of the platform</li>
                <li>Our total liability shall not exceed the amount you paid us (if any) in the past 12 months</li>
              </ul>
            </div>
          </section>

          {/* Changes to Terms */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Bell className="w-6 h-6 text-universe-cyan" />
              <h2 className="text-2xl font-bold">Changes to Terms</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground">
                We may update these Terms of Service from time to time. When we make significant changes:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-1">
                <li>We will notify you via email or in-app notification</li>
                <li>The updated terms will be posted on this page with a new date</li>
                <li>Continued use of Sympan after changes constitutes acceptance</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-universe-blue/20 to-universe-purple/20 border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">Questions?</h2>
            <p className="text-muted-foreground">
              If you have questions about these Terms of Service, please contact us at{" "}
              <a href="mailto:legal@sympan.app" className="text-primary hover:underline">legal@sympan.app</a>
            </p>
          </section>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default TermsOfService;
