-- Add plan column to adegas
CREATE TYPE public.subscription_plan AS ENUM ('prata', 'ouro');

ALTER TABLE public.adegas 
ADD COLUMN plano public.subscription_plan NOT NULL DEFAULT 'prata';

-- Add stripe_customer_id and stripe_subscription_id for tracking
ALTER TABLE public.adegas 
ADD COLUMN stripe_customer_id text,
ADD COLUMN stripe_subscription_id text;