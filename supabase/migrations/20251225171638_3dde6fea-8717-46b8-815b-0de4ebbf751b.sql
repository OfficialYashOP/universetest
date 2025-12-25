-- Add slug and theme columns to universities table
ALTER TABLE public.universities 
ADD COLUMN IF NOT EXISTS slug text UNIQUE,
ADD COLUMN IF NOT EXISTS theme_primary text DEFAULT '262 83% 58%',
ADD COLUMN IF NOT EXISTS theme_gradient text DEFAULT 'linear-gradient(135deg, hsl(262, 83%, 58%), hsl(199, 89%, 48%))',
ADD COLUMN IF NOT EXISTS banner_url text;

-- Update existing universities with slugs and theme colors
UPDATE public.universities SET 
  slug = 'lpu',
  theme_primary = '349 80% 48%',
  theme_gradient = 'linear-gradient(135deg, hsl(349, 80%, 48%), hsl(24, 90%, 55%))'
WHERE short_name = 'LPU';

UPDATE public.universities SET 
  slug = 'du',
  theme_primary = '220 70% 45%',
  theme_gradient = 'linear-gradient(135deg, hsl(220, 70%, 45%), hsl(180, 60%, 40%))'
WHERE short_name = 'DU';

UPDATE public.universities SET 
  slug = 'iitd',
  theme_primary = '210 80% 40%',
  theme_gradient = 'linear-gradient(135deg, hsl(210, 80%, 40%), hsl(240, 60%, 50%))'
WHERE short_name = 'IITD';

UPDATE public.universities SET 
  slug = 'bits',
  theme_primary = '0 70% 50%',
  theme_gradient = 'linear-gradient(135deg, hsl(0, 70%, 50%), hsl(30, 80%, 55%))'
WHERE short_name = 'BITS';

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_universities_slug ON public.universities(slug);