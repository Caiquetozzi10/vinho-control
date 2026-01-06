import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "admin_geral" | "gerente_adega" | "operador";

interface UserRoleData {
  role: AppRole | null;
  adegaId: string | null;
  adegaNome: string | null;
  loading: boolean;
}

export const useUserRole = (): UserRoleData => {
  const [role, setRole] = useState<AppRole | null>(null);
  const [adegaId, setAdegaId] = useState<string | null>(null);
  const [adegaNome, setAdegaNome] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setAdegaId(null);
          setAdegaNome(null);
          setLoading(false);
          return;
        }

        // Get user role
        const { data: roleData, error: roleError } = await supabase
          .from("user_roles")
          .select("role, adega_id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleError) {
          console.error("Error fetching role:", roleError);
          setLoading(false);
          return;
        }

        if (roleData) {
          setRole(roleData.role as AppRole);
          setAdegaId(roleData.adega_id);

          // Fetch adega name if adega_id exists
          if (roleData.adega_id) {
            const { data: adegaData } = await supabase
              .from("adegas_public")
              .select("nome")
              .eq("id", roleData.adega_id)
              .maybeSingle();
            
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchUserRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { role, adegaId, adegaNome, loading };
};
