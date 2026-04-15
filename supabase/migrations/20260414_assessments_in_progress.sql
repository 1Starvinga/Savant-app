-- Add in-progress assessment support columns

ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'complete')),
  ADD COLUMN IF NOT EXISTS current_stretch_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS findings_data jsonb NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS assessments_updated_at ON public.assessments;
CREATE TRIGGER assessments_updated_at
  BEFORE UPDATE ON public.assessments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Backfill existing rows (if any) with status = 'complete'
UPDATE public.assessments SET status = 'complete' WHERE status = 'in_progress' AND findings IS NOT NULL AND findings != '{}';
