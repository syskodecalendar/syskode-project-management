# Syskode Project Hub v10

## Proposal Studio
- Four clear proposal creation paths: AI from client RFP/RFQ, AI from vendor/competitor proposal, manual creation, and clone existing proposal.
- Client RFP/RFQ PDFs can generate a complete editable Syskode proposal with Gemini.
- Vendor/competitor PDFs can be converted from the full document or an optional heading range into editable Syskode sections.
- Approved Syskode split-layout proposal PDF design and Syskode logos retained.

## Reporting
- Won, lost and active lead reporting from live records.
- Won value, lost value and active pipeline value.
- Lost-stage chart showing both number of losses and potential value lost at each stage.
- Money received, invoiced amount, outstanding amount and total project contract value.
- Financial position chart and per-project billing summary.
- Lost lead detail with stage, reason and value.

## Today's Work
- New Today's Work page for meetings scheduled today, tasks due today, overdue tasks, infrastructure renewals/expiries and lead follow-ups.

## AI project tasks
- Gemini generates implementation tasks from the selected real project only.
- AI sees only the members actually assigned to that project and may assign only those names; otherwise the task remains Unassigned.
- AI task generation is available from the Tasks page and directly inside each project's Tasks tab.
- AI-generated tasks are marked in the database with `generated_by_ai`.

## Real-data-only cleanup
- Removed preloaded sample leads, projects, meetings, tasks, proposals, employees, infrastructure and other seeded business records.
- Removed hard-coded employee/customer names and fake commercial values from operational forms.
- AI endpoints now fail clearly when Gemini is unavailable instead of inserting fabricated fallback business content.
- Existing real Supabase records remain the source of truth.

## Database
Run `supabase/migrations/010_reporting_ai_tasks.sql` after migration 009. It adds lead loss/win lifecycle reporting fields and AI task metadata.
