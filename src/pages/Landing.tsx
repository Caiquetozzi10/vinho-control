import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
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
  Star,
  AlertCircle,
  DollarSign,
  PieChart,
  Calculator,
  Receipt,
  Wallet,
  Target,
  ChevronDown,
  Gem,
  LineChart,
  FileText,
  HelpCircle
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import logoAdegaStock from "@/assets/logo-adegastock-novo.png";

const Landing = () => {
  const featuresBasic = [
    { text: "Gestão de Produtos" },
    { text: "Ponto de Venda (PDV)" },
    { text: "Relatórios básicos" },
    { text: "Até 2 operadores" },
    { text: "Backup automático" },
  ];

  const featuresGold = [
    { text: "Tudo do Prata" },
    { text: "Produtos ilimitados" },
    { text: "Operadores ilimitados" },
    { text: "Relatórios avançados" },
    { text: "Análise de desempenho" },
    { text: "Ticket médio" },
    { text: "Logo personalizado" },
    { text: "Suporte prioritário" },
  ];

  const featuresDiamond = [
    { text: "Tudo do Plano Ouro" },
    { text: "Módulo contábil integrado" },
    { text: "Controle financeiro automático" },
    { text: "Fluxo de caixa" },
    { text: "Apuração de lucro real" },
    { text: "CMV e margem por produto" },
    { text: "Relatórios financeiros completos" },
    { text: "Visão clara de lucro ou prejuízo" },
  ];

  const mainFeatures = [
    {
      icon: Package,
      title: "Controle de Estoque Inteligente",
      description: "Entrada e saída automática, alertas de estoque baixo e suporte a código de barras",
      color: "text-primary"
    },
    {
      icon: ShoppingCart,
      title: "PDV Rápido e Intuitivo",
      description: "Venda em poucos cliques, ideal para balcão e atendimento ágil",
      color: "text-success"
    },
    {
      icon: BarChart3,
      title: "Relatórios que Fazem Sentido",
      description: "Produtos mais vendidos, dias e horários de pico, desempenho por funcionário",
      color: "text-gold"
    },
    {
      icon: Users,
      title: "Multiusuários com Permissões",
      description: "Controle total de acesso para gerentes e operadores",
      color: "text-primary"
    },
    {
      icon: Shield,
      title: "Segurança Total",
      description: "Backup automático na nuvem, seus dados sempre protegidos",
      color: "text-success"
    },
    {
      icon: Zap,
      title: "Sistema Leve e Rápido",
      description: "Funciona em qualquer dispositivo com internet, sem instalação",
      color: "text-warning"
    },
  ];

  const painPoints = [
    { icon: Package, text: "Não saber o estoque real da adega" },
    { icon: DollarSign, text: "Comprar errado e perder dinheiro" },
    { icon: AlertCircle, text: "Ver dinheiro entrar, mas não saber se está lucrando" },
    { icon: FileText, text: "Controle financeiro feito em papel ou planilha" },
    { icon: Target, text: "Sistemas genéricos que não conversam com estoque" },
  ];

  const contabilFeatures = [
    { icon: Wallet, text: "Controle de entradas e saídas financeiras" },
    { icon: TrendingUp, text: "Integração automática com vendas e estoque" },
    { icon: PieChart, text: "Apuração automática de lucro e prejuízo" },
    { icon: Calculator, text: "Custo de Mercadoria Vendida (CMV)" },
    { icon: Target, text: "Margem de lucro por produto" },
    { icon: LineChart, text: "Fluxo de caixa diário, mensal e anual" },
    { icon: Receipt, text: "Classificação de despesas e receitas" },
    { icon: BarChart3, text: "Visão clara se a adega está lucrando ou apenas girando caixa" },
  ];

  const faqs = [
    {
      question: "Preciso entender de contabilidade?",
      answer: "Não. O sistema foi feito para ser simples e direto. Você verá números claros de entradas, saídas e lucro, sem termos técnicos complicados."
    },
    {
      question: "Isso substitui um contador?",
      answer: "Não. Ele organiza os números para que você tenha clareza e facilite o trabalho do contador. É uma ferramenta de gestão, não contábil."
    },
    {
      question: "Funciona para qualquer tamanho de adega?",
      answer: "Sim, de pequenas adegas de bairro até grandes operações com múltiplos funcionários."
    },
    {
      question: "Preciso de cartão de crédito para testar?",
      answer: "Não. Você pode testar o sistema gratuitamente por 7 dias sem cadastrar cartão de crédito."
    },
    {
      question: "Posso cancelar a qualquer momento?",
      answer: "Sim, o cancelamento é simples e pode ser feito a qualquer momento diretamente no sistema."
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={logoAdegaStock} alt="AdegaStock" className="h-14 w-auto" />
          </Link>
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
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-diamond/5" />
        <div className="container mx-auto text-center relative z-10">
          {/* Logo centralizado */}
          <div className="mb-10">
            <img src={logoAdegaStock} alt="AdegaStock" className="h-56 md:h-72 w-auto mx-auto" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight max-w-4xl mx-auto">
            Controle total da sua Adega,
            <span className="bg-gradient-to-r from-primary to-diamond bg-clip-text text-transparent"> do estoque à saúde financeira</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Gerencie estoque, vendas e resultados financeiros em um único sistema simples, rápido e feito sob medida para adegas e bares.
          </p>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-8 font-medium">
            Pare de vender no escuro. Saiba exatamente o que entra, o que sai, e se você realmente está lucrando.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button size="lg" className="gradient-primary text-lg px-8 py-6 font-semibold shadow-lg hover:shadow-xl transition-all">
                Começar grátis por 7 dias
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <a href="#planos">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 font-semibold">
                Ver planos
              </Button>
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-4">
            Sem cartão de crédito • Cancelamento simples
          </p>
          
          {/* Stats - Prova Social */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            {[
              { value: "500+", label: "Adegas ativas" },
              { value: "50k+", label: "Vendas/mês" },
              { value: "99,9%", label: "Uptime" },
              { value: "4.9 ⭐", label: "Avaliação média" },
            ].map((stat, index) => (
              <div key={index} className="text-center p-4 rounded-lg bg-card border border-border/50">
                <div className="text-2xl md:text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Você se identifica com isso?
            </h2>
          </div>
          
          <div className="space-y-4">
            {painPoints.map((pain, index) => (
              <div 
                key={index} 
                className="flex items-center gap-4 p-4 bg-card rounded-lg border border-destructive/20 hover:border-destructive/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                  <pain.icon className="w-5 h-5 text-destructive" />
                </div>
                <span className="text-foreground text-lg">{pain.text}</span>
              </div>
            ))}
          </div>
          
          <div className="mt-12 text-center">
            <p className="text-xl text-primary font-semibold">
              O Adegastock nasceu para resolver exatamente esses problemas.
            </p>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <Badge className="mb-6 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
            Feito para você
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
            Um sistema feito especificamente para Adegas
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            O Adegastock integra estoque, vendas e financeiro em uma única plataforma simples, 
            sem complicação e sem termos técnicos difíceis.
          </p>
        </div>
      </section>

      {/* Main Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Tudo o que você precisa para gerenciar sua adega com eficiência
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mainFeatures.map((feature, index) => (
              <Card key={index} className="bg-card hover:shadow-lg transition-all duration-300 border-border/50 group">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
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

      {/* Gold Plan Highlight */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-2 border-gold/30 bg-gradient-to-br from-gold/5 to-transparent overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <Badge className="mb-4 bg-gold/20 text-gold border-gold/30">
                    <Star className="w-3 h-3 mr-1" />
                    Plano Ouro
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                    Venda mais com inteligência, não no achismo
                  </h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    Com a análise de Ticket Médio, você entende exatamente como aumentar suas vendas.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-foreground">Ticket médio por período</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-foreground">Ranking de funcionários</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-foreground">Evolução do faturamento</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center">
                        <Check className="w-4 h-4 text-gold" />
                      </div>
                      <span className="text-foreground">Produtos que aumentam o valor da venda</span>
                    </li>
                  </ul>
                </div>
                <div className="flex-shrink-0">
                  <div className="w-48 h-48 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center">
                    <TrendingUp className="w-24 h-24 text-gold" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Diamond Plan Highlight - Premium Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-diamond/5 via-background to-primary/5">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 bg-diamond/20 text-diamond border-diamond/30 px-4 py-1.5">
              <Gem className="w-3 h-3 mr-1" />
              Exclusivo Plano Diamante
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Tenha controle financeiro real da sua Adega
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Se você não controla corretamente o que entra e sai do estoque, sua saúde financeira nunca será 100% confiável.
              <span className="block mt-2 font-medium text-foreground">
                O Plano Diamante resolve isso com um módulo contábil simples, integrado e automático.
              </span>
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {contabilFeatures.map((feature, index) => (
              <div 
                key={index}
                className="flex items-center gap-4 p-4 bg-card rounded-lg border border-diamond/20 hover:border-diamond/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-diamond/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-diamond" />
                </div>
                <span className="text-foreground">{feature.text}</span>
              </div>
            ))}
          </div>

          <div className="bg-card border border-diamond/30 rounded-lg p-6 text-center">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">Importante:</span> Não é um sistema contábil complexo, 
              e sim um <span className="text-diamond font-semibold">controle financeiro inteligente</span> feito para donos de adega.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="planos" className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Escolha o Plano Ideal para sua Adega
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Planos flexíveis que crescem junto com o seu negócio
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Plano Prata */}
            <Card className="relative bg-card border-2 border-silver/30 hover:border-silver transition-all duration-300 hover:shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-silver text-primary-foreground px-4 py-1 text-sm font-semibold">
                  🥈 PRATA
                </Badge>
              </div>
              <CardHeader className="text-center pt-10 pb-4">
                <CardTitle className="text-2xl text-foreground">Plano Prata</CardTitle>
                <CardDescription className="text-base mt-2">Ideal para sair do controle manual.</CardDescription>
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
                  🥇 OURO
                </Badge>
              </div>
              <div className="absolute top-4 right-4">
                <Badge variant="secondary" className="bg-gold/10 text-gold border-gold/20 text-xs">
                  MAIS POPULAR
                </Badge>
              </div>
              <CardHeader className="text-center pt-10 pb-4">
                <CardTitle className="text-2xl text-foreground">Plano Ouro</CardTitle>
                <CardDescription className="text-base mt-2">Para quem quer crescer com inteligência.</CardDescription>
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
                    Testar Ouro por 7 dias grátis
                    <Star className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Plano Diamante */}
            <Card className="relative bg-card border-2 border-diamond shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-diamond/5 to-transparent pointer-events-none" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <Badge className="bg-diamond text-primary-foreground px-4 py-1 text-sm font-semibold flex items-center gap-1">
                  <Gem className="w-3 h-3" />
                  💎 DIAMANTE
                </Badge>
              </div>
              <div className="absolute top-4 right-4 z-10">
                <Badge variant="secondary" className="bg-diamond/10 text-diamond border-diamond/20 text-xs">
                  COMPLETO
                </Badge>
              </div>
              <CardHeader className="text-center pt-10 pb-4 relative z-10">
                <CardTitle className="text-2xl text-foreground">Plano Diamante</CardTitle>
                <CardDescription className="text-base mt-2">Controle total do negócio e da saúde financeira.</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-diamond">R$ 139,90</span>
                  <span className="text-muted-foreground">/mês</span>
                </div>
              </CardHeader>
              <CardContent className="pt-4 relative z-10">
                <ul className="space-y-3">
                  {featuresDiamond.map((feature, index) => (
                    <li key={index} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-diamond/20 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-diamond" />
                      </div>
                      <span className="text-foreground">{feature.text}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/signup?plan=diamante" className="block mt-8">
                  <Button className="w-full bg-diamond hover:bg-diamond/90 text-primary-foreground font-semibold py-6">
                    Testar Diamante por 7 dias grátis
                    <Gem className="ml-2 w-4 h-4" />
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

      {/* FAQ Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <Badge className="mb-4 px-4 py-1.5 bg-primary/10 text-primary border-primary/20">
              <HelpCircle className="w-3 h-3 mr-1" />
              Dúvidas Frequentes
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Perguntas e Respostas
            </h2>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-border">
                <AccordionTrigger className="text-left text-lg font-medium text-foreground hover:text-primary">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* CTA Final Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <Card className="gradient-primary border-0 overflow-hidden max-w-4xl mx-auto">
            <CardContent className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground mb-4">
                Pare de trabalhar no escuro. Tenha controle total da sua Adega
              </h2>
              <p className="text-primary-foreground/80 text-lg mb-8 max-w-xl mx-auto">
                Estoque, vendas e financeiro em um único sistema simples, rápido e confiável.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/signup">
                  <Button size="lg" variant="secondary" className="text-lg px-8 py-6 font-semibold">
                    Começar grátis por 7 dias
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
                <a href="#planos">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6 font-semibold border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Ver planos
                  </Button>
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border bg-muted/20">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-center gap-6">
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
