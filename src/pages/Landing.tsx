import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Wine, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Users, 
  Shield, 
  Check, 
  ArrowRight,
  Smartphone,
  Clock,
  TrendingUp,
  Store,
  Zap,
  Star
} from "lucide-react";

const Landing = () => {
  const featuresBasic = [
    { icon: Package, text: "Gestão de Produtos" },
    { icon: ShoppingCart, text: "Ponto de Venda (PDV)" },
    { icon: BarChart3, text: "Relatório Diário" },
    { icon: Users, text: "Até 2 operadores" },
    { icon: Smartphone, text: "Acesso via navegador" },
    { icon: Shield, text: "Backup automático" },
  ];

  const featuresGold = [
    { icon: Package, text: "Gestão de Produtos Ilimitada" },
    { icon: ShoppingCart, text: "Ponto de Venda (PDV)" },
    { icon: BarChart3, text: "Relatórios Avançados" },
    { icon: Users, text: "Operadores ilimitados" },
    { icon: Smartphone, text: "Acesso via navegador" },
    { icon: Shield, text: "Backup automático" },
    { icon: TrendingUp, text: "Análise de desempenho" },
    { icon: Store, text: "Logo personalizado" },
    { icon: Clock, text: "Suporte prioritário" },
  ];

  const allFeatures = [
    {
      icon: Package,
      title: "Controle de Estoque",
      description: "Gerencie seus produtos com alertas de estoque baixo e código de barras"
    },
    {
      icon: ShoppingCart,
      title: "PDV Intuitivo",
      description: "Sistema de vendas rápido e fácil de usar para seus funcionários"
    },
    {
      icon: BarChart3,
      title: "Relatórios Detalhados",
      description: "Acompanhe vendas, lucros e desempenho com gráficos claros"
    },
    {
      icon: Users,
      title: "Multi-usuários",
      description: "Crie contas para gerentes e operadores com permissões diferentes"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Seus dados protegidos com backup automático na nuvem"
    },
    {
      icon: Zap,
      title: "Super Rápido",
      description: "Sistema leve que funciona em qualquer dispositivo com internet"
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center">
              <Wine className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">AdegaStock</span>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" className="font-medium">
                Entrar
              </Button>
            </Link>
            <Link to="/signup">
              <Button className="gradient-primary font-medium">
                Cadastre-se
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-gold/5" />
        <div className="container mx-auto text-center relative z-10">
          <Badge className="mb-6 px-4 py-1.5 text-sm font-medium bg-primary/10 text-primary border-primary/20">
            🍷 Sistema completo para sua adega
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Gerencie sua Adega com
            <span className="bg-gradient-to-r from-primary to-primary-dark bg-clip-text text-transparent"> Simplicidade</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Controle de estoque, ponto de venda, relatórios e muito mais. 
            Tudo o que você precisa para sua adega crescer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-lg px-8 py-6 font-semibold shadow-lg hover:shadow-xl transition-all">
                Começar Grátis por 7 Dias
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#planos">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 font-semibold">
                Ver Planos
              </Button>
            </a>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: "500+", label: "Adegas ativas" },
              { value: "50k+", label: "Vendas/mês" },
              { value: "99.9%", label: "Uptime" },
              { value: "4.9", label: "Avaliação ⭐" },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tudo que sua Adega Precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Funcionalidades desenvolvidas especialmente para o dia a dia de adegas e distribuidoras de bebidas
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allFeatures.map((feature, index) => (
              <Card key={index} className="bg-card hover:shadow-lg transition-all duration-300 border-border/50 group">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshots Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Interface Moderna e Intuitiva
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Desenvolvido para ser simples de usar, sem treinamento complicado
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-card rounded-xl p-4 shadow-lg border border-border/50">
              <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Package className="w-12 h-12 text-primary mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">Gestão de Produtos</span>
                </div>
              </div>
              <p className="mt-4 text-center font-medium text-foreground">Controle total do estoque</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-lg border border-border/50">
              <div className="aspect-video bg-gradient-to-br from-success/10 to-success/5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <ShoppingCart className="w-12 h-12 text-success mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">Ponto de Venda</span>
                </div>
              </div>
              <p className="mt-4 text-center font-medium text-foreground">Vendas rápidas e fáceis</p>
            </div>
            <div className="bg-card rounded-xl p-4 shadow-lg border border-border/50">
              <div className="aspect-video bg-gradient-to-br from-gold/10 to-gold/5 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="w-12 h-12 text-gold mx-auto mb-2" />
                  <span className="text-sm text-muted-foreground">Relatórios</span>
                </div>
              </div>
              <p className="mt-4 text-center font-medium text-foreground">Análises detalhadas</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Escolha o Plano Ideal
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Planos flexíveis que crescem junto com o seu negócio
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plano Prata */}
            <Card className="relative bg-card border-2 border-silver/30 hover:border-silver transition-all duration-300 hover:shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-silver text-primary-foreground px-4 py-1 text-sm font-semibold">
                  PRATA
                </Badge>
              </div>
              <CardHeader className="text-center pt-8 pb-4">
                <CardTitle className="text-2xl text-foreground">Plano Prata</CardTitle>
                <CardDescription className="text-base">Ideal para pequenas adegas</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-foreground">R$ 49</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {featuresBasic.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-silver/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-silver" />
                      </div>
                      <span className="text-foreground">{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup?plan=prata" className="block mt-8">
                  <Button variant="outline" className="w-full border-silver text-foreground hover:bg-silver/10 font-semibold py-6">
                    Começar com Prata
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plano Ouro */}
            <Card className="relative bg-card border-2 border-gold shadow-xl hover:shadow-2xl transition-all duration-300 scale-[1.02]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-gold text-primary-foreground px-4 py-1 text-sm font-semibold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  OURO
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs">
                  MAIS POPULAR
                </Badge>
              </div>
              <CardHeader className="text-center pt-8 pb-4">
                <CardTitle className="text-2xl text-foreground">Plano Ouro</CardTitle>
                <CardDescription className="text-base">Para adegas que querem crescer</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gold">R$ 99</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4">
                <ul className="space-y-3">
                  {featuresGold.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-gold" />
                      </div>
                      <span className="text-foreground">{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup?plan=ouro" className="block mt-8">
                  <Button className="w-full bg-gold hover:bg-gold/90 text-primary-foreground font-semibold py-6">
                    Começar com Ouro
                    <Star className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-muted-foreground mt-8">
            Todos os planos incluem 7 dias de teste grátis. Cancele quando quiser.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <Card className="gradient-primary border-0 overflow-hidden">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
                Pronto para Transformar sua Adega?
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Junte-se a centenas de adegas que já usam o AdegaStock para crescer seus negócios
              </p>
              <Link to="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-6 font-semibold">
                  Criar Conta Grátis
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-muted/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <Wine className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">AdegaStock</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © {new Date().getFullYear()} AdegaStock. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Termos de Uso
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
                Contato
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
