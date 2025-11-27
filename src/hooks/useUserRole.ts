import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type AppRole = "admin_geral" | "gerente_adega" | "operador";

interface UserRoleData {
  role: AppRole | null;
  adegaId: string | null;
  loading: boolean;
}

export const useUserRole = (): UserRoleData => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [adegaId, setAdegaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setRole(null);
        setAdegaId(null);
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
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, adegaId, loading };
};
