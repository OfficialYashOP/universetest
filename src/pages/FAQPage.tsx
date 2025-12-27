import { useState } from "react";
import { PublicPageLayout } from "@/components/layout/PublicPageLayout";
import { HelpCircle, ChevronDown, Search, Shield, Users, Lock, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQCategory {
  icon: typeof HelpCircle;
  title: string;
  items: FAQItem[];
}

const faqData: FAQCategory[] = [
  {
    icon: HelpCircle,
    title: "General",
    items: [
      {
        question: "What is Sympan?",
        answer: "Sympan is a university-exclusive platform that connects students, seniors, alumni, and approved service providers. It is your digital campus for finding housing, sharing resources, connecting with mentors, and discovering trusted local services."
      },
      {
        question: "Who can join Sympan?",
        answer: "Sympan is exclusively for verified university community members: current students, seniors, alumni, faculty/staff, and approved local service providers (like PG owners, restaurants, etc.). Everyone must complete verification to access the platform."
      },
      {
        question: "Is Sympan free to use?",
        answer: "Yes! Sympan is completely free for students and university members. Service providers may have premium listing options in the future, but core features will always remain free for students."
      },
      {
        question: "Which universities are supported?",
        answer: "We're currently live at Lovely Professional University (LPU). We plan to expand to more universities across India and globally. Want Sympan at your university? Contact us!"
      }
    ]
  },
  {
    icon: Shield,
    title: "Verification & Safety",
    items: [
      {
        question: "How does verification work?",
        answer: "You can verify your account by uploading your university ID card, enrollment letter, or any official document showing your name and university affiliation. Our team reviews submissions within 1-2 business days. You can also verify via your official university email."
      },
      {
        question: "Why is verification required?",
        answer: "Verification is the core of Sympan's safety promise. By ensuring every member is a genuine university affiliate, we eliminate scammers, fake accounts, and bad actors. This creates a trusted community where you can safely connect and transact."
      },
      {
        question: "How does Sympan prevent scams?",
        answer: "Multiple layers: 1) Mandatory verification for all users, 2) Verified badges for trusted members, 3) Community reporting system, 4) Active moderation team, 5) Review system for service providers. We take a zero-tolerance approach to fraud."
      },
      {
        question: "What happens if I encounter a scammer?",
        answer: "Report them immediately using the report button on their profile or listing. Our team investigates all reports within 24 hours. Confirmed scammers are permanently banned, and we may report serious cases to authorities."
      }
    ]
  },
  {
    icon: Users,
    title: "Using Sympan",
    items: [
      {
        question: "Can I talk to students from other universities?",
        answer: "By default, you see content and members from your own university to keep communities focused. However, you can optionally explore other universities' public content. Private messaging is available with any verified member."
      },
      {
        question: "How do I find roommates or housing?",
        answer: "Go to the Housing section from the dashboard. You can browse available PGs, apartments, and roommate requests. Use filters for budget, location, gender preference, and more. You can also create your own listing if you're offering housing or looking for roommates."
      },
      {
        question: "How do I report a user or listing?",
        answer: "Click the three-dot menu on any profile, post, or listing and select 'Report'. Choose the reason and provide details. Our moderation team reviews all reports and takes appropriate action, including warnings, suspensions, or permanent bans."
      },
      {
        question: "Can I post anonymously?",
        answer: "Yes! When creating a post in the campus feed, you can toggle 'Post anonymously'. Your identity will be hidden from other users, but our system maintains a record for safety and moderation purposes."
      }
    ]
  },
  {
    icon: Lock,
    title: "Privacy & Account",
    items: [
      {
        question: "Is my data safe?",
        answer: "Absolutely. We use industry-standard encryption, secure cloud infrastructure, and strict access controls. We never sell your data to third parties. Read our Privacy Policy for full details on how we protect your information."
      },
      {
        question: "Can I delete my account?",
        answer: "Yes, you can delete your account anytime from your profile settings. This will permanently remove your profile, posts, and personal data. Some anonymized data may be retained for legal compliance. Verification documents are securely destroyed."
      },
      {
        question: "Who can see my profile?",
        answer: "Your basic profile (name, university, role) is visible to verified members from your university. You can control what additional information to display. Verification documents are never visible to other users."
      },
      {
        question: "How do I change my email or password?",
        answer: "Go to Profile > Settings to update your email or password. For security, email changes require verification. If you've forgotten your password, use the 'Forgot Password' link on the login page."
      }
    ]
  }
];

const FAQPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (key: string) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(key)) {
      newOpenItems.delete(key);
    } else {
      newOpenItems.add(key);
    }
    setOpenItems(newOpenItems);
  };

  const filteredCategories = faqData.map(category => ({
    ...category,
    items: category.items.filter(
      item => 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.items.length > 0);

  return (
    <PublicPageLayout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <MessageSquare className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about Sympan. Can't find what you're looking for?{" "}
            <a href="/contact" className="text-primary hover:underline">Contact us</a>
          </p>
        </div>

        {/* Search */}
        <div className="relative max-w-md mx-auto mb-12">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12"
          />
        </div>

        {/* FAQ Categories */}
        <div className="space-y-8">
          {filteredCategories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No questions found matching your search.</p>
            </div>
          ) : (
            filteredCategories.map((category) => (
              <div key={category.title} className="space-y-4">
                <div className="flex items-center gap-3">
                  <category.icon className="w-6 h-6 text-primary" />
                  <h2 className="text-xl font-bold">{category.title}</h2>
                </div>
                
                <div className="space-y-2">
                  {category.items.map((item, index) => {
                    const key = `${category.title}-${index}`;
                    const isOpen = openItems.has(key);
                    
                    return (
                      <div 
                        key={key}
                        className="bg-card border border-border rounded-xl overflow-hidden"
                      >
                        <button
                          onClick={() => toggleItem(key)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-muted/50 transition-colors"
                        >
                          <span className="font-medium pr-4">{item.question}</span>
                          <ChevronDown 
                            className={cn(
                              "w-5 h-5 text-muted-foreground transition-transform flex-shrink-0",
                              isOpen && "rotate-180"
                            )} 
                          />
                        </button>
                        
                        <div 
                          className={cn(
                            "overflow-hidden transition-all duration-300",
                            isOpen ? "max-h-96" : "max-h-0"
                          )}
                        >
                          <div className="px-4 pb-4 text-muted-foreground">
                            {item.answer}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Still Have Questions */}
        <div className="mt-12 bg-gradient-to-r from-universe-blue/20 to-universe-purple/20 border border-border rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-3">Still Have Questions?</h2>
          <p className="text-muted-foreground mb-6">
            We're here to help! Reach out to our support team.
          </p>
          <a 
            href="/contact" 
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Contact Support
          </a>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default FAQPage;
