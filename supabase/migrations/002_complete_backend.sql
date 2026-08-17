-- Syskode Project Hub: complete database integration for the React dashboard
-- Run after 001_initial_schema.sql

-- Columns used by the live UI that were not present in the initial draft schema.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS next_action JSONB;
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS workload TEXT;
ALTER TABLE project_members ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS comments_count INTEGER DEFAULT 0;
ALTER TABLE comments ADD COLUMN IF NOT EXISTS user_avatar TEXT;
ALTER TABLE vendor_pricings ADD COLUMN IF NOT EXISTS file TEXT;

CREATE TABLE IF NOT EXISTS repository_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  github_url TEXT NOT NULL,
  repository_owner TEXT NOT NULL,
  main_branch TEXT DEFAULT 'main',
  development_branch TEXT,
  deployment_branch TEXT,
  responsible_developer TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deployment_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  production_url TEXT,
  staging_url TEXT,
  development_url TEXT,
  deployment_provider TEXT NOT NULL,
  responsible_person TEXT NOT NULL,
  last_deployment TEXT,
  deployment_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  file_name TEXT NOT NULL,
  storage_path TEXT,
  uploaded_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link_to TEXT,
  related_record_type TEXT,
  related_record_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_record_type TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_record_id TEXT;

CREATE TABLE IF NOT EXISTS company_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  settings_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Keep updated_at consistent on the newly added mutable tables.
DROP TRIGGER IF EXISTS update_repositories_modtime ON repository_records;
CREATE TRIGGER update_repositories_modtime BEFORE UPDATE ON repository_records
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_deployments_modtime ON deployment_records;
CREATE TRIGGER update_deployments_modtime BEFORE UPDATE ON deployment_records
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create a profile automatically for every Supabase Auth user.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email, 'Syskode User'), '@', 1)),
    COALESCE(NEW.email, NEW.id::text || '@local.invalid'),
    'Sales'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Ensure all application tables use RLS.
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE syskode_pricings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_pricings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_responsibilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE domain_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE hosting_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssl_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployment_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;

-- Internal system policy: authenticated Syskode users can work with operational records.
-- Role-specific UI permissions remain in the React app; credentials get a stricter DB policy below.
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'leads','meetings','proposal_documents','document_versions','syskode_pricings',
    'vendors','vendor_pricings','vendor_proposals','projects','project_members',
    'project_responsibilities','tasks','domain_records','hosting_accounts','ssl_certificates',
    'repository_records','deployment_records','test_cases','activities','comments','notifications',
    'company_settings'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated full access" ON %I', t);
    EXECUTE format(
      'CREATE POLICY "Authenticated full access" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)',
      t
    );
  END LOOP;
END $$;

DROP POLICY IF EXISTS "Profiles authenticated read" ON profiles;
CREATE POLICY "Profiles authenticated read" ON profiles
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Profiles own insert" ON profiles;
CREATE POLICY "Profiles own insert" ON profiles
FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() AND role = 'Sales');

DROP POLICY IF EXISTS "Profiles own update" ON profiles;
CREATE POLICY "Profiles own update" ON profiles
FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- Authenticated users may edit their own profile details, but cannot promote their role.
REVOKE UPDATE ON profiles FROM authenticated;
GRANT UPDATE (name, department, phone, avatar_url) ON profiles TO authenticated;

-- Sensitive credentials are visible only to technical/management roles.
DROP POLICY IF EXISTS "Restrict credential access to admin/pm/dev" ON credentials;
CREATE POLICY "Restrict credential access to admin/pm/dev" ON credentials
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('Admin','Management','Project Manager','Developer')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles p
    WHERE p.user_id = auth.uid()
      AND p.role IN ('Admin','Management','Project Manager','Developer')
  )
);

-- Storage buckets used by proposals, pricing, QA evidence, and meeting attachments.
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('proposals', 'proposals', false),
  ('vendor-proposals', 'vendor-proposals', false),
  ('pricing', 'pricing', false),
  ('qa-evidence', 'qa-evidence', false),
  ('meeting-files', 'meeting-files', false)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Syskode authenticated storage read" ON storage.objects;
CREATE POLICY "Syskode authenticated storage read" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id IN ('proposals','vendor-proposals','pricing','qa-evidence','meeting-files'));

DROP POLICY IF EXISTS "Syskode authenticated storage insert" ON storage.objects;
CREATE POLICY "Syskode authenticated storage insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('proposals','vendor-proposals','pricing','qa-evidence','meeting-files'));

DROP POLICY IF EXISTS "Syskode authenticated storage update" ON storage.objects;
CREATE POLICY "Syskode authenticated storage update" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id IN ('proposals','vendor-proposals','pricing','qa-evidence','meeting-files'))
WITH CHECK (bucket_id IN ('proposals','vendor-proposals','pricing','qa-evidence','meeting-files'));

DROP POLICY IF EXISTS "Syskode authenticated storage delete" ON storage.objects;
CREATE POLICY "Syskode authenticated storage delete" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id IN ('proposals','vendor-proposals','pricing','qa-evidence','meeting-files'));
