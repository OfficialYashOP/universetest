import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { Shield, Lock, Eye, UserCheck, Database, Share2, Trash2 } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground">
            Last Updated: December 2024
          </p>
        </div>

        {/* Content */}
        <div className="prose prose-invert max-w-none space-y-8">
          <section className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground leading-relaxed">
              At UniVerse, your privacy is our priority. This Privacy Policy explains how we collect, 
              use, protect, and share your personal information when you use our platform. By using UniVerse, 
              you agree to the practices described in this policy.
            </p>
          </section>

          {/* What We Collect */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Database className="w-6 h-6 text-universe-cyan" />
              <h2 className="text-2xl font-bold">What Data We Collect</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Full name and email address</li>
                  <li>University name and affiliation</li>
                  <li>Role (student, alumni, staff, or service provider)</li>
                  <li>Profile photo (optional)</li>
                  <li>Phone number (optional)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Verification Data</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>University ID card or enrollment document</li>
                  <li>University email verification status</li>
                  <li>Roll number or student ID (optional)</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">User-Generated Content</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Posts, comments, and messages</li>
                  <li>Housing and resource listings</li>
                  <li>Reviews and ratings</li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold mb-2">Device & Usage Data</h3>
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li>Device type and operating system</li>
                  <li>Browser type and version</li>
                  <li>IP address and location (approximate)</li>
                  <li>Usage patterns and feature interactions</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Why We Collect */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Eye className="w-6 h-6 text-universe-purple" />
              <h2 className="text-2xl font-bold">Why We Collect Your Data</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6">
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <UserCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Verification:</strong> To ensure only genuine university members access the platform</span>
                </li>
                <li className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Security:</strong> To prevent scams, fraud, and maintain a safe community</span>
                </li>
                <li className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Platform Functionality:</strong> To provide personalized features and connect you with your university community</span>
                </li>
                <li className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span><strong className="text-foreground">Improvement:</strong> To analyze usage patterns and improve our services</span>
                </li>
              </ul>
            </div>
          </section>

          {/* How We Protect */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Lock className="w-6 h-6 text-universe-blue" />
              <h2 className="text-2xl font-bold">How We Protect Your Data</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-3">
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Industry-standard encryption for data in transit and at rest</li>
                <li>Secure cloud infrastructure with regular security audits</li>
                <li>Access controls limiting employee access to personal data</li>
                <li>Regular security updates and vulnerability assessments</li>
                <li>Secure authentication with password hashing</li>
              </ul>
            </div>
          </section>

          {/* Data Sharing */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Share2 className="w-6 h-6 text-universe-pink" />
              <h2 className="text-2xl font-bold">Data Sharing</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <p className="text-green-400 font-medium">
                  UniVerse does NOT sell your personal data to third parties.
                </p>
              </div>
              
              <p className="text-muted-foreground">We may share your data only with:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li><strong className="text-foreground">Trusted Service Providers:</strong> Companies that help us operate our platform (hosting, analytics) under strict confidentiality agreements</li>
                <li><strong className="text-foreground">Legal Authorities:</strong> When required by law or to protect our users and platform from harm</li>
                <li><strong className="text-foreground">Your University Community:</strong> Profile information you choose to make visible to other verified members</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <UserCheck className="w-6 h-6 text-universe-cyan" />
              <h2 className="text-2xl font-bold">Your Rights</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground mb-4">Under GDPR and applicable privacy laws, you have the right to:</p>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { title: "Access", desc: "Request a copy of your personal data" },
                  { title: "Rectification", desc: "Update or correct inaccurate data" },
                  { title: "Erasure", desc: "Request deletion of your account and data" },
                  { title: "Portability", desc: "Export your data in a portable format" },
                  { title: "Restrict", desc: "Limit how we process your data" },
                  { title: "Object", desc: "Object to certain data processing" },
                ].map((right) => (
                  <div key={right.title} className="bg-muted rounded-lg p-4">
                    <h4 className="font-semibold mb-1">{right.title}</h4>
                    <p className="text-sm text-muted-foreground">{right.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Account Deletion */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <Trash2 className="w-6 h-6 text-destructive" />
              <h2 className="text-2xl font-bold">Account Deletion</h2>
            </div>
            
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground">
                You can delete your account at any time from your profile settings. Upon deletion:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-1">
                <li>Your profile and personal data will be permanently removed</li>
                <li>Your posts may be anonymized or deleted</li>
                <li>Verification documents will be securely destroyed</li>
                <li>Some data may be retained for legal compliance (up to 30 days)</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-universe-blue/20 to-universe-purple/20 border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">Questions About Your Privacy?</h2>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy or how we handle your data, 
              please contact us at <a href="mailto:privacy@universe.app" className="text-primary hover:underline">privacy@universe.app</a>
            </p>
          </section>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default PrivacyPolicy;
