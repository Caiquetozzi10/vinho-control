import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = "admin_geral" | "gerente_adega" | "operador";

interface UserRoleData {
  role: AppRole | null;
  adegaId: string | null;
  adegaNome: string | null;
  loading: boolean;
}

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [adegaId, setAdegaId] = useState<string | null>(null);
  const [adegaNome, setAdegaNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setAdegaId(null);
        setAdegaNome(null);
        setLoading(false);
        return;
      }

      try {
        // Get user role
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role, adega_id")
          .eq("user_id", user.id)
          .single();

        if (roleData) {
          setRole(roleData.role as AppRole);
          setAdegaId(roleData.adega_id);

          // Fetch adega name if adega_id exists
          if (roleData.adega_id) {
            const { data: adegaData } = await supabase
              .from("adegas")
              .select("nome")
              .eq("id", roleData.adega_id)
              .single();
            
            if (adegaData) {
              setAdegaNome(adegaData.nome);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, adegaId, adegaNome, loading };
};
