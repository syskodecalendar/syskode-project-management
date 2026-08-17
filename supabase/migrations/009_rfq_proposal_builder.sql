-- Syskode Project Hub v8: RFQ source files and richer proposal metadata.
-- Run after 008_zoho_books_billing.sql.

ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS proposal_number TEXT;
ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS proposal_date DATE;
ALTER TABLE public.proposal_documents ADD COLUMN IF NOT EXISTS prepared_for_location TEXT DEFAULT 'Kingdom of Bahrain';

ALTER TABLE public.proposal_source_files ADD COLUMN IF NOT EXISTS source_kind TEXT DEFAULT 'vendor';
ALTER TABLE public.proposal_source_files ALTER COLUMN vendor_name DROP NOT NULL;

UPDATE public.proposal_source_files
SET source_kind = COALESCE(NULLIF(source_kind, ''), 'vendor')
WHERE source_kind IS NULL OR source_kind = '';

CREATE INDEX IF NOT EXISTS idx_proposal_source_files_kind
  ON public.proposal_source_files(source_kind);

INSERT INTO storage.buckets (id, name, public)
VALUES ('rfq-files', 'rfq-files', false)
ON CONFLICT (id) DO NOTHING;

-- Rebuild storage permissions so RFQs are protected exactly like proposals.
DROP POLICY IF EXISTS "Syskode storage read" ON storage.objects;
DROP POLICY IF EXISTS "Syskode storage insert" ON storage.objects;
DROP POLICY IF EXISTS "Syskode storage update" ON storage.objects;
DROP POLICY IF EXISTS "Syskode storage delete" ON storage.objects;

CREATE POLICY "Syskode storage read" ON storage.objects FOR SELECT TO authenticated USING (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets','rfq-files') AND public.app_has_permission('view_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('view_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('view_meetings'))
);

CREATE POLICY "Syskode storage insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets','rfq-files') AND public.app_has_permission('manage_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('manage_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('manage_meetings'))
);

CREATE POLICY "Syskode storage update" ON storage.objects FOR UPDATE TO authenticated USING (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets','rfq-files') AND public.app_has_permission('manage_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('manage_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('manage_meetings'))
) WITH CHECK (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets','rfq-files') AND public.app_has_permission('manage_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('manage_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('manage_meetings'))
);

CREATE POLICY "Syskode storage delete" ON storage.objects FOR DELETE TO authenticated USING (
  (bucket_id IN ('proposals','vendor-proposals','pricing','proposal-assets','rfq-files') AND public.app_has_permission('delete_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('delete_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('delete_meetings'))
);
