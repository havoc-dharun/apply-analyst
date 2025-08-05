-- Add keywords column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN keywords TEXT[] DEFAULT '{}';

-- Update existing jobs with some default keywords
UPDATE public.jobs 
SET keywords = ARRAY['JavaScript', 'React', 'Node.js', 'Python', 'Database', 'API Development']
WHERE keywords IS NULL OR array_length(keywords, 1) IS NULL; 