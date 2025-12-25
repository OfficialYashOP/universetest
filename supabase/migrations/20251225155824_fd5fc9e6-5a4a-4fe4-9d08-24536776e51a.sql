-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, university_id)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    (new.raw_user_meta_data ->> 'university_id')::uuid
  );
  
  -- Insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    new.id,
    (new.raw_user_meta_data ->> 'role')::app_role
  );
  
  RETURN new;
END;
$$;

-- Create trigger to auto-create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();