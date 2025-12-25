import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { Cookie, Shield, Settings, BarChart3, CheckCircle } from "lucide-react";

const CookiePolicy = () => {
  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <Cookie className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-muted-foreground">
            Last Updated: December 2024
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="bg-card border border-border rounded-xl p-6">
            <p className="text-muted-foreground leading-relaxed">
              UniVerse uses cookies and similar technologies to provide, protect, and improve our platform. 
              This Cookie Policy explains what cookies are, how we use them, and your choices regarding cookies.
            </p>
          </section>

          {/* What Are Cookies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">What Are Cookies?</h2>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground">
                Cookies are small text files stored on your device when you visit a website. 
                They help websites remember your preferences, keep you logged in, and understand how you use the site. 
                Similar technologies include local storage, session storage, and pixels.
              </p>
            </div>
          </section>

          {/* How We Use Cookies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">How We Use Cookies</h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p className="text-muted-foreground mb-4">UniVerse uses cookies for the following purposes:</p>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <Shield className="w-8 h-8 text-universe-cyan flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Authentication & Security</h3>
                    <p className="text-sm text-muted-foreground">
                      Keep you logged in securely, prevent unauthorized access, and protect against fraud and abuse.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <Settings className="w-8 h-8 text-universe-purple flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Preferences & Functionality</h3>
                    <p className="text-sm text-muted-foreground">
                      Remember your settings, language preferences, and personalize your experience.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg">
                  <BarChart3 className="w-8 h-8 text-universe-blue flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-1">Analytics & Performance</h3>
                    <p className="text-sm text-muted-foreground">
                      Understand how users interact with UniVerse, identify issues, and improve our platform.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Types of Cookies */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Types of Cookies We Use</h2>
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 font-semibold">Type</th>
                      <th className="text-left py-3 px-4 font-semibold">Purpose</th>
                      <th className="text-left py-3 px-4 font-semibold">Duration</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 bg-green-500 rounded-full" />
                          Essential
                        </span>
                      </td>
                      <td className="py-3 px-4">Required for authentication, security, and basic functionality</td>
                      <td className="py-3 px-4">Session / 30 days</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 bg-blue-500 rounded-full" />
                          Functional
                        </span>
                      </td>
                      <td className="py-3 px-4">Remember preferences and personalization choices</td>
                      <td className="py-3 px-4">1 year</td>
                    </tr>
                    <tr>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center gap-2">
                          <span className="w-2 h-2 bg-purple-500 rounded-full" />
                          Analytics
                        </span>
                      </td>
                      <td className="py-3 px-4">Track usage patterns and improve performance</td>
                      <td className="py-3 px-4">2 years</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          {/* Your Choices */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Your Cookie Choices</h2>
            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
              <p className="text-muted-foreground">You have control over cookies:</p>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-universe-cyan mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Browser Settings</h4>
                    <p className="text-sm text-muted-foreground">
                      Most browsers allow you to block or delete cookies through settings. 
                      Note that blocking essential cookies may prevent UniVerse from working properly.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-universe-cyan mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Cookie Consent</h4>
                    <p className="text-sm text-muted-foreground">
                      When you first visit UniVerse, you can choose which non-essential cookies to accept or decline.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-universe-cyan mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium">Opt-Out Links</h4>
                    <p className="text-sm text-muted-foreground">
                      For analytics cookies, you can opt out through our privacy settings or third-party opt-out tools.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Cookie Consent */}
          <section className="space-y-4">
            <h2 className="text-2xl font-bold">Cookie Consent Notice</h2>
            <div className="bg-card border border-border rounded-xl p-6">
              <p className="text-muted-foreground">
                In compliance with GDPR and ePrivacy regulations, we display a cookie consent banner when you first visit UniVerse. 
                You can manage your preferences at any time through your account settings or by clearing your browser cookies.
              </p>
            </div>
          </section>

          {/* Contact */}
          <section className="bg-gradient-to-r from-universe-blue/20 to-universe-purple/20 border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold mb-3">Questions About Cookies?</h2>
            <p className="text-muted-foreground">
              If you have questions about our use of cookies, please contact us at{" "}
              <a href="mailto:privacy@universe.app" className="text-primary hover:underline">privacy@universe.app</a>
            </p>
          </section>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default CookiePolicy;
