-- Syskode Project Hub v6: editable proposal builder, AI vendor source files, and proposal assets
-- Run after 006_zoho_lead_import.sql (or after 005 if Zoho import is not being used yet).

ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'upload';
ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS proposal_status TEXT DEFAULT 'Draft';
ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS client_name TEXT;
ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS company_name TEXT;
ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS created_by TEXT;
ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS builder_sections JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS cloned_from_id UUID REFERENCES public.proposal_documents(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.proposal_source_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_document_id UUID NOT NULL REFERENCES public.proposal_documents(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  mime_type TEXT,
  uploaded_by TEXT NOT NULL,
  uploaded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proposal_source_files_document
  ON public.proposal_source_files(proposal_document_id);

ALTER TABLE public.proposal_source_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Proposal source select" ON public.proposal_source_files;
DROP POLICY IF EXISTS "Proposal source insert" ON public.proposal_source_files;
DROP POLICY IF EXISTS "Proposal source update" ON public.proposal_source_files;
DROP POLICY IF EXISTS "Proposal source delete" ON public.proposal_source_files;

CREATE POLICY "Proposal source select" ON public.proposal_source_files
FOR SELECT TO authenticated
USING (public.app_has_permission('view_proposals'));

CREATE POLICY "Proposal source insert" ON public.proposal_source_files
FOR INSERT TO authenticated
WITH CHECK (public.app_has_permission('manage_proposals'));

CREATE POLICY "Proposal source update" ON public.proposal_source_files
FOR UPDATE TO authenticated
USING (public.app_has_permission('manage_proposals'))
WITH CHECK (public.app_has_permission('manage_proposals'));

CREATE POLICY "Proposal source delete" ON public.proposal_source_files
FOR DELETE TO authenticated
USING (public.app_has_permission('delete_proposals'));

INSERT INTO storage.buckets (id, name, public)
VALUES ('proposal-assets', 'proposal-assets', false)
ON CONFLICT (id) DO NOTHING;

-- Rebuild Syskode storage policies so builder images/signatures are protected by proposal permissions.
DROP POLICY IF EXISTS "Syskode storage read" ON storage.objects;
DROP POLICY IF EXISTS "Syskode storage insert" ON storage.objects;
DROP POLICY IF EXISTS "Syskode storage update" ON storage.objects;
DROP POLICY IF EXISTS "Syskode storage delete" ON storage.objects;

CREATE POLICY "Syskode storage read" ON storage.objects FOR SELECT TO authenticated USING (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets') AND public.app_has_permission('view_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('view_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('view_meetings'))
);
CREATE POLICY "Syskode storage insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets') AND public.app_has_permission('manage_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('manage_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('manage_meetings'))
);
CREATE POLICY "Syskode storage update" ON storage.objects FOR UPDATE TO authenticated USING (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets') AND public.app_has_permission('manage_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('manage_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('manage_meetings'))
) WITH CHECK (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets') AND public.app_has_permission('manage_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('manage_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('manage_meetings'))
);
CREATE POLICY "Syskode storage delete" ON storage.objects FOR DELETE TO authenticated USING (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets') AND public.app_has_permission('delete_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('delete_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('delete_meetings'))
);
