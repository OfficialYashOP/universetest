-- Create partners table for vendor accounts
CREATE TABLE public.partners (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('housing', 'jobs', 'restaurant', 'laundry', 'other')),
  phone TEXT NOT NULL,
  address TEXT,
  document_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  serving_university_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create roommate_requests table (student-only)
CREATE TABLE public.roommate_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL,
  user_id UUID NOT NULL,
  budget_min NUMERIC,
  budget_max NUMERIC,
  location_preference TEXT,
  gender_preference TEXT CHECK (gender_preference IN ('male', 'female', 'any')),
  move_in_date DATE,
  description TEXT,
  status listing_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create job_listings table (vendor-only)
CREATE TABLE public.job_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL,
  partner_id UUID NOT NULL,
  title TEXT NOT NULL,
  company TEXT,
  pay TEXT,
  job_type TEXT CHECK (job_type IN ('part-time', 'full-time', 'internship', 'freelance')),
  location TEXT,
  description TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  status listing_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create marketplace_posts table (student-only)
CREATE TABLE public.marketplace_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL,
  user_id UUID NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('books', 'notes', 'items')),
  title TEXT NOT NULL,
  price NUMERIC,
  condition TEXT CHECK (condition IN ('new', 'like-new', 'good', 'fair', 'poor')),
  images TEXT[],
  description TEXT,
  status listing_status DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add partner_id column to housing_listings for vendor listings
ALTER TABLE public.housing_listings ADD COLUMN IF NOT EXISTS partner_id UUID;
ALTER TABLE public.housing_listings ADD COLUMN IF NOT EXISTS is_vendor_listing BOOLEAN DEFAULT false;

-- Enable RLS on all new tables
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommate_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_posts ENABLE ROW LEVEL SECURITY;

-- Partners RLS policies
CREATE POLICY "Partners can view their own profile" ON public.partners
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Partners can insert their own profile" ON public.partners
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Partners can update their own profile" ON public.partners
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all partners" ON public.partners
FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));

CREATE POLICY "Admins can update all partners" ON public.partners
FOR UPDATE USING (has_role(auth.uid(), 'staff'::app_role));

-- Roommate requests RLS (student-only creation, university-scoped viewing)
CREATE POLICY "Students can create roommate requests" ON public.roommate_requests
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND university_id = get_user_university(auth.uid())
  AND NOT has_role(auth.uid(), 'partner_vendor'::app_role)
);

CREATE POLICY "Users can view roommate requests in their university" ON public.roommate_requests
FOR SELECT USING (university_id = get_user_university(auth.uid()));

CREATE POLICY "Users can update their own roommate requests" ON public.roommate_requests
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roommate requests" ON public.roommate_requests
FOR DELETE USING (auth.uid() = user_id);

-- Job listings RLS (vendor-only creation)
CREATE POLICY "Approved vendors can create job listings" ON public.job_listings
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.partners 
    WHERE partners.id = job_listings.partner_id 
    AND partners.user_id = auth.uid() 
    AND partners.status = 'approved'
  )
);

CREATE POLICY "Users can view job listings in their university" ON public.job_listings
FOR SELECT USING (university_id = get_user_university(auth.uid()));

CREATE POLICY "Vendors can update their own job listings" ON public.job_listings
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.partners 
    WHERE partners.id = job_listings.partner_id 
    AND partners.user_id = auth.uid()
  )
);

CREATE POLICY "Vendors can delete their own job listings" ON public.job_listings
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.partners 
    WHERE partners.id = job_listings.partner_id 
    AND partners.user_id = auth.uid()
  )
);

-- Marketplace posts RLS (student-only creation)
CREATE POLICY "Students can create marketplace posts" ON public.marketplace_posts
FOR INSERT WITH CHECK (
  auth.uid() = user_id 
  AND university_id = get_user_university(auth.uid())
  AND NOT has_role(auth.uid(), 'partner_vendor'::app_role)
);

CREATE POLICY "Users can view marketplace posts in their university" ON public.marketplace_posts
FOR SELECT USING (university_id = get_user_university(auth.uid()));

CREATE POLICY "Users can update their own marketplace posts" ON public.marketplace_posts
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketplace posts" ON public.marketplace_posts
FOR DELETE USING (auth.uid() = user_id);

-- Update housing_listings policy to allow vendor listings
CREATE POLICY "Approved vendors can create housing listings" ON public.housing_listings
FOR INSERT WITH CHECK (
  is_vendor_listing = true 
  AND partner_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.partners 
    WHERE partners.id = housing_listings.partner_id 
    AND partners.user_id = auth.uid() 
    AND partners.status = 'approved'
  )
);

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_roommate_requests_updated_at
  BEFORE UPDATE ON public.roommate_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_listings_updated_at
  BEFORE UPDATE ON public.job_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_marketplace_posts_updated_at
  BEFORE UPDATE ON public.marketplace_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();