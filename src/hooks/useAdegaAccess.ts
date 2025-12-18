import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

interface AdegaAccessData {
  hasAccess: boolean;
  reason: string | null;
  loading: boolean;
  isTrialExpired: boolean;
  isBlocked: boolean;
}

export const useAdegaAccess = (): AdegaAccessData => {
  const { adegaId, role, loading: roleLoading } = useUserRole();
  const [hasAccess, setHasAccess] = useState(true);
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isTrialExpired, setIsTrialExpired] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    const checkAccess = async () => {
      // Admin geral always has access
      if (role === 'admin_geral') {
        setHasAccess(true);
        setReason(null);
        setLoading(false);
        return;
      }

      // If no adega_id, user can't access
      if (!adegaId) {
        setHasAccess(false);
        setReason("Usuário não está vinculado a nenhuma adega.");
        setLoading(false);
        return;
      }

      try {
        const { data: adega, error } = await supabase
          .from("adegas")
          .select("ativo, status_pagamento, is_trial, trial_expires_at, plano")
          .eq("id", adegaId)
          .single();

        if (error) throw error;

        if (!adega) {
          setHasAccess(false);
          setReason("Adega não encontrada.");
          setLoading(false);
          return;
        }

        // Check if adega is active
        if (!adega.ativo) {
          setHasAccess(false);
          setIsBlocked(true);
          setReason("Adega desativada. Entre em contato com o suporte.");
          setLoading(false);
          return;
        }

        // Check payment status
        if (adega.status_pagamento === 'bloqueado') {
          setHasAccess(false);
          setIsBlocked(true);
          setReason("Pagamento bloqueado. Entre em contato com o suporte.");
          setLoading(false);
          return;
        }

        // Check trial expiration
        if (adega.is_trial && adega.trial_expires_at) {
          const trialExpires = new Date(adega.trial_expires_at);
          const now = new Date();
          
          if (now > trialExpires) {
            setHasAccess(false);
            setIsTrialExpired(true);
            setReason("Período de teste expirado. Assine um plano para continuar.");
            setLoading(false);
            return;
          }
        }

        // All checks passed
        setHasAccess(true);
        setReason(null);
        setIsTrialExpired(false);
        setIsBlocked(false);
      } catch (error) {
        console.error("Error checking adega access:", error);
        setHasAccess(true); // On error, allow access to avoid blocking users
        setReason(null);
      } finally {
        setLoading(false);
      }
    };

    if (!roleLoading) {
      checkAccess();
    }
  }, [adegaId, role, roleLoading]);

  return { hasAccess, reason, loading: loading || roleLoading, isTrialExpired, isBlocked };
};
