import { useState, useEffect, useRef } from "react";
import { useAdegaPlan } from "@/hooks/useAdegaPlan";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Crown, Users, BarChart3, Image, Check, ExternalLink, Loader2, Upload, Trash2 } from "lucide-react";

const PLAN_DETAILS = {
  prata: {
    name: "Plano Prata",
    price: "R$ 49,90/mês",
    features: [
      { label: "Até 2 operadores", included: true },
      { label: "Gestão de produtos e vendas", included: true },
      { label: "Relatórios básicos", included: true },
      { label: "Logo personalizada", included: false },
      { label: "Relatórios avançados", included: false },
      { label: "Operadores ilimitados", included: false },
    ],
  },
  ouro: {
    name: "Plano Ouro",
    price: "R$ 99,90/mês",
    features: [
      { label: "Operadores ilimitados", included: true },
      { label: "Gestão de produtos e vendas", included: true },
      { label: "Relatórios básicos", included: true },
      { label: "Logo personalizada", included: true },
      { label: "Relatórios avançados", included: true },
      { label: "Suporte prioritário", included: true },
    ],
  },
};

export default function Assinatura() {
  const { plano, isLoading, maxOperadores, podePersonalizarLogo, temRelatoriosAvancados } = useAdegaPlan();
  const { adegaId } = useUserRole();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (adegaId) {
      fetchCurrentLogo();
    }
  }, [adegaId]);

  const fetchCurrentLogo = async () => {
    if (!adegaId) return;
    const { data } = await supabase
      .from("adegas")
      .select("logo_url")
      .eq("id", adegaId)
      .single();
    if (data?.logo_url) {
      setCurrentLogo(data.logo_url);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adegaId) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${adegaId}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("adega-logos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("adega-logos")
        .getPublicUrl(fileName);

      const logoUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("adegas")
        .update({ logo_url: logoUrlWithTimestamp })
        .eq("id", adegaId);

      if (updateError) throw updateError;

      setCurrentLogo(logoUrlWithTimestamp);
      toast.success("Logo atualizada com sucesso!");
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast.error("Erro ao fazer upload da logo");
    } finally {
      setUploadingLogo(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveLogo = async () => {
    if (!adegaId) return;
    
    setUploadingLogo(true);
    try {
      const { error: updateError } = await supabase
        .from("adegas")
        .update({ logo_url: null })
        .eq("id", adegaId);

      if (updateError) throw updateError;

      setCurrentLogo(null);
      toast.success("Logo removida com sucesso!");
    } catch (error: any) {
      console.error("Erro ao remover logo:", error);
      toast.error("Erro ao remover logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { data, error } = await supabase.functions.invoke('customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, '_blank');
      }
    } catch (error: any) {
      console.error('Error opening customer portal:', error);
      toast.error("Erro ao abrir portal de gerenciamento");
    } finally {
      setLoadingPortal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const currentPlan = PLAN_DETAILS[plano];
  const otherPlan = plano === 'prata' ? PLAN_DETAILS.ouro : PLAN_DETAILS.prata;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Minha Assinatura</h1>
        <p className="text-muted-foreground">Gerencie seu plano e veja os benefícios inclusos</p>
      </div>

      {/* Current Plan */}
      <Card className="border-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className={`h-6 w-6 ${plano === 'ouro' ? 'text-yellow-500' : 'text-slate-400'}`} />
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentPlan.name}
                  <Badge variant="default">Atual</Badge>
                </CardTitle>
                <CardDescription>{currentPlan.price}</CardDescription>
              </div>
            </div>
            <Button onClick={handleManageSubscription} disabled={loadingPortal}>
              {loadingPortal ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ExternalLink className="h-4 w-4 mr-2" />
              )}
              Gerenciar Assinatura
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Operadores</p>
                <p className="text-2xl font-bold">
                  {maxOperadores === Infinity ? "Ilimitados" : `Até ${maxOperadores}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <Image className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Logo Personalizada</p>
                <p className="text-2xl font-bold">{podePersonalizarLogo ? "Sim" : "Não"}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Relatórios Avançados</p>
                <p className="text-2xl font-bold">{temRelatoriosAvancados ? "Sim" : "Não"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload Section - Only for Ouro plan */}
      {podePersonalizarLogo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5 text-primary" />
              Logo Personalizada
            </CardTitle>
            <CardDescription>
              Faça upload da logo da sua adega para exibir no canto superior esquerdo do sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative w-24 h-24 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center overflow-hidden bg-muted/50">
                {currentLogo ? (
                  <img
                    src={currentLogo}
                    alt="Logo da adega"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <Image className="h-8 w-8 text-muted-foreground/50" />
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingLogo}
                >
                  {uploadingLogo ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {currentLogo ? "Alterar Logo" : "Fazer Upload"}
                </Button>
                {currentLogo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={uploadingLogo}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover Logo
                  </Button>
                )}
                <p className="text-xs text-muted-foreground">
                  PNG, JPG ou SVG. Máximo 2MB.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plan Comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className={plano === 'prata' ? 'border-primary' : ''}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-slate-400" />
              Plano Prata
              {plano === 'prata' && <Badge variant="secondary">Seu plano</Badge>}
            </CardTitle>
            <CardDescription className="text-2xl font-bold">R$ 49,90/mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLAN_DETAILS.prata.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className={`h-4 w-4 ${feature.included ? 'text-green-500' : 'text-muted-foreground/30'}`} />
                  <span className={feature.included ? '' : 'text-muted-foreground line-through'}>
                    {feature.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className={plano === 'ouro' ? 'border-primary' : 'border-yellow-500/50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Plano Ouro
              {plano === 'ouro' && <Badge variant="secondary">Seu plano</Badge>}
            </CardTitle>
            <CardDescription className="text-2xl font-bold">R$ 99,90/mês</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {PLAN_DETAILS.ouro.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span>{feature.label}</span>
                </li>
              ))}
            </ul>
            {plano === 'prata' && (
              <Button 
                className="w-full mt-6" 
                onClick={handleManageSubscription}
                disabled={loadingPortal}
              >
                {loadingPortal ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Fazer Upgrade
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Help Section */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Precisa de ajuda com sua assinatura? Entre em contato pelo email{" "}
            <a href="mailto:contato@techonesolutions.com.br" className="text-primary hover:underline">
              contato@techonesolutions.com.br
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
