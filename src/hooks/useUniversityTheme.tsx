import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useProfile } from "./useProfile";

interface UniversityTheme {
  id: string;
  name: string;
  shortName: string | null;
  slug: string | null;
  logoUrl: string | null;
  themePrimary: string;
  themeGradient: string;
  bannerUrl: string | null;
}

interface UniversityThemeContextType {
  theme: UniversityTheme | null;
  applyTheme: (theme: UniversityTheme) => void;
  resetTheme: () => void;
}

const defaultTheme: UniversityTheme = {
  id: "",
  name: "Sympan",
  shortName: null,
  slug: null,
  logoUrl: null,
  themePrimary: "262 83% 58%",
  themeGradient: "linear-gradient(135deg, hsl(262, 83%, 58%), hsl(199, 89%, 48%))",
  bannerUrl: null,
};

const UniversityThemeContext = createContext<UniversityThemeContextType | undefined>(undefined);

export const UniversityThemeProvider = ({ children }: { children: ReactNode }) => {
  const { profile } = useProfile();
  const [theme, setTheme] = useState<UniversityTheme | null>(null);

  // Apply theme to CSS variables
  const applyThemeToDOM = (t: UniversityTheme) => {
    const root = document.documentElement;
    root.style.setProperty("--university-primary", t.themePrimary);
    root.style.setProperty("--university-gradient", t.themeGradient);
    console.log("[UniversityTheme] Applied theme for:", t.name);
  };

  // Apply theme from profile's university
  useEffect(() => {
    if (profile?.university) {
      const uni = profile.university as any;
      const newTheme: UniversityTheme = {
        id: uni.id,
        name: uni.name,
        shortName: uni.short_name,
        slug: uni.slug || null,
        logoUrl: uni.logo_url,
        themePrimary: uni.theme_primary || defaultTheme.themePrimary,
        themeGradient: uni.theme_gradient || defaultTheme.themeGradient,
        bannerUrl: uni.banner_url || null,
      };
      setTheme(newTheme);
      applyThemeToDOM(newTheme);
      console.log("[UniversityTheme] Loaded theme from profile:", newTheme);
    }
  }, [profile?.university]);

  const applyTheme = (newTheme: UniversityTheme) => {
    setTheme(newTheme);
    applyThemeToDOM(newTheme);
  };

  const resetTheme = () => {
    setTheme(null);
    applyThemeToDOM(defaultTheme);
  };

  return (
    <UniversityThemeContext.Provider value={{ theme, applyTheme, resetTheme }}>
      {children}
    </UniversityThemeContext.Provider>
  );
};

export const useUniversityTheme = () => {
  const context = useContext(UniversityThemeContext);
  if (context === undefined) {
    throw new Error("useUniversityTheme must be used within a UniversityThemeProvider");
  }
  return context;
};
