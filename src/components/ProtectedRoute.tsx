import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session } from "@supabase/supabase-js";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdegaAccess } from "@/hooks/useAdegaAccess";
import { AlertTriangle, Clock, Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export const ProtectedRoute = ({ children, adminOnly = false }: ProtectedRouteProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { role, loading: roleLoading } = useUserRole();
  const { hasAccess, reason, loading: accessLoading, isTrialExpired, isBlocked } = useAdegaAccess();
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || roleLoading || accessLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // Check adega access (skip for admin_geral)
  if (!hasAccess && role !== 'admin_geral') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            {isTrialExpired ? (
              <Clock className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
            ) : isBlocked ? (
              <Lock className="h-16 w-16 mx-auto text-destructive mb-4" />
            ) : (
              <AlertTriangle className="h-16 w-16 mx-auto text-destructive mb-4" />
            )}
            <CardTitle className="text-2xl">
              {isTrialExpired ? "Período de Teste Expirado" : "Acesso Bloqueado"}
            </CardTitle>
            <CardDescription className="text-base">
              {reason}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            {isTrialExpired && (
              <Button asChild className="w-full">
                <a href="/assinatura">Ver Planos</a>
              </Button>
            )}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
            >
              Sair
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Operador só tem acesso a Vendas e Relatórios
  if (adminOnly && role === "operador") {
    return <Navigate to="/vendas" replace />;
  }

  // Gerente de adega (Admin Loja) não tem acesso às rotas de administração
  if (location.pathname.startsWith("/admin") && role === "gerente_adega") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};