# Syskode Project Hub v5

- Added `project_status_logs` database history.
- Added free-text `manual_status` to projects.
- Added project stage/status editor and visible history inside Project Workspace.
- Added real meeting join URL workflow and Google Meet creation shortcut.
- Added Google Calendar prefilled event links for stored meetings.
- Added meeting client-email persistence.
- Tightened Credential Vault UI to Admin or users with `view_credentials`.
- Passed current employee permission context into project Infrastructure CRUD.
- Expanded project team roles: Technical Lead, Business Analyst, QA Engineer and existing delivery roles.
- Added role-aware create/delete controls inside Project Workspace.
- Kept no-verification employee provisioning through the server-side Supabase Admin API.
- Fixed server `manage_users` authorization so customized Management permissions are honored.
- Retained full Infrastructure CRUD, employee/permissions screen, mobile responsiveness, global readable form styles, and operational delete actions from v4.
