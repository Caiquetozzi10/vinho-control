import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Wine, ArrowLeft, ArrowRight, Check, Star, CreditCard, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";

const signupSchema = z.object({
  nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  nomeAdega: z.string().min(2, "Nome da adega deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  telefone: z.string().min(10, "Telefone inválido"),
  senha: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  confirmarSenha: z.string(),
}).refine((data) => data.senha === data.confirmarSenha, {
  message: "As senhas não coincidem",
  path: ["confirmarSenha"],
});

type SignupData = z.infer<typeof signupSchema>;

const Signup = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [plano, setPlano] = useState(searchParams.get("plan") || "ouro");
  const [formData, setFormData] = useState<Partial<SignupData>>({
    nomeCompleto: "",
    nomeAdega: "",
    email: "",
    telefone: "",
    senha: "",
    confirmarSenha: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof SignupData, string>>>({});

  useEffect(() => {
    // Check if already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/");
      }
    });
  }, [navigate]);

  const handleInputChange = (field: keyof SignupData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateStep1 = () => {
    const partialSchema = z.object({
      nomeCompleto: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
      nomeAdega: z.string().min(2, "Nome da adega deve ter pelo menos 2 caracteres"),
      email: z.string().email("Email inválido"),
      telefone: z.string().min(10, "Telefone inválido"),
    });

    const result = partialSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupData, string>> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof SignupData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    const result = signupSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof SignupData, string>> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as keyof SignupData] = err.message;
        }
      });
      setErrors(fieldErrors);
      return false;
    }
    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const PRICE_IDS = {
    prata: "price_1SdMAE056ZndHVpeI0NNl7IC",
    ouro: "price_1SdMCI056ZndHVpeLiqbs6mU",
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const priceId = PRICE_IDS[plano as keyof typeof PRICE_IDS];
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: {
          priceId,
          nomeAdega: formData.nomeAdega,
          nomeCompleto: formData.nomeCompleto,
          email: formData.email,
          password: formData.senha,
        },
      });

      if (error) throw error;
      
      if (data?.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não recebida");
      }
      
    } catch (error: any) {
      toast({
        title: "Erro ao processar",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const planos = [
    {
      id: "prata",
      nome: "Plano Prata",
      preco: "R$ 49",
      periodo: "/mês",
      features: ["Gestão de Produtos", "PDV", "Relatório Diário", "Até 2 operadores"],
      color: "silver",
    },
    {
      id: "ouro",
      nome: "Plano Ouro",
      preco: "R$ 99",
      periodo: "/mês",
      features: ["Tudo do Prata +", "Relatórios Avançados", "Operadores ilimitados", "Logo personalizado", "Suporte prioritário"],
      color: "gold",
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Wine className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AdegaStock</span>
          </Link>
          <Link to="/login">
            <Button variant="ghost" className="font-medium">
              Já tenho conta
            </Button>
          </Link>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-center gap-4 md:gap-8">
            {[
              { num: 1, label: "Dados da Conta" },
              { num: 2, label: "Senha" },
              { num: 3, label: "Pagamento" },
            ].map((s, index) => (
              <div key={s.num} className="flex items-center gap-2 md:gap-4">
                <div className={`flex items-center gap-2 ${step >= s.num ? "text-primary" : "text-muted-foreground"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    step > s.num 
                      ? "bg-success text-success-foreground" 
                      : step === s.num 
                        ? "gradient-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                  }`}>
                    {step > s.num ? <Check className="w-4 h-4" /> : s.num}
                  </div>
                  <span className="hidden md:inline font-medium">{s.label}</span>
                </div>
                {index < 2 && (
                  <div className={`w-8 md:w-16 h-0.5 ${step > s.num ? "bg-success" : "bg-muted"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 py-8 px-4">
        <div className="container mx-auto max-w-2xl">
          {/* Step 1: Account Data */}
          {step === 1 && (
            <Card className="border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Dados da sua Conta</CardTitle>
                <CardDescription>Preencha as informações da sua adega</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nomeCompleto">Nome Completo *</Label>
                    <Input
                      id="nomeCompleto"
                      placeholder="Seu nome completo"
                      value={formData.nomeCompleto}
                      onChange={(e) => handleInputChange("nomeCompleto", e.target.value)}
                      className={errors.nomeCompleto ? "border-destructive" : ""}
                    />
                    {errors.nomeCompleto && (
                      <p className="text-sm text-destructive">{errors.nomeCompleto}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomeAdega">Nome da Adega *</Label>
                    <Input
                      id="nomeAdega"
                      placeholder="Ex: Adega do João"
                      value={formData.nomeAdega}
                      onChange={(e) => handleInputChange("nomeAdega", e.target.value)}
                      className={errors.nomeAdega ? "border-destructive" : ""}
                    />
                    {errors.nomeAdega && (
                      <p className="text-sm text-destructive">{errors.nomeAdega}</p>
                    )}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className={errors.email ? "border-destructive" : ""}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone *</Label>
                    <Input
                      id="telefone"
                      placeholder="(11) 99999-9999"
                      value={formData.telefone}
                      onChange={(e) => handleInputChange("telefone", e.target.value)}
                      className={errors.telefone ? "border-destructive" : ""}
                    />
                    {errors.telefone && (
                      <p className="text-sm text-destructive">{errors.telefone}</p>
                    )}
                  </div>
                </div>

                {/* Plan Selection */}
                <div className="space-y-4 pt-4">
                  <Label>Escolha seu Plano</Label>
                  <RadioGroup value={plano} onValueChange={setPlano} className="grid md:grid-cols-2 gap-4">
                    {planos.map((p) => (
                      <label
                        key={p.id}
                        htmlFor={p.id}
                        className={`relative flex flex-col p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          plano === p.id 
                            ? p.id === "ouro" 
                              ? "border-gold bg-gold/5" 
                              : "border-silver bg-silver/5"
                            : "border-border hover:border-muted-foreground/50"
                        }`}
                      >
                        <RadioGroupItem value={p.id} id={p.id} className="sr-only" />
                        {p.popular && (
                          <Badge className="absolute -top-2 right-2 bg-gold text-primary-foreground text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            Popular
                          </Badge>
                        )}
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-semibold text-foreground">{p.nome}</span>
                          <div>
                            <span className={`text-xl font-bold ${p.id === "ouro" ? "text-gold" : "text-silver"}`}>
                              {p.preco}
                            </span>
                            <span className="text-muted-foreground text-sm">{p.periodo}</span>
                          </div>
                        </div>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {p.features.map((f, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <Check className={`w-3 h-3 ${p.id === "ouro" ? "text-gold" : "text-silver"}`} />
                              {f}
                            </li>
                          ))}
                        </ul>
                      </label>
                    ))}
                  </RadioGroup>
                </div>

                <Button onClick={handleNextStep} className="w-full gradient-primary py-6 font-semibold">
                  Continuar
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Password */}
          {step === 2 && (
            <Card className="border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Crie sua Senha</CardTitle>
                <CardDescription>Escolha uma senha segura para sua conta</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.senha}
                    onChange={(e) => handleInputChange("senha", e.target.value)}
                    className={errors.senha ? "border-destructive" : ""}
                  />
                  {errors.senha && (
                    <p className="text-sm text-destructive">{errors.senha}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmarSenha">Confirmar Senha *</Label>
                  <Input
                    id="confirmarSenha"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange("confirmarSenha", e.target.value)}
                    className={errors.confirmarSenha ? "border-destructive" : ""}
                  />
                  {errors.confirmarSenha && (
                    <p className="text-sm text-destructive">{errors.confirmarSenha}</p>
                  )}
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={handlePrevStep} className="flex-1 py-6">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Voltar
                  </Button>
                  <Button onClick={handleNextStep} className="flex-1 gradient-primary py-6 font-semibold">
                    Continuar
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Payment */}
          {step === 3 && (
            <Card className="border-border">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Finalizar Cadastro</CardTitle>
                <CardDescription>Revise seus dados e realize o pagamento</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Order Summary */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-foreground">Resumo do Pedido</h3>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium text-foreground">
                        {plano === "ouro" ? "Plano Ouro" : "Plano Prata"}
                      </p>
                      <p className="text-sm text-muted-foreground">Cobrança mensal</p>
                    </div>
                    <p className={`text-xl font-bold ${plano === "ouro" ? "text-gold" : "text-silver"}`}>
                      {plano === "ouro" ? "R$ 99" : "R$ 49"}/mês
                    </p>
                  </div>
                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Adega:</span>
                      <span className="text-foreground">{formData.nomeAdega}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Email:</span>
                      <span className="text-foreground">{formData.email}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span className="font-medium text-foreground">Pagamento Seguro</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ao clicar em "Finalizar Cadastro", você será redirecionado para o checkout seguro do Stripe para inserir seus dados de pagamento.
                  </p>
                </div>

                {/* Trial info */}
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-success" />
                    <div>
                      <p className="font-medium text-foreground">7 dias grátis para testar!</p>
                      <p className="text-sm text-muted-foreground">
                        Você só será cobrado após o período de teste. Cancele quando quiser.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-4">
                  <Button variant="outline" onClick={handlePrevStep} className="flex-1 py-6">
                    <ArrowLeft className="mr-2 w-4 h-4" />
                    Voltar
                  </Button>
                  <Button 
                    onClick={handleSubmit} 
                    className={`flex-1 py-6 font-semibold ${
                      plano === "ouro" 
                        ? "bg-gold hover:bg-gold/90 text-primary-foreground" 
                        : "gradient-primary"
                    }`}
                    disabled={loading}
                  >
                    {loading ? (
                      "Processando..."
                    ) : (
                      <>
                        <Lock className="mr-2 w-4 h-4" />
                        Finalizar Cadastro
                      </>
                    )}
                  </Button>
                </div>

                <p className="text-center text-xs text-muted-foreground">
                  Ao continuar, você concorda com nossos{" "}
                  <a href="#" className="text-primary hover:underline">Termos de Uso</a>
                  {" "}e{" "}
                  <a href="#" className="text-primary hover:underline">Política de Privacidade</a>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Signup;
