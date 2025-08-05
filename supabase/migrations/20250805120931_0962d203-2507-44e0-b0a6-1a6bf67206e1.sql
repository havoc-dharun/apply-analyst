-- Create profiles table for HR users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  company_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Update jobs table to link to HR users
ALTER TABLE public.jobs ADD COLUMN hr_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.jobs ADD COLUMN salary TEXT;
ALTER TABLE public.jobs ADD COLUMN location TEXT;

-- Update jobs policies to be user-specific
DROP POLICY IF EXISTS "Jobs are publicly viewable" ON public.jobs;
DROP POLICY IF EXISTS "Jobs can be created by anyone" ON public.jobs;
DROP POLICY IF EXISTS "Jobs can be deleted by anyone" ON public.jobs;

CREATE POLICY "Users can view their own jobs" 
ON public.jobs 
FOR SELECT 
USING (hr_user_id = auth.uid());

CREATE POLICY "Users can create their own jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (hr_user_id = auth.uid());

CREATE POLICY "Users can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (hr_user_id = auth.uid());

CREATE POLICY "Users can delete their own jobs" 
ON public.jobs 
FOR DELETE 
USING (hr_user_id = auth.uid());

-- Update applications policies to be user-specific
DROP POLICY IF EXISTS "Applications are publicly viewable" ON public.applications;
DROP POLICY IF EXISTS "Applications can be created by anyone" ON public.applications;

CREATE POLICY "HR can view applications for their jobs" 
ON public.applications 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = applications.job_id 
    AND jobs.hr_user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can create applications" 
ON public.applications 
FOR INSERT 
WITH CHECK (true);

-- Add trigger for profiles timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, company_name, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'company_name', 'Company'),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();