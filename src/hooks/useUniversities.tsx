import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface University {
  id: string;
  name: string;
  short_name: string | null;
  location: string | null;
  logo_url: string | null;
  is_active: boolean | null;
  domain: string | null;
}

export const useUniversities = () => {
  return useQuery({
    queryKey: ["universities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("*")
        .order("is_active", { ascending: false });

      if (error) throw error;
      return data as University[];
    },
  });
};

export const useActiveUniversities = () => {
  return useQuery({
    queryKey: ["universities", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("universities")
        .select("*")
        .eq("is_active", true);

      if (error) throw error;
      return data as University[];
    },
  });
};
