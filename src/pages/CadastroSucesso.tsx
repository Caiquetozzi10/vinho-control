import { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wine, Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const CadastroSucesso = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const completeRegistration = async () => {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setError("Dados incompletos. Por favor, tente novamente.");
        setLoading(false);
        return;
      }

      try {
        const { data, error: funcError } = await supabase.functions.invoke('complete-registration', {
          body: { sessionId },
        });

        if (funcError) throw funcError;

        if (data?.success) {
          setSuccess(true);
          toast({
            title: "Cadastro realizado com sucesso!",
            description: "Sua conta foi criada. Faça login para começar.",
          });
        } else {
          throw new Error(data?.error || "Erro ao completar cadastro");
        }
      } catch (err: any) {
        console.error("Registration error:", err);
        setError(err.message || "Erro ao completar cadastro. Entre em contato com o suporte.");
      } finally {
        setLoading(false);
      }
    };

    completeRegistration();
  }, [searchParams, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
            <p className="text-lg font-medium text-foreground">Finalizando seu cadastro...</p>
            <p className="text-muted-foreground">Aguarde um momento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">❌</span>
            </div>
            <CardTitle className="text-2xl text-destructive">Erro no Cadastro</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link to="/signup">Tentar Novamente</Link>
            </Button>
            <Button variant="outline" asChild className="w-full">
              <Link to="/">Voltar ao Início</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-success" />
          </div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Wine className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AdegaStock</span>
          </div>
          <CardTitle className="text-2xl text-success">Cadastro Realizado!</CardTitle>
          <CardDescription>
            Sua conta foi criada com sucesso. Agora você pode acessar o sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Use o email e senha cadastrados para fazer login
            </p>
          </div>
          <Button 
            onClick={() => navigate("/login")} 
            className="w-full gradient-primary py-6 font-semibold"
          >
            Acessar Sistema
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroSucesso;
