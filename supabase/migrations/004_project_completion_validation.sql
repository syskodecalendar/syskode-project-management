-- Syskode Project Hub v4
-- Manual project completion validation. Run AFTER migration 003.

-- Normalize any old values before adding the database constraint.
UPDATE public.projects
SET progress_percentage = LEAST(100, GREATEST(0, COALESCE(progress_percentage, 0)))
WHERE progress_percentage IS NULL OR progress_percentage < 0 OR progress_percentage > 100;

ALTER TABLE public.projects
  ALTER COLUMN progress_percentage SET DEFAULT 0;

ALTER TABLE public.projects
  DROP CONSTRAINT IF EXISTS projects_progress_percentage_range;

ALTER TABLE public.projects
  ADD CONSTRAINT projects_progress_percentage_range
  CHECK (progress_percentage BETWEEN 0 AND 100);
