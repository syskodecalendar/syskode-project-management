# v8 — JavaScript Proposal & RFQ Studio

## Proposal design
- Reworked exported PDF to follow Syskode's established proposal language: warm off-white pages, strong black section titles, horizontal rules, subtle geometric corner motifs, clean tables, generous whitespace, prepared-for / created-by cover metadata, proposal number/date, website/copyright footer and page numbering.
- Removed timestamps/timing from proposal footers.
- Added a matching A4-style live preview inside the Proposal Builder.
- Standard proposal template follows the established structure: Cover Letter, About Us, Software Innovation, Introduction, Project Deliverables, Timeline, Pricing, Contract Terms, Process, QA/Change Request, Acceptance/Terms, Cancellation/Copyright/Delivery and Acceptance signatures.

## RFQ → AI proposal
- Upload a client RFQ PDF to an existing proposal shell.
- Gemini reads the RFQ and generates a full editable Syskode proposal section by section.
- Supports headings, subheadings, paragraphs, bullet points and tables.
- Can replace the existing sections or append generated RFQ sections.
- Stores uploaded RFQs privately in Supabase Storage.
- Avoids inventing prices, client names, certifications, guarantees or legal claims when they are not in the RFQ.

## Existing Proposal Studio retained
- Table block builder.
- Image and signature blocks.
- Clone full proposals.
- Copy selected sections from another proposal.
- Vendor proposal AI range import and Syskode rebranding.
- Lead-linked proposals and PDF export.

## JavaScript conversion
- All application source is JavaScript/JSX.
- Removed TypeScript/TSX source files, tsconfig, TypeScript runtime tooling and TypeScript type packages.
- `server.js`, `vite.config.js`, `src/**/*.js` and `src/**/*.jsx` are now the maintained source.

## Database
Run `supabase/migrations/009_rfq_proposal_builder.sql` after migrations 001–008.
