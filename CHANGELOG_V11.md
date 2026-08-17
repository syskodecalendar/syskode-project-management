# Syskode Project Hub v11

## Excel export
- Added reusable `.xlsx` export with no additional npm dependency.
- Reports can export a multi-sheet workbook containing executive summary, lead outcomes, loss-stage analysis, lost leads, project billing and invoice records.
- Added Excel export to Leads, Projects, Tasks, Meetings, Proposals, QA/Test Cases, Infrastructure, Project Team/RACI, Today's Work, Project Billing, Employees and Activity/Audit Trail.
- Credentials/passwords are intentionally not included in Excel exports.
- Exported workbooks use Syskode blue headers and readable column widths.

## Project QA / Test Cases
- Added **Add Test Case** directly inside every project's **QA / Test Cases** tab.
- Manual project test cases support scenario, module, feature, expected result, priority, severity and assignment to a project team member.
- Added **Generate with AI** inside the project QA tab; the AI test-suite modal opens preselected to that project.
- Existing global QA/Test Cases page and AI generation remain available.

## Syskode website-aligned UI
- Updated the main workspace to a light enterprise theme using Syskode navy, technology blue, white and soft light-blue surfaces.
- Updated sidebar, top header, login screen, dashboard cards/charts, reports and primary action buttons to the Syskode visual direction.
- Kept semantic status colors (success, warning and error) where they improve readability.
- Approved Syskode split-layout proposal PDF design and Syskode logos remain unchanged.

## Database and environment
- No new database migration is required for v11.
- No new environment variable is required.
- Existing migration `010_reporting_ai_tasks.sql` remains the latest migration.
