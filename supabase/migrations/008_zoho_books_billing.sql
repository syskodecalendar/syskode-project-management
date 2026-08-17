-- Syskode Project Hub v7: Zoho Books integration + percentage billing milestones
-- Run after 007_proposal_builder.sql.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS zoho_books_customer_id TEXT;

CREATE TABLE IF NOT EXISTS public.project_billing_milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  trigger_label TEXT NOT NULL DEFAULT 'Project milestone',
  percentage NUMERIC(6,3) NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  amount NUMERIC(16,3) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BHD',
  due_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned','Ready','Invoiced','Partially Paid','Paid','Void')),
  zoho_invoice_id TEXT,
  zoho_invoice_number TEXT,
  zoho_invoice_status TEXT,
  zoho_contact_id TEXT,
  amount_paid NUMERIC(16,3) NOT NULL DEFAULT 0,
  invoiced_at TIMESTAMPTZ,
  last_synced_at TIMESTAMPTZ,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_project_billing_project
  ON public.project_billing_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_project_billing_zoho_invoice
  ON public.project_billing_milestones(zoho_invoice_id);

ALTER TABLE public.project_billing_milestones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Billing select" ON public.project_billing_milestones;
DROP POLICY IF EXISTS "Billing insert" ON public.project_billing_milestones;
DROP POLICY IF EXISTS "Billing update" ON public.project_billing_milestones;
DROP POLICY IF EXISTS "Billing delete" ON public.project_billing_milestones;

CREATE POLICY "Billing select" ON public.project_billing_milestones
FOR SELECT TO authenticated
USING (public.app_has_permission('view_projects') OR public.app_has_permission('manage_projects'));

CREATE POLICY "Billing insert" ON public.project_billing_milestones
FOR INSERT TO authenticated
WITH CHECK (public.app_has_permission('manage_projects'));

CREATE POLICY "Billing update" ON public.project_billing_milestones
FOR UPDATE TO authenticated
USING (public.app_has_permission('manage_projects'))
WITH CHECK (public.app_has_permission('manage_projects'));

CREATE POLICY "Billing delete" ON public.project_billing_milestones
FOR DELETE TO authenticated
USING (public.app_has_permission('delete_projects') OR public.app_has_permission('manage_projects'));

-- This table contains encrypted OAuth tokens and is intentionally server-only.
-- RLS is enabled with no authenticated policies; the Node service accesses it
-- using the Supabase service role.
CREATE TABLE IF NOT EXISTS public.zoho_books_connections (
  id TEXT PRIMARY KEY DEFAULT 'default',
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ,
  api_domain TEXT,
  accounts_url TEXT,
  organization_id TEXT NOT NULL,
  organization_name TEXT,
  default_item_id TEXT,
  default_item_name TEXT,
  scopes TEXT,
  connected_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- Safe when this migration is re-run after an earlier v7 preview.
ALTER TABLE public.zoho_books_connections
  ADD COLUMN IF NOT EXISTS default_item_id TEXT,
  ADD COLUMN IF NOT EXISTS default_item_name TEXT;

ALTER TABLE public.zoho_books_connections ENABLE ROW LEVEL SECURITY;

-- Ensure browser roles cannot directly read/write OAuth credentials.
REVOKE ALL ON TABLE public.zoho_books_connections FROM anon, authenticated;
GRANT ALL ON TABLE public.zoho_books_connections TO service_role;
