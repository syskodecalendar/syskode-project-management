-- Syskode Project Hub v3
-- Employee administration, granular permissions, stricter RLS and complete CRUD support.
-- Run AFTER 001_initial_schema.sql and 002_complete_backend.sql.

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_code TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'Active';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS permissions_customized BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);

-- Permission check used by database policies. Admin always has full access.
CREATE OR REPLACE FUNCTION public.app_has_permission(permission_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p public.profiles%ROWTYPE;
BEGIN
  SELECT * INTO p FROM public.profiles WHERE user_id = auth.uid() LIMIT 1;
  IF NOT FOUND OR COALESCE(p.status, 'Active') <> 'Active' THEN
    RETURN FALSE;
  END IF;

  IF p.role = 'Admin' THEN
    RETURN TRUE;
  END IF;

  IF COALESCE(p.permissions_customized, FALSE) THEN
    RETURN COALESCE(p.permissions, '[]'::jsonb) ? permission_name;
  END IF;

  RETURN CASE p.role
    WHEN 'Management' THEN permission_name = ANY(ARRAY[
      'view_dashboard','view_leads','manage_leads','delete_leads','view_meetings','manage_meetings','delete_meetings',
      'view_proposals','manage_proposals','delete_proposals','view_projects','manage_projects','delete_projects',
      'view_tasks','manage_tasks','delete_tasks','view_qa','manage_qa','delete_qa','view_infrastructure','manage_infrastructure',
      'delete_infrastructure','view_team','manage_team','delete_team','view_credentials','manage_credentials','delete_credentials',
      'view_reports','view_activity','view_settings','manage_settings','manage_users'
    ])
    WHEN 'Sales' THEN permission_name = ANY(ARRAY[
      'view_dashboard','view_leads','manage_leads','view_meetings','manage_meetings','view_proposals','manage_proposals',
      'view_projects','view_tasks','view_reports','view_activity'
    ])
    WHEN 'Project Manager' THEN permission_name = ANY(ARRAY[
      'view_dashboard','view_leads','view_meetings','view_proposals','view_projects','manage_projects','view_tasks','manage_tasks',
      'delete_tasks','view_qa','manage_qa','view_infrastructure','manage_infrastructure','view_team','manage_team','delete_team',
      'view_credentials','manage_credentials','view_reports','view_activity'
    ])
    WHEN 'Developer' THEN permission_name = ANY(ARRAY[
      'view_dashboard','view_projects','view_tasks','manage_tasks','view_qa','manage_qa','view_infrastructure','manage_infrastructure',
      'view_team','view_credentials','manage_credentials','view_activity'
    ])
    WHEN 'QA' THEN permission_name = ANY(ARRAY[
      'view_dashboard','view_projects','view_tasks','view_qa','manage_qa','delete_qa','view_team','view_activity'
    ])
    ELSE FALSE
  END;
END;
$$;

REVOKE ALL ON FUNCTION public.app_has_permission(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.app_has_permission(TEXT) TO authenticated;

-- Replace the broad v2 policies with operation-specific permission policies.
DO $$
DECLARE
  item RECORD;
BEGIN
  FOR item IN
    SELECT * FROM (VALUES
      ('leads','view_leads','manage_leads','delete_leads'),
      ('meetings','view_meetings','manage_meetings','delete_meetings'),
      ('proposal_documents','view_proposals','manage_proposals','delete_proposals'),
      ('document_versions','view_proposals','manage_proposals','delete_proposals'),
      ('syskode_pricings','view_proposals','manage_proposals','delete_proposals'),
      ('vendors','view_proposals','manage_proposals','delete_proposals'),
      ('vendor_pricings','view_proposals','manage_proposals','delete_proposals'),
      ('vendor_proposals','view_proposals','manage_proposals','delete_proposals'),
      ('projects','view_projects','manage_projects','delete_projects'),
      ('project_members','view_team','manage_team','delete_team'),
      ('project_responsibilities','view_team','manage_team','delete_team'),
      ('tasks','view_tasks','manage_tasks','delete_tasks'),
      ('credentials','view_credentials','manage_credentials','delete_credentials'),
      ('domain_records','view_infrastructure','manage_infrastructure','delete_infrastructure'),
      ('hosting_accounts','view_infrastructure','manage_infrastructure','delete_infrastructure'),
      ('ssl_certificates','view_infrastructure','manage_infrastructure','delete_infrastructure'),
      ('repository_records','view_infrastructure','manage_infrastructure','delete_infrastructure'),
      ('deployment_records','view_infrastructure','manage_infrastructure','delete_infrastructure'),
      ('test_cases','view_qa','manage_qa','delete_qa')
    ) AS v(table_name, view_perm, manage_perm, delete_perm)
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated full access" ON %I', item.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Syskode select" ON %I', item.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Syskode insert" ON %I', item.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Syskode update" ON %I', item.table_name);
    EXECUTE format('DROP POLICY IF EXISTS "Syskode delete" ON %I', item.table_name);

    EXECUTE format(
      'CREATE POLICY "Syskode select" ON %I FOR SELECT TO authenticated USING (public.app_has_permission(%L) OR public.app_has_permission(%L))',
      item.table_name, item.view_perm, item.manage_perm
    );
    EXECUTE format(
      'CREATE POLICY "Syskode insert" ON %I FOR INSERT TO authenticated WITH CHECK (public.app_has_permission(%L))',
      item.table_name, item.manage_perm
    );
    EXECUTE format(
      'CREATE POLICY "Syskode update" ON %I FOR UPDATE TO authenticated USING (public.app_has_permission(%L)) WITH CHECK (public.app_has_permission(%L))',
      item.table_name, item.manage_perm, item.manage_perm
    );
    EXECUTE format(
      'CREATE POLICY "Syskode delete" ON %I FOR DELETE TO authenticated USING (public.app_has_permission(%L))',
      item.table_name, item.delete_perm
    );
  END LOOP;
END $$;

-- Remove broad policies left by migration 001 where applicable.
DROP POLICY IF EXISTS "Allow authenticated read leads" ON leads;
DROP POLICY IF EXISTS "Allow sales/mgmt write leads" ON leads;
DROP POLICY IF EXISTS "Allow authenticated read projects" ON projects;
DROP POLICY IF EXISTS "Allow pm/mgmt write projects" ON projects;
DROP POLICY IF EXISTS "Restrict credential access to admin/pm/dev" ON credentials;

-- Profiles are readable by authenticated team members for assignee dropdowns.
DROP POLICY IF EXISTS "Profiles authenticated read" ON profiles;
CREATE POLICY "Profiles authenticated read" ON profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Profiles own insert" ON profiles;
DROP POLICY IF EXISTS "Profiles own update" ON profiles;
-- All role/permission changes are performed through the protected server Admin API.

-- Company settings.
DROP POLICY IF EXISTS "Authenticated full access" ON company_settings;
DROP POLICY IF EXISTS "Settings select" ON company_settings;
DROP POLICY IF EXISTS "Settings insert" ON company_settings;
DROP POLICY IF EXISTS "Settings update" ON company_settings;
DROP POLICY IF EXISTS "Settings delete" ON company_settings;
CREATE POLICY "Settings select" ON company_settings FOR SELECT TO authenticated USING (public.app_has_permission('view_settings') OR public.app_has_permission('manage_settings'));
CREATE POLICY "Settings insert" ON company_settings FOR INSERT TO authenticated WITH CHECK (public.app_has_permission('manage_settings'));
CREATE POLICY "Settings update" ON company_settings FOR UPDATE TO authenticated USING (public.app_has_permission('manage_settings')) WITH CHECK (public.app_has_permission('manage_settings'));
CREATE POLICY "Settings delete" ON company_settings FOR DELETE TO authenticated USING (public.app_has_permission('manage_settings'));

-- Audit activity / comments.
DROP POLICY IF EXISTS "Authenticated full access" ON activities;
DROP POLICY IF EXISTS "Activity select" ON activities;
DROP POLICY IF EXISTS "Activity insert" ON activities;
DROP POLICY IF EXISTS "Activity delete" ON activities;
CREATE POLICY "Activity select" ON activities FOR SELECT TO authenticated USING (public.app_has_permission('view_activity'));
CREATE POLICY "Activity insert" ON activities FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Activity delete" ON activities FOR DELETE TO authenticated USING (public.app_has_permission('delete_activity'));

DROP POLICY IF EXISTS "Authenticated full access" ON comments;
DROP POLICY IF EXISTS "Comments select" ON comments;
DROP POLICY IF EXISTS "Comments write" ON comments;
DROP POLICY IF EXISTS "Comments delete" ON comments;
CREATE POLICY "Comments select" ON comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Comments write" ON comments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Comments delete" ON comments FOR DELETE TO authenticated USING (public.app_has_permission('delete_activity'));

-- Notifications remain available to authenticated users; they are internal system messages.
DROP POLICY IF EXISTS "Authenticated full access" ON notifications;
DROP POLICY IF EXISTS "Notifications access" ON notifications;
CREATE POLICY "Notifications access" ON notifications FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Protect private storage by the permission corresponding to each bucket.
DROP POLICY IF EXISTS "Syskode authenticated storage read" ON storage.objects;
DROP POLICY IF EXISTS "Syskode authenticated storage insert" ON storage.objects;
DROP POLICY IF EXISTS "Syskode authenticated storage update" ON storage.objects;
DROP POLICY IF EXISTS "Syskode authenticated storage delete" ON storage.objects;

CREATE POLICY "Syskode storage read" ON storage.objects FOR SELECT TO authenticated USING (
  (bucket_id IN ('proposals','vendor-proposals','pricing') AND public.app_has_permission('view_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('view_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('view_meetings'))
);
CREATE POLICY "Syskode storage insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  (bucket_id IN ('proposals','vendor-proposals','pricing') AND public.app_has_permission('manage_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('manage_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('manage_meetings'))
);
CREATE POLICY "Syskode storage update" ON storage.objects FOR UPDATE TO authenticated USING (
  (bucket_id IN ('proposals','vendor-proposals','pricing') AND public.app_has_permission('manage_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('manage_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('manage_meetings'))
) WITH CHECK (
  (bucket_id IN ('proposals','vendor-proposals','pricing') AND public.app_has_permission('manage_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('manage_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('manage_meetings'))
);
CREATE POLICY "Syskode storage delete" ON storage.objects FOR DELETE TO authenticated USING (
  (bucket_id IN ('proposals','vendor-proposals','pricing') AND public.app_has_permission('delete_proposals')) OR
  (bucket_id = 'qa-evidence' AND public.app_has_permission('delete_qa')) OR
  (bucket_id = 'meeting-files' AND public.app_has_permission('delete_meetings'))
);
