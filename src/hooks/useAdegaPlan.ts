import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "./useUserRole";

export type SubscriptionPlan = 'prata' | 'ouro' | 'diamante';

interface AdegaPlanInfo {
  plano: SubscriptionPlan;
  isLoading: boolean;
  // Limites do plano
  maxOperadores: number;
  podePersonalizarLogo: boolean;
  temRelatoriosAvancados: boolean;
  temTicketMedio: boolean;
  temModuloContabil: boolean;
}

const PLAN_FEATURES = {
  prata: {
    maxOperadores: 2,
    podePersonalizarLogo: false,
    temRelatoriosAvancados: false,
    temTicketMedio: false,
    temModuloContabil: false,
  },
  ouro: {
    maxOperadores: Infinity,
    podePersonalizarLogo: true,
    temRelatoriosAvancados: true,
    temTicketMedio: true,
    temModuloContabil: false,
  },
  diamante: {
    maxOperadores: Infinity,
    podePersonalizarLogo: true,
    temRelatoriosAvancados: true,
    temTicketMedio: true,
    temModuloContabil: true,
  },
};

export const useAdegaPlan = (): AdegaPlanInfo => {
  const { adegaId, loading: roleLoading } = useUserRole();
  const [plano, setPlano] = useState<SubscriptionPlan>('prata');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      if (roleLoading) return;
      
      if (!adegaId) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('adegas_public')
          .select('plano')
          .eq('id', adegaId)
          .maybeSingle();

        if (error) {
          console.error('Error fetching plan:', error);
          setIsLoading(false);
          return;
        }
        
        if (data?.plano) {
          setPlano(data.plano as SubscriptionPlan);
        }
      } catch (error) {
        console.error('Error fetching plan:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlan();
  }, [adegaId, roleLoading]);

  const features = PLAN_FEATURES[plano];

  return {
    plano,
    isLoading,
    maxOperadores: features.maxOperadores,
    podePersonalizarLogo: features.podePersonalizarLogo,
    temRelatoriosAvancados: features.temRelatoriosAvancados,
    temTicketMedio: features.temTicketMedio,
    temModuloContabil: features.temModuloContabil,
  };
};
