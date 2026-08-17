# Syskode Project Hub v7 Changelog

## Proposal Builder

- Added editable Table block.
- Table caption, headers, rows and columns can be edited in the builder.
- Added table rendering to live proposal preview.
- Added table rendering to PDF export.
- Improved proposal cover, section styling, typography, spacing and footer design.
- Replaced browser-print PDF behavior with direct jsPDF generation.
- Removed generated time/date from the exported proposal footer.
- AI vendor proposal import can now return table blocks.

## Zoho Books

- Added server-side OAuth 2.0 connection workflow.
- Added secure encrypted Zoho token storage.
- Added connected organization discovery.
- Added Zoho Books Item listing and default invoice Item selection.
- Added project billing milestone table and UI.
- Added customizable invoice percentage schedules.
- Added 50/20/20/10 billing template.
- Added Zoho customer creation/linking for projects.
- Added Zoho invoice creation from project billing milestones.
- Added invoice status/payment refresh.
- Added invoiced, paid, pending-to-invoice and outstanding percentage/amount tracking.

## Database

- Added migration `008_zoho_books_billing.sql`.
