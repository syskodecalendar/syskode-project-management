# Syskode Project Hub v6

## Proposal Studio
- Added section-by-section editable proposal builder.
- Added Heading, Subheading, Paragraph, Bullet Points, Image and Signature blocks.
- Added section/block move and delete actions.
- Added proposal-to-lead linking and proposal status.
- Added live proposal preview.
- Added browser-native PDF export.
- Added proposal cloning.
- Added selective section copying from one proposal to another.

## AI Vendor Proposal Migration
- Added vendor PDF source upload inside the proposal builder.
- Added start-heading/end-heading extraction request.
- Added Gemini server endpoint that converts the requested source range into editable builder sections.
- Instructs AI to convert competitor company references to Syskode Technologies W.L.L. while preserving client-specific names.
- Archives vendor source PDFs in private Supabase Storage.

## Database
- Added migration 007_proposal_builder.sql.
- Added builder JSON content to proposal_documents.
- Added proposal_source_files table.
- Added private proposal-assets storage bucket and RLS-aware storage policies.

## Existing functionality retained
- Supabase backend/database.
- Employees, roles and permissions.
- Infrastructure CRUD.
- Credential Vault permissions.
- Project status history.
- Meetings and Calendar workflow.
- Delete controls.
- Mobile responsiveness and readable forms.
- Zoho CRM Leads CSV import (migration 006).

## Lead lifecycle
- Lead Workspace now derives Meeting/Proposal/Project/QA/Completed progression from real records and linked project state instead of getting stuck on Won/Project.
