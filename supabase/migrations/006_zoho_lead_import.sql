-- Run AFTER 005_project_status_meetings_vault.sql

ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS zoho_record_id TEXT;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS zoho_created_time TIMESTAMPTZ;
ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS zoho_modified_time TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_leads_zoho_record_id
  ON public.leads (zoho_record_id);

CREATE TABLE IF NOT EXISTS public.zoho_lead_raw (
  zoho_record_id TEXT PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  raw JSONB NOT NULL DEFAULT '{}'::jsonb,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zoho_lead_raw_lead_id
  ON public.zoho_lead_raw (lead_id);

ALTER TABLE public.zoho_lead_raw ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Zoho raw select" ON public.zoho_lead_raw;
DROP POLICY IF EXISTS "Zoho raw insert" ON public.zoho_lead_raw;
DROP POLICY IF EXISTS "Zoho raw update" ON public.zoho_lead_raw;
DROP POLICY IF EXISTS "Zoho raw delete" ON public.zoho_lead_raw;

CREATE POLICY "Zoho raw select"
ON public.zoho_lead_raw FOR SELECT TO authenticated
USING (public.app_has_permission('view_leads') OR public.app_has_permission('manage_leads'));

CREATE POLICY "Zoho raw insert"
ON public.zoho_lead_raw FOR INSERT TO authenticated
WITH CHECK (public.app_has_permission('manage_leads'));

CREATE POLICY "Zoho raw update"
ON public.zoho_lead_raw FOR UPDATE TO authenticated
USING (public.app_has_permission('manage_leads'))
WITH CHECK (public.app_has_permission('manage_leads'));

CREATE POLICY "Zoho raw delete"
ON public.zoho_lead_raw FOR DELETE TO authenticated
USING (public.app_has_permission('delete_leads'));
