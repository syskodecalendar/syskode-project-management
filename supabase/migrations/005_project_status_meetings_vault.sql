-- Syskode Project Hub v5
-- Project manual status/history + meeting attendee metadata.
-- Run AFTER 003_employees_permissions_crud.sql and 004_project_completion_validation.sql.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS manual_status TEXT,
  ADD COLUMN IF NOT EXISTS last_status_updated_at TIMESTAMPTZ;

ALTER TABLE public.meetings
  ADD COLUMN IF NOT EXISTS client_email TEXT;

CREATE TABLE IF NOT EXISTS public.project_status_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  project_status TEXT NOT NULL,
  manual_status TEXT,
  progress_percentage INTEGER NOT NULL DEFAULT 0 CHECK (progress_percentage BETWEEN 0 AND 100),
  changed_by TEXT NOT NULL,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  previous_project_status TEXT,
  previous_manual_status TEXT,
  note TEXT
);

CREATE INDEX IF NOT EXISTS idx_project_status_logs_project_id
  ON public.project_status_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_project_status_logs_changed_at
  ON public.project_status_logs(changed_at DESC);

ALTER TABLE public.project_status_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project status log select" ON public.project_status_logs;
DROP POLICY IF EXISTS "Project status log insert" ON public.project_status_logs;
DROP POLICY IF EXISTS "Project status log update" ON public.project_status_logs;
DROP POLICY IF EXISTS "Project status log delete" ON public.project_status_logs;

CREATE POLICY "Project status log select"
ON public.project_status_logs FOR SELECT TO authenticated
USING (public.app_has_permission('view_projects') OR public.app_has_permission('manage_projects'));

CREATE POLICY "Project status log insert"
ON public.project_status_logs FOR INSERT TO authenticated
WITH CHECK (public.app_has_permission('manage_projects'));

CREATE POLICY "Project status log update"
ON public.project_status_logs FOR UPDATE TO authenticated
USING (public.app_has_permission('manage_projects'))
WITH CHECK (public.app_has_permission('manage_projects'));

CREATE POLICY "Project status log delete"
ON public.project_status_logs FOR DELETE TO authenticated
USING (public.app_has_permission('delete_projects'));
