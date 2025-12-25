import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, Loader2, ArrowRight, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

interface University {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
  slug: string | null;
}

const SelectUniversityPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState("");
  const [saving, setSaving] = useState(false);

  // Redirect if already has university
  useEffect(() => {
    if (profile?.university_id) {
      const slug = (profile.university as any)?.slug || "lpu";
      navigate(`/app/university/${slug}`, { replace: true });
    }
  }, [profile, navigate]);

  // Fetch universities
  useEffect(() => {
    const fetchUniversities = async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("id, name, short_name, logo_url, slug")
        .eq("is_active", true)
        .order("name");

      if (error) {
        console.error("Error fetching universities:", error);
        toast({
          title: "Error",
          description: "Failed to load universities",
          variant: "destructive",
        });
      } else {
        setUniversities(data || []);
      }
      setLoading(false);
    };

    fetchUniversities();
  }, [toast]);

  const handleSelect = async () => {
    if (!selectedId) {
      toast({ title: "Error", description: "Please select a university", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await updateProfile({ university_id: selectedId });
    setSaving(false);

    if (error) {
      toast({ title: "Error", description: "Failed to save selection", variant: "destructive" });
      return;
    }

    const selected = universities.find(u => u.id === selectedId);
    const slug = selected?.slug || "lpu";
    
    toast({ title: "University selected!", description: `Welcome to ${selected?.name}` });
    navigate(`/app/university/${slug}`, { replace: true });
  };

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3">
          <img src={logo} alt="UniVerse" className="h-12 w-12 rounded-xl" />
          <span className="text-2xl font-bold gradient-text">UniVerse</span>
        </div>

        {/* Header */}
        <div className="text-center space-y-2">
          <GraduationCap className="w-12 h-12 text-primary mx-auto" />
          <h1 className="text-2xl font-bold">Select Your University</h1>
          <p className="text-muted-foreground">
            Choose your university to join the community
          </p>
        </div>

        {/* University List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            {universities.map((uni) => (
              <button
                key={uni.id}
                type="button"
                onClick={() => setSelectedId(uni.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-lg border transition-all text-left ${
                  selectedId === uni.id
                    ? "border-primary bg-primary/10 ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50 hover:bg-muted"
                }`}
              >
                <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center overflow-hidden p-1 flex-shrink-0">
                  {uni.logo_url ? (
                    <img src={uni.logo_url} alt={uni.name} className="w-full h-full object-contain" />
                  ) : (
                    <Building2 className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block font-medium">{uni.short_name || uni.name}</span>
                  <span className="block text-sm text-muted-foreground truncate">{uni.name}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Continue Button */}
        <Button
          variant="hero"
          size="lg"
          className="w-full"
          onClick={handleSelect}
          disabled={!selectedId || saving}
        >
          {saving ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Continue
              <ArrowRight className="ml-2 w-4 h-4" />
            </>
          )}
        </Button>
      </motion.div>
    </div>
  );
};

export default SelectUniversityPage;
