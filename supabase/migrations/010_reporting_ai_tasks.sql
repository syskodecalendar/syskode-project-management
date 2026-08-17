-- Syskode Project Hub v10: reporting lifecycle fields + AI task metadata
-- Run after 009_rfq_proposal_builder.sql.

ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS loss_stage TEXT,
  ADD COLUMN IF NOT EXISTS loss_reason TEXT,
  ADD COLUMN IF NOT EXISTS lost_date DATE,
  ADD COLUMN IF NOT EXISTS won_date DATE;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS generated_by_ai BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_leads_status_loss_stage ON public.leads(status, loss_stage);
CREATE INDEX IF NOT EXISTS idx_tasks_due_status ON public.tasks(due_date, status);
