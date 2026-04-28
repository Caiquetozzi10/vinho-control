import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import logoAdegastock from "@/assets/logo-adegastock.png";
const loginSchema = z.object({
  email: z.string().email({
    message: "E-mail inválido"
  }),
  password: z.string().min(6, {
    message: "Senha deve ter no mínimo 6 caracteres"
  })
});
export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      if (session) {
        navigate("/dashboard");
      }
    });
  }, [navigate]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      loginSchema.parse({
        email,
        password
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        if (error.message.includes("Invalid login")) {
          toast.error("E-mail ou senha incorretos");
        } else {
          toast.error(error.message);
        }
        return;
      }
      if (data.user) {
        // Check if user is active
        const { data: profile } = await supabase
          .from("profiles")
          .select("ativo, adega_id")
          .eq("id", data.user.id)
          .maybeSingle();

        if (profile && profile.ativo === false) {
          await supabase.auth.signOut();
          toast.error("Seu acesso está bloqueado. Entre em contato com o administrador.");
          return;
        }

        // Check user role to redirect appropriately
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user.id)
          .maybeSingle();

        // Admin geral não está vinculado a adega — pular checagem de pagamento
        if (roleData?.role !== "admin_geral" && profile?.adega_id) {
          const { data: adega } = await supabase
            .from("adegas_public")
            .select("status_pagamento")
            .eq("id", profile.adega_id)
            .maybeSingle();

          if (adega?.status_pagamento === "bloqueado") {
            await supabase.auth.signOut();
            toast.error("Seu acesso está bloqueado por falta de pagamento. Entre em contato com o administrador.");
            return;
          }
        }

        toast.success("Login realizado com sucesso!");

        // Operador vai direto para vendas, demais para dashboard
        if (roleData?.role === "operador") {
          navigate("/vendas");
        } else {
          navigate("/dashboard");
        }
      }
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setLoading(false);
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-subtle p-4">
      <Card className="w-full max-w-md shadow-lg rounded-sm">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <img alt="AdegaStock Logo" className="h-32 w-auto border-primary-foreground border shadow-none" src="/lovable-uploads/fb574f1b-d4fc-49ea-8134-3e254d1e4bb7.png" />
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </> : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>;
}