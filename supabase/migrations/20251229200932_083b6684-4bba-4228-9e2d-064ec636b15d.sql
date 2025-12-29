
-- Drop the partners table
DROP TABLE IF EXISTS public.partners CASCADE;

-- Drop the job_listings table (depends on partners)
DROP TABLE IF EXISTS public.job_listings CASCADE;
