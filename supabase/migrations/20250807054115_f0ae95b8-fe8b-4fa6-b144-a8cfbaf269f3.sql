-- First, fix the NULL hr_user_id values by deleting jobs without valid hr_user_id
-- This is safer than trying to assign them to random users
DELETE FROM public.jobs WHERE hr_user_id IS NULL;

-- Now add the NOT NULL constraint
ALTER TABLE public.jobs 
ALTER COLUMN hr_user_id SET NOT NULL;

-- Update RLS policies to be more explicit about authenticated users
DROP POLICY IF EXISTS "Users can create their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can view their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete their own jobs" ON public.jobs;

-- Create more secure RLS policies that explicitly check for authenticated users
CREATE POLICY "Authenticated users can create their own jobs" 
ON public.jobs 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND hr_user_id = auth.uid());

CREATE POLICY "Authenticated users can view their own jobs" 
ON public.jobs 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND hr_user_id = auth.uid());

CREATE POLICY "Authenticated users can update their own jobs" 
ON public.jobs 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND hr_user_id = auth.uid());

CREATE POLICY "Authenticated users can delete their own jobs" 
ON public.jobs 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND hr_user_id = auth.uid());

-- Update applications RLS policy to be more explicit
DROP POLICY IF EXISTS "HR can view applications for their jobs" ON public.applications;

CREATE POLICY "Authenticated HR users can view applications for their jobs" 
ON public.applications 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.jobs 
  WHERE jobs.id = applications.job_id 
  AND jobs.hr_user_id = auth.uid()
));

-- Update profiles RLS policies to be more explicit
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

CREATE POLICY "Authenticated users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Add a check to ensure applications have valid job references
ALTER TABLE public.applications 
ADD CONSTRAINT fk_applications_job_id 
FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

-- Add trigger to update jobs updated_at timestamp
CREATE TRIGGER update_jobs_updated_at
BEFORE UPDATE ON public.jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger to update profiles updated_at timestamp  
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();