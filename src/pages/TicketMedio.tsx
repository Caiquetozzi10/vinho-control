import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdegaPlan } from "@/hooks/useAdegaPlan";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Users, Package, Clock, CalendarIcon, Crown, Lock } from "lucide-react";
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, subDays, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from "recharts";
import { cn } from "@/lib/utils";

type PeriodType = "today" | "week" | "month" | "custom";

const CATEGORY_LABELS: Record<string, string> = {
  vinho: "Vinhos",
  cerveja: "Cervejas",
  bebida_quente: "Destilados",
  energetica: "Energéticos",
  gelo: "Gelo",
  outros: "Outros",
};

const CATEGORY_COLORS: Record<string, string> = {
  vinho: "hsl(var(--chart-1))",
  cerveja: "hsl(var(--chart-2))",
  bebida_quente: "hsl(var(--chart-3))",
  energetica: "hsl(var(--chart-4))",
  gelo: "hsl(var(--chart-5))",
  outros: "hsl(var(--muted-foreground))",
};

export default function TicketMedio() {
  const { adegaId } = useUserRole();
  const { temRelatoriosAvancados, isLoading: planLoading } = useAdegaPlan();
  
  const [period, setPeriod] = useState<PeriodType>("month");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfDay(new Date()),
  });

  const getDateRange = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "today":
        return { from: startOfDay(now), to: endOfDay(now) };
      case "week":
        return { from: startOfWeek(now, { locale: ptBR }), to: endOfDay(now) };
      case "month":
        return { from: startOfMonth(now), to: endOfDay(now) };
      case "custom":
        return dateRange;
      default:
        return { from: startOfMonth(now), to: endOfDay(now) };
    }
  }, [period, dateRange]);

  // Fetch all sales data
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["ticket-medio", adegaId, getDateRange],
    queryFn: async () => {
      if (!adegaId) return null;

      const { data: vendas, error: vendasError } = await supabase
        .from("vendas")
        .select(`
          id,
          valor_total,
          created_at,
          usuario_id,
          itens_venda (
            id,
            produto_id,
            quantidade,
            preco_unitario,
            subtotal,
            nome_produto,
            produtos (
              categoria
            )
          )
        `)
        .eq("adega_id", adegaId)
        .gte("created_at", getDateRange.from.toISOString())
        .lte("created_at", getDateRange.to.toISOString())
        .order("created_at", { ascending: true });

      if (vendasError) throw vendasError;

      // Fetch employee names
      const userIds = [...new Set(vendas?.map(v => v.usuario_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, nome_completo")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.nome_completo]) || []);

      return { vendas, profileMap };
    },
    enabled: !!adegaId && temRelatoriosAvancados,
  });

  // Calculate ticket médio metrics
  const metrics = useMemo(() => {
    if (!salesData?.vendas?.length) {
      return {
        ticketMedio: 0,
        totalVendas: 0,
        totalItens: 0,
        maiorVenda: 0,
        menorVenda: 0,
      };
    }

    const vendas = salesData.vendas;
    const valores = vendas.map(v => Number(v.valor_total));
    const totalVendas = vendas.length;
    const somaTotal = valores.reduce((a, b) => a + b, 0);
    const totalItens = vendas.reduce((acc, v) => acc + (v.itens_venda?.length || 0), 0);

    return {
      ticketMedio: somaTotal / totalVendas,
      totalVendas,
      totalItens,
      maiorVenda: Math.max(...valores),
      menorVenda: Math.min(...valores),
    };
  }, [salesData]);

  // Ticket médio by category
  const categoryData = useMemo(() => {
    if (!salesData?.vendas?.length) return [];

    const categoryMap: Record<string, { total: number; count: number }> = {};

    salesData.vendas.forEach(venda => {
      venda.itens_venda?.forEach(item => {
        const categoria = item.produtos?.categoria || "outros";
        if (!categoryMap[categoria]) {
          categoryMap[categoria] = { total: 0, count: 0 };
        }
        categoryMap[categoria].total += Number(item.subtotal);
        categoryMap[categoria].count += 1;
      });
    });

    return Object.entries(categoryMap)
      .map(([key, value]) => ({
        categoria: CATEGORY_LABELS[key] || key,
        categoriaKey: key,
        ticketMedio: value.total / value.count,
        total: value.total,
        quantidade: value.count,
      }))
      .sort((a, b) => b.ticketMedio - a.ticketMedio);
  }, [salesData]);

  // Ticket médio by employee
  const employeeData = useMemo(() => {
    if (!salesData?.vendas?.length) return [];

    const employeeMap: Record<string, { total: number; count: number; nome: string }> = {};

    salesData.vendas.forEach(venda => {
      const id = venda.usuario_id;
      const nome = salesData.profileMap.get(id) || "Desconhecido";
      
      if (!employeeMap[id]) {
        employeeMap[id] = { total: 0, count: 0, nome };
      }
      employeeMap[id].total += Number(venda.valor_total);
      employeeMap[id].count += 1;
    });

    return Object.entries(employeeMap)
      .map(([id, value]) => ({
        id,
        nome: value.nome,
        ticketMedio: value.total / value.count,
        totalVendas: value.count,
        valorTotal: value.total,
      }))
      .sort((a, b) => b.ticketMedio - a.ticketMedio);
  }, [salesData]);

  // Ticket médio by product
  const productData = useMemo(() => {
    if (!salesData?.vendas?.length) return { aumentam: [], diminuem: [] };

    const productMap: Record<string, { total: number; count: number; nome: string }> = {};

    salesData.vendas.forEach(venda => {
      venda.itens_venda?.forEach(item => {
        const id = item.produto_id;
        if (!productMap[id]) {
          productMap[id] = { total: 0, count: 0, nome: item.nome_produto };
        }
        productMap[id].total += Number(item.subtotal);
        productMap[id].count += item.quantidade;
      });
    });

    const sorted = Object.entries(productMap)
      .map(([id, value]) => ({
        id,
        nome: value.nome,
        ticketMedio: value.total / value.count,
        quantidade: value.count,
        valorTotal: value.total,
      }))
      .sort((a, b) => b.ticketMedio - a.ticketMedio);

    return {
      aumentam: sorted.slice(0, 5),
      diminuem: sorted.slice(-5).reverse(),
    };
  }, [salesData]);

  // Ticket médio by hour
  const hourlyData = useMemo(() => {
    if (!salesData?.vendas?.length) return [];

    const hourMap: Record<number, { total: number; count: number }> = {};

    for (let i = 0; i < 24; i++) {
      hourMap[i] = { total: 0, count: 0 };
    }

    salesData.vendas.forEach(venda => {
      const hour = new Date(venda.created_at).getHours();
      hourMap[hour].total += Number(venda.valor_total);
      hourMap[hour].count += 1;
    });

    return Object.entries(hourMap)
      .filter(([_, value]) => value.count > 0)
      .map(([hour, value]) => ({
        hora: `${hour}h`,
        horaNum: Number(hour),
        ticketMedio: value.total / value.count,
        vendas: value.count,
      }))
      .sort((a, b) => a.horaNum - b.horaNum);
  }, [salesData]);

  // Ticket médio by day of week
  const weekdayData = useMemo(() => {
    if (!salesData?.vendas?.length) return [];

    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    const dayMap: Record<number, { total: number; count: number }> = {};

    for (let i = 0; i < 7; i++) {
      dayMap[i] = { total: 0, count: 0 };
    }

    salesData.vendas.forEach(venda => {
      const day = new Date(venda.created_at).getDay();
      dayMap[day].total += Number(venda.valor_total);
      dayMap[day].count += 1;
    });

    return Object.entries(dayMap)
      .filter(([_, value]) => value.count > 0)
      .map(([day, value]) => ({
        dia: dayNames[Number(day)],
        diaNum: Number(day),
        ticketMedio: value.total / value.count,
        vendas: value.count,
      }))
      .sort((a, b) => a.diaNum - b.diaNum);
  }, [salesData]);

  // Daily trend
  const dailyTrend = useMemo(() => {
    if (!salesData?.vendas?.length) return [];

    const dayMap: Record<string, { total: number; count: number }> = {};

    salesData.vendas.forEach(venda => {
      const date = format(new Date(venda.created_at), "dd/MM");
      if (!dayMap[date]) {
        dayMap[date] = { total: 0, count: 0 };
      }
      dayMap[date].total += Number(venda.valor_total);
      dayMap[date].count += 1;
    });

    return Object.entries(dayMap).map(([date, value]) => ({
      data: date,
      ticketMedio: value.total / value.count,
      vendas: value.count,
    }));
  }, [salesData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (planLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!temRelatoriosAvancados) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <Lock className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Recurso Exclusivo do Plano Ouro</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          O relatório de Ticket Médio está disponível apenas para assinantes do Plano Ouro.
          Faça upgrade para ter acesso a análises avançadas do seu negócio.
        </p>
        <Button asChild>
          <a href="/assinatura">
            <Crown className="h-4 w-4 mr-2" />
            Fazer Upgrade para Ouro
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            Ticket Médio
            <Badge className="bg-yellow-500 text-yellow-950">
              <Crown className="h-3 w-3 mr-1" />
              Ouro
            </Badge>
          </h1>
          <p className="text-muted-foreground">Análise detalhada do ticket médio do seu negócio</p>
        </div>

        {/* Period Filter */}
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={(v) => setPeriod(v as PeriodType)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoje</SelectItem>
              <SelectItem value="week">Esta Semana</SelectItem>
              <SelectItem value="month">Este Mês</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>

          {period === "custom" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  {format(dateRange.from, "dd/MM")} - {format(dateRange.to, "dd/MM")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={{ from: dateRange.from, to: dateRange.to }}
                  onSelect={(range) => {
                    if (range?.from && range?.to) {
                      setDateRange({ from: range.from, to: endOfDay(range.to) });
                    }
                  }}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Main Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-primary">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.ticketMedio)}</div>
                <p className="text-xs text-muted-foreground">
                  Base: {metrics.totalVendas} vendas
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Maior Venda</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.maiorVenda)}</div>
                <p className="text-xs text-muted-foreground">Valor máximo no período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Menor Venda</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.menorVenda)}</div>
                <p className="text-xs text-muted-foreground">Valor mínimo no período</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalVendas}</div>
                <p className="text-xs text-muted-foreground">{metrics.totalItens} itens vendidos</p>
              </CardContent>
            </Card>
          </div>

          {/* Daily Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Evolução do Ticket Médio</CardTitle>
              <CardDescription>Tendência diária no período selecionado</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="data" className="text-xs" />
                    <YAxis tickFormatter={(v) => `R$${v}`} className="text-xs" />
                    <Tooltip
                      formatter={(value: number) => [formatCurrency(value), "Ticket Médio"]}
                      labelFormatter={(label) => `Data: ${label}`}
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                    />
                    <Line
                      type="monotone"
                      dataKey="ticketMedio"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      dot={{ fill: "hsl(var(--primary))" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-muted-foreground py-8">Sem dados para o período</p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* By Category */}
            <Card>
              <CardHeader>
                <CardTitle>Ticket Médio por Categoria</CardTitle>
                <CardDescription>Valor médio por tipo de produto</CardDescription>
              </CardHeader>
              <CardContent>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={categoryData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" tickFormatter={(v) => `R$${v}`} className="text-xs" />
                      <YAxis type="category" dataKey="categoria" width={80} className="text-xs" />
                      <Tooltip
                        formatter={(value: number) => [formatCurrency(value), "Ticket Médio"]}
                        contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Bar dataKey="ticketMedio" radius={[0, 4, 4, 0]}>
                        {categoryData.map((entry, index) => (
                          <Cell key={index} fill={CATEGORY_COLORS[entry.categoriaKey] || "hsl(var(--primary))"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* By Employee */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Ranking por Funcionário
                </CardTitle>
                <CardDescription>Quem aumenta e quem diminui o ticket</CardDescription>
              </CardHeader>
              <CardContent>
                {employeeData.length > 0 ? (
                  <div className="space-y-3">
                    {employeeData.map((emp, i) => (
                      <div key={emp.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <span className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                            i === 0 ? "bg-yellow-500 text-yellow-950" :
                            i === 1 ? "bg-slate-300 text-slate-800" :
                            i === 2 ? "bg-amber-600 text-amber-950" :
                            "bg-muted text-muted-foreground"
                          )}>
                            {i + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{emp.nome}</p>
                            <p className="text-xs text-muted-foreground">{emp.totalVendas} vendas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatCurrency(emp.ticketMedio)}</p>
                          {i === 0 && <TrendingUp className="h-4 w-4 text-green-500 ml-auto" />}
                          {i === employeeData.length - 1 && employeeData.length > 1 && (
                            <TrendingDown className="h-4 w-4 text-red-500 ml-auto" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* Products that increase ticket */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-600">
                  <TrendingUp className="h-5 w-5" />
                  Produtos que Aumentam o Ticket
                </CardTitle>
                <CardDescription>Top 5 produtos com maior valor médio</CardDescription>
              </CardHeader>
              <CardContent>
                {productData.aumentam.length > 0 ? (
                  <div className="space-y-2">
                    {productData.aumentam.map((prod, i) => (
                      <div key={prod.id} className="flex items-center justify-between p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-green-500 text-green-600">{i + 1}</Badge>
                          <span className="text-sm font-medium">{prod.nome}</span>
                        </div>
                        <span className="font-bold text-green-600">{formatCurrency(prod.ticketMedio)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* Products that decrease ticket */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <TrendingDown className="h-5 w-5" />
                  Produtos que Diminuem o Ticket
                </CardTitle>
                <CardDescription>5 produtos com menor valor médio</CardDescription>
              </CardHeader>
              <CardContent>
                {productData.diminuem.length > 0 ? (
                  <div className="space-y-2">
                    {productData.diminuem.map((prod, i) => (
                      <div key={prod.id} className="flex items-center justify-between p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-red-500 text-red-600">{i + 1}</Badge>
                          <span className="text-sm font-medium">{prod.nome}</span>
                        </div>
                        <span className="font-bold text-red-600">{formatCurrency(prod.ticketMedio)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* By Day of Week */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Ticket Médio por Dia da Semana
                </CardTitle>
                <CardDescription>Identifique os melhores dias</CardDescription>
              </CardHeader>
              <CardContent>
                {weekdayData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={weekdayData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="dia" className="text-xs" />
                      <YAxis tickFormatter={(v) => `R$${v}`} className="text-xs" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === "ticketMedio" ? formatCurrency(value) : value,
                          name === "ticketMedio" ? "Ticket Médio" : "Vendas"
                        ]}
                        contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Bar dataKey="ticketMedio" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>

            {/* By Hour */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Ticket Médio por Horário
                </CardTitle>
                <CardDescription>Identifique horários fortes e fracos</CardDescription>
              </CardHeader>
              <CardContent>
                {hourlyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={hourlyData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="hora" className="text-xs" />
                      <YAxis tickFormatter={(v) => `R$${v}`} className="text-xs" />
                      <Tooltip
                        formatter={(value: number, name: string) => [
                          name === "ticketMedio" ? formatCurrency(value) : value,
                          name === "ticketMedio" ? "Ticket Médio" : "Vendas"
                        ]}
                        contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))" }}
                      />
                      <Bar dataKey="ticketMedio" radius={[4, 4, 0, 0]}>
                        {hourlyData.map((entry, index) => {
                          const avg = hourlyData.reduce((a, b) => a + b.ticketMedio, 0) / hourlyData.length;
                          return (
                            <Cell
                              key={index}
                              fill={entry.ticketMedio >= avg ? "hsl(var(--chart-2))" : "hsl(var(--chart-1))"}
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-muted-foreground py-8">Sem dados</p>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
