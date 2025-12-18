-- Add trial fields to adegas table
ALTER TABLE public.adegas 
ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_trial BOOLEAN NOT NULL DEFAULT false;

-- Create index for trial expiration queries
CREATE INDEX IF NOT EXISTS idx_adegas_trial_expires ON public.adegas(trial_expires_at) WHERE is_trial = true;