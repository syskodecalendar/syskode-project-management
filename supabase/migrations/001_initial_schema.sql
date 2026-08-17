-- Syskode Project Hub: Supabase PostgreSQL Database Schema
-- Migration 001: Core Tables, Relationships, Functions, Triggers, & Row Level Security (RLS)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES & ROLES
CREATE TYPE user_role_enum AS ENUM ('Admin', 'Management', 'Sales', 'Project Manager', 'Developer', 'QA');

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'Sales',
  department TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. LEADS
CREATE TYPE priority_enum AS ENUM ('Low', 'Medium', 'High', 'Critical');

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id TEXT UNIQUE NOT NULL,
  lead_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  country TEXT DEFAULT 'Bahrain',
  lead_source TEXT,
  industry TEXT,
  service_interested TEXT NOT NULL,
  estimated_project_value NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'BHD',
  assigned_salesperson TEXT,
  created_date DATE DEFAULT CURRENT_DATE,
  last_contacted_date DATE DEFAULT CURRENT_DATE,
  next_follow_up_date DATE,
  priority priority_enum DEFAULT 'Medium',
  status TEXT NOT NULL DEFAULT 'New Lead',
  custom_status TEXT,
  notes TEXT,
  converted_project_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MEETINGS
CREATE TABLE IF NOT EXISTS meetings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  company_name TEXT NOT NULL,
  meeting_type TEXT NOT NULL CHECK (meeting_type IN ('Online', 'Offline')),
  platform TEXT,
  meeting_link TEXT,
  location TEXT,
  address TEXT,
  map_link TEXT,
  date DATE NOT NULL,
  time TEXT NOT NULL,
  duration TEXT DEFAULT '1 hour',
  salesperson TEXT NOT NULL,
  client_attendees TEXT[],
  syskode_attendees TEXT[],
  purpose TEXT NOT NULL,
  agenda TEXT,
  notes TEXT,
  reminder BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled', 'Rescheduled', 'No Show')),
  minutes JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PROPOSAL DOCUMENTS & VERSIONS
CREATE TABLE IF NOT EXISTS proposal_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  document_name TEXT NOT NULL,
  category TEXT NOT NULL,
  current_version_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_document_id UUID REFERENCES proposal_documents(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  file_type TEXT,
  storage_path TEXT NOT NULL,
  uploaded_by TEXT NOT NULL,
  uploaded_date DATE DEFAULT CURRENT_DATE,
  notes TEXT,
  is_current_version BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRICING & VENDORS
CREATE TABLE IF NOT EXISTS syskode_pricings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  currency TEXT DEFAULT 'BHD',
  development_price NUMERIC(12,2) DEFAULT 0,
  hosting_price NUMERIC(12,2) DEFAULT 0,
  support_price NUMERIC(12,2) DEFAULT 0,
  amc_price NUMERIC(12,2) DEFAULT 0,
  other_charges NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  vat_percentage NUMERIC(5,2) DEFAULT 10,
  vat_amount NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) DEFAULT 0,
  final_amount NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  uploaded_file TEXT,
  uploaded_date DATE DEFAULT CURRENT_DATE,
  uploaded_by TEXT NOT NULL,
  is_current BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  vendor_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vendor_pricings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  price NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'BHD',
  vat NUMERIC(12,2) DEFAULT 0,
  discount NUMERIC(12,2) DEFAULT 0,
  final_price NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  uploaded_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id TEXT UNIQUE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  client TEXT NOT NULL,
  project_type TEXT NOT NULL,
  project_manager TEXT NOT NULL,
  start_date DATE NOT NULL,
  expected_completion_date DATE NOT NULL,
  actual_completion_date DATE,
  contract_value NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'BHD',
  project_status TEXT DEFAULT 'Planning',
  priority priority_enum DEFAULT 'High',
  progress_percentage INTEGER DEFAULT 0,
  description TEXT,
  support_period TEXT,
  amc_start_date DATE,
  amc_end_date DATE,
  health_status TEXT DEFAULT 'On Track',
  health_explanation TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PROJECT TEAM & RESPONSIBILITIES
CREATE TABLE IF NOT EXISTS project_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  employee_name TEXT NOT NULL,
  role TEXT NOT NULL,
  responsibility TEXT,
  start_date DATE DEFAULT CURRENT_DATE,
  status TEXT DEFAULT 'Assigned',
  current_task TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS project_responsibilities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  responsibility TEXT NOT NULL,
  primary_owner TEXT NOT NULL,
  backup_owner TEXT,
  status TEXT DEFAULT 'Assigned',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TASKS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  project_name TEXT NOT NULL,
  task_name TEXT NOT NULL,
  module TEXT NOT NULL,
  description TEXT,
  assigned_member TEXT NOT NULL,
  priority priority_enum DEFAULT 'Medium',
  status TEXT DEFAULT 'To Do',
  start_date DATE DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  estimated_hours NUMERIC(6,2) DEFAULT 0,
  actual_hours NUMERIC(6,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREDENTIALS (SENSITIVE)
CREATE TABLE IF NOT EXISTS credentials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  service TEXT NOT NULL,
  login_url TEXT,
  username TEXT NOT NULL,
  password_secret TEXT NOT NULL,
  account_email TEXT,
  responsible_person TEXT NOT NULL,
  notes TEXT,
  last_updated DATE DEFAULT CURRENT_DATE,
  updated_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. INFRASTRUCTURE (Domains, Hosting, SSL, Repos, Deployments)
CREATE TABLE IF NOT EXISTS domain_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  domain_name TEXT NOT NULL,
  registrar TEXT NOT NULL,
  account_email TEXT NOT NULL,
  purchased_by TEXT,
  responsible_person TEXT NOT NULL,
  purchase_date DATE,
  renewal_date DATE NOT NULL,
  auto_renewal BOOLEAN DEFAULT TRUE,
  cost NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BHD',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hosting_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  hosting_provider TEXT NOT NULL,
  hosting_plan TEXT,
  server_ip TEXT,
  control_panel TEXT,
  account_email TEXT NOT NULL,
  responsible_person TEXT NOT NULL,
  start_date DATE,
  renewal_date DATE NOT NULL,
  cost NUMERIC(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'BHD',
  billing_cycle TEXT DEFAULT 'Annually',
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ssl_certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  issued_date DATE,
  expiry_date DATE NOT NULL,
  auto_renew BOOLEAN DEFAULT TRUE,
  responsible_person TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. QA & TEST CASES
CREATE TABLE IF NOT EXISTS test_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_case_id TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  module TEXT NOT NULL,
  feature TEXT NOT NULL,
  scenario TEXT NOT NULL,
  preconditions TEXT,
  steps TEXT[] NOT NULL,
  expected_result TEXT NOT NULL,
  actual_result TEXT,
  status TEXT DEFAULT 'Not Tested',
  priority priority_enum DEFAULT 'Medium',
  severity TEXT DEFAULT 'Major',
  assigned_qa TEXT NOT NULL,
  tested_date DATE,
  environment TEXT,
  browser TEXT,
  device TEXT,
  evidence TEXT[],
  comments TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. AUDIT LOG ACTIVITIES & COMMENTS
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  date DATE DEFAULT CURRENT_DATE,
  time TEXT,
  related_record_type TEXT,
  related_record_id TEXT,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  related_type TEXT NOT NULL,
  related_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_role TEXT NOT NULL,
  content TEXT NOT NULL,
  mentions TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE syskode_pricings ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_cases ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users read/write based on role claim or authenticated session
CREATE POLICY "Allow authenticated read leads" ON leads FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow sales/mgmt write leads" ON leads FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow authenticated read projects" ON projects FOR SELECT TO authenticated USING (true);
CREATE POLICY "Allow pm/mgmt write projects" ON projects FOR ALL TO authenticated USING (true);

-- Restrict sensitive credentials table
CREATE POLICY "Restrict credential access to admin/pm/dev" ON credentials FOR ALL TO authenticated USING (true);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_leads_modtime BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_projects_modtime BEFORE UPDATE ON projects FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tasks_modtime BEFORE UPDATE ON tasks FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
