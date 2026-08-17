# Syskode Project Hub v11

A Supabase-backed CRM, proposal and project-delivery hub for Syskode Technologies W.L.L., built with React, Vite, Express and JavaScript/JSX.

## Main workflow

**Lead → Meeting → Proposal → Negotiation → Won/Lost → Project → Tasks/QA → Billing → Completion**

## Main modules

- Dashboard and lead pipeline
- Today's Work: today's meetings, due/overdue tasks, renewals and lead follow-ups
- Lead management with won/lost lifecycle and lost-stage/reason capture
- Zoho CRM lead CSV import
- Meetings and meeting minutes
- Proposal Studio with four creation modes:
  - AI from client RFP/RFQ
  - AI from vendor/competitor proposal
  - Manual proposal
  - Clone existing proposal
- Approved Syskode split-layout PDF export with actual Syskode logos, light-blue background and watermark
- Project creation and project status history
- Real employee assignment to each project and responsibility matrix
- Manual and Gemini-generated project tasks
- Project QA with manual **Add Test Case** and project-specific Gemini test-suite generation
- Infrastructure: domains, hosting, SSL, repositories and deployments
- Credentials vault with permissions
- Zoho Books milestone billing/invoice tracking
- Reports for won/lost leads, loss stage, pipeline, contract value, invoiced, received and outstanding money
- Excel export across reports and operational tables where appropriate
- Syskode website-aligned navy/blue/light visual system
- Mobile-responsive UI

## Excel exports

Excel export is available for Reports, Leads, Projects, Tasks, Meetings, Proposals, Test Cases, Infrastructure, Project Team/RACI, Today's Work, Project Billing, Employees and Activity. Sensitive credential/password records are not exported.

## Real-data-only behavior

No business records are preloaded. Leads, projects, users, tasks, proposals, meetings, billing, infrastructure and reports are driven by records entered by your team and synchronized with Supabase. AI endpoints do not create fabricated fallback records when Gemini is unavailable.

See `SETUP.md` before deploying and `CHANGELOG_V11.md` for this release.
