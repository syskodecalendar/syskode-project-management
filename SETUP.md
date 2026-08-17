# Syskode Project Hub v11 — Setup

The source is JavaScript/JSX only and keeps the existing Supabase, Zoho CRM import, Zoho Books billing, Infrastructure, Employees/Permissions and approved Syskode Proposal Studio design. v11 adds Excel export, in-project test-case creation and the Syskode website-aligned light UI theme.

## 1. Database migration

If your current deployed database already has migrations `001` through `009`, run only:

```text
supabase/migrations/010_reporting_ai_tasks.sql
```

Open **Supabase → SQL Editor → New Query**, paste the entire migration and click **Run**.

Migration 010 adds:
- `leads.loss_stage`
- `leads.loss_reason`
- `leads.lost_date`
- `leads.won_date`
- `tasks.generated_by_ai`
- reporting indexes

For a brand-new database, run migrations `001` through `010` in numeric order.

## 2. Environment variables

Frontend / Supabase:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
NODE_ENV=production
```

AI proposal generation, vendor conversion, AI project tasks, QA generation and project assistant:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Zoho Books, if used:

```env
ZOHO_BOOKS_CLIENT_ID=...
ZOHO_BOOKS_CLIENT_SECRET=...
ZOHO_BOOKS_REDIRECT_URI=https://YOUR-RENDER-DOMAIN/api/zoho-books/callback
ZOHO_BOOKS_ACCOUNTS_URL=https://accounts.zoho.com
ZOHO_TOKEN_ENCRYPTION_KEY=...
ZOHO_OAUTH_STATE_SECRET=...
ZOHO_BOOKS_ITEM_ID=...
```

Never expose `SUPABASE_SERVICE_ROLE_KEY`, the Zoho client secret or token-encryption keys with a `VITE_` prefix.

## 3. Local run

```bash
npm install
npm run dev
```

Default local URL: `http://localhost:3000`.

## 4. Render

Use a **Web Service**.

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

## 5. Proposal workflows

### Client RFP / RFQ → Syskode proposal
1. Open **Proposals**.
2. Choose **AI from Client RFP / RFQ**.
3. Link the proposal to the real lead.
4. Upload the client's PDF.
5. Generate the proposal with Gemini.
6. Review and edit every generated section before sending.
7. Export using the approved Syskode PDF design.

### Vendor / competitor proposal → Syskode proposal
1. Open **Proposals**.
2. Choose **AI from Vendor Proposal**.
3. Upload the vendor/competitor PDF and enter the vendor name.
4. Leave heading fields blank to process the full proposal, or enter both headings to use only a specific range.
5. Review the generated Syskode sections before saving/exporting.

### Manual / clone
Use **Create Manually** for the approved Syskode template, or **Clone Existing Proposal** to start from a real previous builder proposal.

## 6. AI project tasks

Assign actual employees to a project first. Then open the project's **Tasks** tab and choose **Generate Tasks with AI**, or use the global Tasks page. Gemini receives the real project context and the members assigned to that project; it may only assign those members or leave a task `Unassigned`.

## 7. Reports

For accurate reporting:
- mark leads Won or Lost;
- when Lost, record the stage and loss reason;
- maintain project contract values;
- refresh/update Zoho Books invoice/payment statuses when used.

Reports then show won/lost counts and values, loss-stage graphs, pipeline, contract value, invoiced amount, money received and outstanding amount.

## 8. Proposal PDF design

The approved proposal uses Syskode's split layout, soft light-blue background, navy brand panel/strip, thin light-blue border on the light side, actual Syskode logo, smaller inner-page logo and Syskode watermark.
## 9. v11 database note

v11 does **not** add a database migration. If your v10 database already has migration `010_reporting_ai_tasks.sql`, no further SQL is required. Excel export runs in the browser and the new project QA form uses the existing test-case storage/schema.

