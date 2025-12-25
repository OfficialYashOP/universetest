import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Tables } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;
type UserRole = Tables<"user_roles">;

interface ProfileWithRole extends Profile {
  role?: UserRole["role"];
  university?: {
    id: string;
    name: string;
    short_name: string | null;
  };
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<ProfileWithRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      // Fetch user role
      const { data: roleData, error: roleError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();

      if (roleError) throw roleError;

      // Fetch university if profile has university_id
      let university = undefined;
      if (profileData?.university_id) {
        const { data: uniData } = await supabase
          .from("universities")
          .select("id, name, short_name")
          .eq("id", profileData.university_id)
          .maybeSingle();
        
        university = uniData || undefined;
      }

      setProfile({
        ...profileData,
        role: roleData?.role,
        university,
      } as ProfileWithRole);
    } catch (err) {
      console.error("Error fetching profile:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: new Error("Not authenticated") };

    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id);

    if (!error) {
      await fetchProfile();
    }

    return { error };
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { error: new Error("Not authenticated"), url: null };

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) return { error: uploadError, url: null };

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);

    // Update profile with new avatar URL
    await updateProfile({ avatar_url: data.publicUrl });

    return { error: null, url: data.publicUrl };
  };

  const uploadVerificationDocument = async (file: File) => {
    if (!user) return { error: new Error("Not authenticated"), url: null };

    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/verification-doc.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("verification-documents")
      .upload(filePath, file, { upsert: true });

    if (uploadError) return { error: uploadError, url: null };

    const { data } = supabase.storage
      .from("verification-documents")
      .getPublicUrl(filePath);

    // Update profile with verification document URL and set status to pending
    await updateProfile({
      verification_document_url: data.publicUrl,
      verification_status: "pending",
    });

    return { error: null, url: data.publicUrl };
  };

  return {
    profile,
    loading,
    error,
    updateProfile,
    uploadAvatar,
    uploadVerificationDocument,
    refetch: fetchProfile,
  };
};
