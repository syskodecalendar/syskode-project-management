# Syskode Project Hub v4 changes

- Supabase-backed shared database persistence and private file storage.
- Full Infrastructure CRUD: Domains, Hosting, SSL, Git repositories, Deployments.
- Infrastructure can be managed globally or inside a project.
- Employee administration with real Supabase Auth accounts.
- No verification email for administrator-created employees (`email_confirm: true`).
- Roles: Admin, Management, Sales, Project Manager, Developer, QA.
- Granular per-employee permissions with matching Supabase RLS enforcement.
- Delete actions across leads, meetings, proposals/pricing/vendors, projects, tasks, QA, team/RACI, credentials, infrastructure, comments/activity and employees where permitted.
- Mobile responsive application shell, sidebar drawer, forms, modals, cards, tables and action controls.
- Global white-form readability guard: labels, inputs, textareas, selects, placeholders and options remain readable.
- Manual Project Completion percentage (0-100) on New Project and Project Workspace.
- Dashboard Active Projects KPI shows average project completion.
- Supabase migration 004 enforces 0-100 project completion values.
