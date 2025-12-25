-- Create tables for LPU Campus Assist module

-- Hostel contacts table
CREATE TABLE public.lpu_hostel_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hostel_name text NOT NULL,
  block text,
  landline text,
  mobile text,
  availability text,
  hostel_type text NOT NULL CHECK (hostel_type IN ('boys', 'girls', 'apartment')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Emergency contacts table
CREATE TABLE public.lpu_emergency_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  department text,
  contact_name text,
  mobile text,
  landline text[],
  email text,
  availability text,
  is_sos boolean DEFAULT false,
  priority integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Health centre staff table
CREATE TABLE public.lpu_health_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  designation text,
  specialization text,
  role_type text NOT NULL CHECK (role_type IN ('doctor', 'visiting_doctor', 'psychologist', 'nursing', 'other')),
  uid text,
  timings text,
  office_contact text,
  personal_contact text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Campus locations table
CREATE TABLE public.lpu_campus_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  block_number text,
  name text NOT NULL,
  category text NOT NULL,
  description text,
  map_x numeric,
  map_y numeric,
  phone_landline text,
  phone_mobile text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Health centre phone directory
CREATE TABLE public.lpu_health_directory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department text NOT NULL,
  phone_numbers text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.lpu_hostel_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lpu_emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lpu_health_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lpu_campus_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lpu_health_directory ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow all authenticated users to read (LPU-specific filtering will be done in app)
CREATE POLICY "Anyone can view hostel contacts" ON public.lpu_hostel_contacts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view emergency contacts" ON public.lpu_emergency_contacts
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view health staff" ON public.lpu_health_staff
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view campus locations" ON public.lpu_campus_locations
  FOR SELECT USING (true);

CREATE POLICY "Anyone can view health directory" ON public.lpu_health_directory
  FOR SELECT USING (true);

-- Admin policies for staff role
CREATE POLICY "Staff can manage hostel contacts" ON public.lpu_hostel_contacts
  FOR ALL USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can manage emergency contacts" ON public.lpu_emergency_contacts
  FOR ALL USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can manage health staff" ON public.lpu_health_staff
  FOR ALL USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can manage campus locations" ON public.lpu_campus_locations
  FOR ALL USING (has_role(auth.uid(), 'staff'));

CREATE POLICY "Staff can manage health directory" ON public.lpu_health_directory
  FOR ALL USING (has_role(auth.uid(), 'staff'));