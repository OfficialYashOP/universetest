-- Add verification_reminder_snooze_until column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_reminder_snooze_until TIMESTAMP WITH TIME ZONE DEFAULT NULL;