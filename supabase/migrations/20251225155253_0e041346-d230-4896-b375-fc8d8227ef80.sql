-- Create enum types
CREATE TYPE public.app_role AS ENUM ('student', 'senior', 'alumni', 'staff', 'service_provider');
CREATE TYPE public.verification_status AS ENUM ('pending', 'verified', 'rejected');
CREATE TYPE public.listing_status AS ENUM ('active', 'inactive', 'sold', 'rented');

-- Universities table
CREATE TABLE public.universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  short_name TEXT,
  domain TEXT, -- e.g., 'lpu.in' for email verification
  logo_url TEXT,
  location TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  year_of_study TEXT,
  branch TEXT,
  roll_number TEXT,
  phone TEXT,
  verification_status public.verification_status DEFAULT 'pending',
  verification_document_url TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- User roles table (separate for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Posts table (campus feed)
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES public.universities(id) NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  is_anonymous BOOLEAN DEFAULT false,
  tags TEXT[],
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Post comments
CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Post likes
CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Housing listings
CREATE TABLE public.housing_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES public.universities(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  listing_type TEXT NOT NULL, -- 'room', 'pg', 'flat', 'roommate_wanted'
  price DECIMAL(10,2),
  location TEXT,
  address TEXT,
  gender_preference TEXT, -- 'male', 'female', 'any'
  room_type TEXT, -- 'single', 'shared', 'triple'
  amenities TEXT[],
  images TEXT[],
  contact_phone TEXT,
  status public.listing_status DEFAULT 'active',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Local services
CREATE TABLE public.local_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'restaurant', 'cafe', 'laundry', 'grocery', 'other'
  address TEXT,
  phone TEXT,
  website TEXT,
  images TEXT[],
  is_verified BOOLEAN DEFAULT false,
  is_admin_approved BOOLEAN DEFAULT false,
  rating DECIMAL(2,1) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Academic resources
CREATE TABLE public.academic_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  university_id UUID REFERENCES public.universities(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT NOT NULL, -- 'book', 'notes', 'material'
  subject TEXT,
  price DECIMAL(10,2), -- NULL means free/sharing
  condition TEXT, -- for books: 'new', 'good', 'fair'
  images TEXT[],
  status public.listing_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.housing_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.local_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_resources ENABLE ROW LEVEL SECURITY;

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to get user's university
CREATE OR REPLACE FUNCTION public.get_user_university(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT university_id FROM public.profiles WHERE id = _user_id
$$;

-- Universities: Public read, admin write
CREATE POLICY "Universities are viewable by everyone" ON public.universities
  FOR SELECT USING (true);

-- Profiles: Users can view verified profiles from same university
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can view profiles from same university" ON public.profiles
  FOR SELECT USING (
    university_id = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User roles: Users can view their own roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own role" ON public.user_roles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Posts: University-scoped visibility
CREATE POLICY "Users can view posts from their university" ON public.posts
  FOR SELECT USING (
    university_id = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can create posts in their university" ON public.posts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    university_id = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can update their own posts" ON public.posts
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts" ON public.posts
  FOR DELETE USING (auth.uid() = user_id);

-- Post comments
CREATE POLICY "Users can view comments on visible posts" ON public.post_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.posts 
      WHERE id = post_id 
      AND university_id = public.get_user_university(auth.uid())
    )
  );

CREATE POLICY "Users can create comments" ON public.post_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.post_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Post likes
CREATE POLICY "Users can view likes" ON public.post_likes
  FOR SELECT USING (true);

CREATE POLICY "Users can like posts" ON public.post_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts" ON public.post_likes
  FOR DELETE USING (auth.uid() = user_id);

-- Housing listings: University-scoped
CREATE POLICY "Users can view housing in their university" ON public.housing_listings
  FOR SELECT USING (
    university_id = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can create housing listings" ON public.housing_listings
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    university_id = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can update their own listings" ON public.housing_listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" ON public.housing_listings
  FOR DELETE USING (auth.uid() = user_id);

-- Local services: University-scoped, only approved visible
CREATE POLICY "Users can view approved services" ON public.local_services
  FOR SELECT USING (
    university_id = public.get_user_university(auth.uid()) AND
    is_admin_approved = true
  );

CREATE POLICY "Service providers can create services" ON public.local_services
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    public.has_role(auth.uid(), 'service_provider')
  );

CREATE POLICY "Users can update their own services" ON public.local_services
  FOR UPDATE USING (auth.uid() = user_id);

-- Academic resources: University-scoped
CREATE POLICY "Users can view resources in their university" ON public.academic_resources
  FOR SELECT USING (
    university_id = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can create resources" ON public.academic_resources
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    university_id = public.get_user_university(auth.uid())
  );

CREATE POLICY "Users can update their own resources" ON public.academic_resources
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resources" ON public.academic_resources
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_universities_updated_at BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_housing_listings_updated_at BEFORE UPDATE ON public.housing_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_local_services_updated_at BEFORE UPDATE ON public.local_services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_academic_resources_updated_at BEFORE UPDATE ON public.academic_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert LPU as the first university
INSERT INTO public.universities (name, short_name, domain, location, is_active)
VALUES ('Lovely Professional University', 'LPU', 'lpu.in', 'Phagwara, Punjab, India', true);