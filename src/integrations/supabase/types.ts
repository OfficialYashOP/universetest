export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      academic_resources: {
        Row: {
          condition: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          price: number | null
          resource_type: string
          status: Database["public"]["Enums"]["listing_status"] | null
          subject: string | null
          title: string
          university_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          price?: number | null
          resource_type: string
          status?: Database["public"]["Enums"]["listing_status"] | null
          subject?: string | null
          title: string
          university_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          condition?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          price?: number | null
          resource_type?: string
          status?: Database["public"]["Enums"]["listing_status"] | null
          subject?: string | null
          title?: string
          university_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_resources_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          joined_at: string | null
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          joined_at?: string | null
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          created_by: string
          id: string
          is_group: boolean | null
          name: string | null
          university_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          id?: string
          is_group?: boolean | null
          name?: string | null
          university_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          id?: string
          is_group?: boolean | null
          name?: string | null
          university_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      housing_listings: {
        Row: {
          address: string | null
          amenities: string[] | null
          contact_phone: string | null
          created_at: string | null
          description: string | null
          gender_preference: string | null
          id: string
          images: string[] | null
          is_vendor_listing: boolean | null
          is_verified: boolean | null
          listing_type: string
          location: string | null
          partner_id: string | null
          price: number | null
          room_type: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string
          university_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          amenities?: string[] | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          gender_preference?: string | null
          id?: string
          images?: string[] | null
          is_vendor_listing?: boolean | null
          is_verified?: boolean | null
          listing_type: string
          location?: string | null
          partner_id?: string | null
          price?: number | null
          room_type?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title: string
          university_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          amenities?: string[] | null
          contact_phone?: string | null
          created_at?: string | null
          description?: string | null
          gender_preference?: string | null
          id?: string
          images?: string[] | null
          is_vendor_listing?: boolean | null
          is_verified?: boolean | null
          listing_type?: string
          location?: string | null
          partner_id?: string | null
          price?: number | null
          room_type?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string
          university_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "housing_listings_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      job_listings: {
        Row: {
          company: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          description: string | null
          id: string
          job_type: string | null
          location: string | null
          partner_id: string
          pay: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string
          university_id: string
          updated_at: string
        }
        Insert: {
          company?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_type?: string | null
          location?: string | null
          partner_id: string
          pay?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title: string
          university_id: string
          updated_at?: string
        }
        Update: {
          company?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          description?: string | null
          id?: string
          job_type?: string | null
          location?: string | null
          partner_id?: string
          pay?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string
          university_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      local_services: {
        Row: {
          address: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          is_admin_approved: boolean | null
          is_verified: boolean | null
          name: string
          phone: string | null
          rating: number | null
          reviews_count: number | null
          university_id: string
          updated_at: string | null
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_admin_approved?: boolean | null
          is_verified?: boolean | null
          name: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          university_id: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_admin_approved?: boolean | null
          is_verified?: boolean | null
          name?: string
          phone?: string | null
          rating?: number | null
          reviews_count?: number | null
          university_id?: string
          updated_at?: string | null
          user_id?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "local_services_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      lpu_campus_locations: {
        Row: {
          block_number: string | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          map_x: number | null
          map_y: number | null
          name: string
          phone_landline: string | null
          phone_mobile: string | null
          updated_at: string | null
        }
        Insert: {
          block_number?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          map_x?: number | null
          map_y?: number | null
          name: string
          phone_landline?: string | null
          phone_mobile?: string | null
          updated_at?: string | null
        }
        Update: {
          block_number?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          map_x?: number | null
          map_y?: number | null
          name?: string
          phone_landline?: string | null
          phone_mobile?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lpu_emergency_contacts: {
        Row: {
          availability: string | null
          category: string
          contact_name: string | null
          created_at: string | null
          department: string | null
          email: string | null
          id: string
          is_sos: boolean | null
          landline: string[] | null
          mobile: string | null
          priority: number | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          category: string
          contact_name?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          id?: string
          is_sos?: boolean | null
          landline?: string[] | null
          mobile?: string | null
          priority?: number | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          category?: string
          contact_name?: string | null
          created_at?: string | null
          department?: string | null
          email?: string | null
          id?: string
          is_sos?: boolean | null
          landline?: string[] | null
          mobile?: string | null
          priority?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lpu_health_directory: {
        Row: {
          created_at: string | null
          department: string
          id: string
          phone_numbers: string[]
        }
        Insert: {
          created_at?: string | null
          department: string
          id?: string
          phone_numbers: string[]
        }
        Update: {
          created_at?: string | null
          department?: string
          id?: string
          phone_numbers?: string[]
        }
        Relationships: []
      }
      lpu_health_staff: {
        Row: {
          created_at: string | null
          designation: string | null
          id: string
          name: string
          office_contact: string | null
          personal_contact: string | null
          role_type: string
          specialization: string | null
          timings: string | null
          uid: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          designation?: string | null
          id?: string
          name: string
          office_contact?: string | null
          personal_contact?: string | null
          role_type: string
          specialization?: string | null
          timings?: string | null
          uid?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          designation?: string | null
          id?: string
          name?: string
          office_contact?: string | null
          personal_contact?: string | null
          role_type?: string
          specialization?: string | null
          timings?: string | null
          uid?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      lpu_hostel_contacts: {
        Row: {
          availability: string | null
          block: string | null
          created_at: string | null
          hostel_name: string
          hostel_type: string
          id: string
          landline: string | null
          mobile: string | null
          updated_at: string | null
        }
        Insert: {
          availability?: string | null
          block?: string | null
          created_at?: string | null
          hostel_name: string
          hostel_type: string
          id?: string
          landline?: string | null
          mobile?: string | null
          updated_at?: string | null
        }
        Update: {
          availability?: string | null
          block?: string | null
          created_at?: string | null
          hostel_name?: string
          hostel_type?: string
          id?: string
          landline?: string | null
          mobile?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_posts: {
        Row: {
          category: string
          condition: string | null
          created_at: string
          description: string | null
          id: string
          images: string[] | null
          price: number | null
          status: Database["public"]["Enums"]["listing_status"] | null
          title: string
          university_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title: string
          university_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          condition?: string | null
          created_at?: string
          description?: string | null
          id?: string
          images?: string[] | null
          price?: number | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          title?: string
          university_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          sender_id: string
          updated_at: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          sender_id: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          sender_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          address: string | null
          business_name: string
          category: string
          created_at: string
          document_url: string | null
          id: string
          phone: string
          serving_university_ids: string[] | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          business_name: string
          category: string
          created_at?: string
          document_url?: string | null
          id?: string
          phone: string
          serving_university_ids?: string[] | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          business_name?: string
          category?: string
          created_at?: string
          document_url?: string | null
          id?: string
          phone?: string
          serving_university_ids?: string[] | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_anonymous: boolean | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_anonymous?: boolean | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          id: string
          image_url: string | null
          is_anonymous: boolean | null
          likes_count: number | null
          tags: string[] | null
          university_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          university_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_anonymous?: boolean | null
          likes_count?: number | null
          tags?: string[] | null
          university_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          branch: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          is_verified: boolean | null
          phone: string | null
          roll_number: string | null
          university_id: string | null
          updated_at: string | null
          verification_document_url: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          year_of_study: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          is_verified?: boolean | null
          phone?: string | null
          roll_number?: string | null
          university_id?: string | null
          updated_at?: string | null
          verification_document_url?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          year_of_study?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          branch?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          is_verified?: boolean | null
          phone?: string | null
          roll_number?: string | null
          university_id?: string | null
          updated_at?: string | null
          verification_document_url?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          year_of_study?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      roommate_requests: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          created_at: string
          description: string | null
          gender_preference: string | null
          id: string
          location_preference: string | null
          move_in_date: string | null
          status: Database["public"]["Enums"]["listing_status"] | null
          university_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description?: string | null
          gender_preference?: string | null
          id?: string
          location_preference?: string | null
          move_in_date?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          university_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          created_at?: string
          description?: string | null
          gender_preference?: string | null
          id?: string
          location_preference?: string | null
          move_in_date?: string | null
          status?: Database["public"]["Enums"]["listing_status"] | null
          university_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      universities: {
        Row: {
          banner_url: string | null
          created_at: string | null
          domain: string | null
          id: string
          is_active: boolean | null
          location: string | null
          logo_url: string | null
          name: string
          short_name: string | null
          slug: string | null
          theme_gradient: string | null
          theme_primary: string | null
          updated_at: string | null
        }
        Insert: {
          banner_url?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          name: string
          short_name?: string | null
          slug?: string | null
          theme_gradient?: string | null
          theme_primary?: string | null
          updated_at?: string | null
        }
        Update: {
          banner_url?: string | null
          created_at?: string | null
          domain?: string | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          logo_url?: string | null
          name?: string
          short_name?: string | null
          slug?: string | null
          theme_gradient?: string | null
          theme_primary?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      university_requests: {
        Row: {
          admin_notes: string | null
          city: string
          country: string
          created_at: string
          department: string | null
          email: string
          id: string
          interest_count: string | null
          name: string
          phone: string | null
          proof_file_url: string | null
          reason: string | null
          role: string
          state: string
          status: string
          university_name: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          city: string
          country?: string
          created_at?: string
          department?: string | null
          email: string
          id?: string
          interest_count?: string | null
          name: string
          phone?: string | null
          proof_file_url?: string | null
          reason?: string | null
          role: string
          state: string
          status?: string
          university_name: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          city?: string
          country?: string
          created_at?: string
          department?: string | null
          email?: string
          id?: string
          interest_count?: string | null
          name?: string
          phone?: string | null
          proof_file_url?: string | null
          reason?: string | null
          role?: string
          state?: string
          status?: string
          university_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_assign_role: {
        Args: {
          new_role: Database["public"]["Enums"]["app_role"]
          target_user_id: string
        }
        Returns: undefined
      }
      check_request_rate_limit: {
        Args: { submitter_email: string }
        Returns: boolean
      }
      get_health_staff_public: {
        Args: never
        Returns: {
          created_at: string
          designation: string
          id: string
          name: string
          office_contact: string
          role_type: string
          specialization: string
          timings: string
          uid: string
        }[]
      }
      get_housing_listings_safe: {
        Args: { university_filter: string }
        Returns: {
          address: string
          amenities: string[]
          contact_phone: string
          created_at: string
          description: string
          gender_preference: string
          id: string
          images: string[]
          is_vendor_listing: boolean
          is_verified: boolean
          listing_type: string
          location: string
          partner_id: string
          price: number
          room_type: string
          status: Database["public"]["Enums"]["listing_status"]
          title: string
          university_id: string
          updated_at: string
          user_id: string
        }[]
      }
      get_public_profile: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          bio: string
          branch: string
          created_at: string
          full_name: string
          id: string
          is_verified: boolean
          university_id: string
          year_of_study: string
        }[]
      }
      get_public_profiles: {
        Args: never
        Returns: {
          avatar_url: string
          bio: string
          branch: string
          created_at: string
          full_name: string
          id: string
          is_verified: boolean
          university_id: string
          year_of_study: string
        }[]
      }
      get_user_university: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_conversation_participant: {
        Args: { _conversation_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "student"
        | "senior"
        | "alumni"
        | "staff"
        | "service_provider"
        | "partner_vendor"
      listing_status: "active" | "inactive" | "sold" | "rented"
      verification_status: "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "student",
        "senior",
        "alumni",
        "staff",
        "service_provider",
        "partner_vendor",
      ],
      listing_status: ["active", "inactive", "sold", "rented"],
      verification_status: ["pending", "verified", "rejected"],
    },
  },
} as const
