import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle,
  DollarSign,
  Target,
  PieChart
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell, BarChart, Bar, Legend } from 'recharts';

type TransacaoAgrupada = {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
};

type CategoriaTotal = {
  nome: string;
  valor: number;
  cor: string;
};

export default function DashboardFinanceiro() {
  const { adegaId } = useUserRole();
  const [periodo, setPeriodo] = useState("mes_atual");
  const [loading, setLoading] = useState(true);
  
  // Estados para os dados
  const [totalEntradas, setTotalEntradas] = useState(0);
  const [totalSaidas, setTotalSaidas] = useState(0);
  const [saldo, setSaldo] = useState(0);
  const [cmv, setCmv] = useState(0);
  const [lucroBruto, setLucroBruto] = useState(0);
  const [margemLucro, setMargemLucro] = useState(0);
  const [evolucaoData, setEvolucaoData] = useState<TransacaoAgrupada[]>([]);
  const [despesasPorCategoria, setDespesasPorCategoria] = useState<CategoriaTotal[]>([]);
  const [entradasPorCategoria, setEntradasPorCategoria] = useState<CategoriaTotal[]>([]);

  // Cores para o gráfico de pizza
  const COLORS = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ec4899', '#eab308', '#06b6d4', '#ef4444'];

  const getDateRange = () => {
    const now = new Date();
    switch (periodo) {
      case "mes_atual":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "mes_anterior":
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "ultimos_3_meses":
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "ultimos_6_meses":
        return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case "ano_atual":
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchData = async () => {
    if (!adegaId) return;
    setLoading(true);

    try {
      const { start, end } = getDateRange();
      
      // Buscar transações do período
      const { data: transacoes, error } = await supabase
        .from("transacoes_financeiras")
        .select(`
          *,
          categoria:categorias_financeiras(nome, cor)
        `)
        .eq("adega_id", adegaId)
        .gte("data_transacao", format(start, "yyyy-MM-dd"))
        .lte("data_transacao", format(end, "yyyy-MM-dd"))
        .order("data_transacao");

      if (error) throw error;

      // Calcular totais
      let entradas = 0;
      let saidas = 0;
      let custoMercadorias = 0;
      const categoriasDespesas: Record<string, { valor: number; cor: string }> = {};
      const categoriasEntradas: Record<string, { valor: number; cor: string }> = {};
      const evolucaoPorDia: Record<string, { entradas: number; saidas: number }> = {};

      transacoes?.forEach((t) => {
        const valor = Number(t.valor);
        const categoriaNome = (t.categoria as any)?.nome || "Sem categoria";
        const categoriaCor = (t.categoria as any)?.cor || "#6b7280";
        const dataFormatada = t.data_transacao;

        if (t.tipo === "entrada") {
          entradas += valor;
          categoriasEntradas[categoriaNome] = {
            valor: (categoriasEntradas[categoriaNome]?.valor || 0) + valor,
            cor: categoriaCor,
          };
        } else {
          saidas += valor;
          categoriasDespesas[categoriaNome] = {
            valor: (categoriasDespesas[categoriaNome]?.valor || 0) + valor,
            cor: categoriaCor,
          };
          
          // CMV - Custo de Mercadorias Vendidas
          if (categoriaNome === "Compra de Mercadorias") {
            custoMercadorias += valor;
          }
        }

        // Evolução por dia
        if (!evolucaoPorDia[dataFormatada]) {
          evolucaoPorDia[dataFormatada] = { entradas: 0, saidas: 0 };
        }
        if (t.tipo === "entrada") {
          evolucaoPorDia[dataFormatada].entradas += valor;
        } else {
          evolucaoPorDia[dataFormatada].saidas += valor;
        }
      });

      setTotalEntradas(entradas);
      setTotalSaidas(saidas);
      setSaldo(entradas - saidas);
      setCmv(custoMercadorias);
      setLucroBruto(entradas - custoMercadorias);
      setMargemLucro(entradas > 0 ? ((entradas - custoMercadorias) / entradas) * 100 : 0);

      // Formatar dados para gráficos
      setDespesasPorCategoria(
        Object.entries(categoriasDespesas).map(([nome, { valor, cor }]) => ({
          nome,
          valor,
          cor,
        })).sort((a, b) => b.valor - a.valor)
      );

      setEntradasPorCategoria(
        Object.entries(categoriasEntradas).map(([nome, { valor, cor }]) => ({
          nome,
          valor,
          cor,
        })).sort((a, b) => b.valor - a.valor)
      );

      // Evolução temporal
      const evolucaoArray = Object.entries(evolucaoPorDia)
        .map(([data, valores]) => ({
          data: format(new Date(data + "T00:00:00"), "dd/MM", { locale: ptBR }),
          entradas: valores.entradas,
          saidas: valores.saidas,
          saldo: valores.entradas - valores.saidas,
        }))
        .sort((a, b) => a.data.localeCompare(b.data));

      setEvolucaoData(evolucaoArray);

    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [adegaId, periodo]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border p-3 rounded-lg shadow-lg">
          <p className="text-sm font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">Visão geral das finanças do seu negócio</p>
        </div>
        
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mes_atual">Mês atual</SelectItem>
            <SelectItem value="mes_anterior">Mês anterior</SelectItem>
            <SelectItem value="ultimos_3_meses">Últimos 3 meses</SelectItem>
            <SelectItem value="ultimos_6_meses">Últimos 6 meses</SelectItem>
            <SelectItem value="ano_atual">Ano atual</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPIs principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(totalEntradas)}</p>
              </div>
              <ArrowUpCircle className="h-10 w-10 text-green-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Saídas</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
              </div>
              <ArrowDownCircle className="h-10 w-10 text-red-500/50" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-br ${saldo >= 0 ? 'from-blue-500/10 to-blue-600/5 border-blue-500/20' : 'from-orange-500/10 to-orange-600/5 border-orange-500/20'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Saldo do Período</p>
                <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(saldo)}
                </p>
              </div>
              <Wallet className={`h-10 w-10 ${saldo >= 0 ? 'text-blue-500/50' : 'text-orange-500/50'}`} />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Lucro Bruto</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(lucroBruto)}</p>
              </div>
              <DollarSign className="h-10 w-10 text-purple-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* KPIs secundários */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-lg">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CMV (Custo de Mercadorias)</p>
                <p className="text-xl font-bold">{formatCurrency(cmv)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Margem de Lucro</p>
                <p className="text-xl font-bold">{margemLucro.toFixed(1)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <PieChart className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nº de Transações</p>
                <p className="text-xl font-bold">{evolucaoData.length} dias</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Evolução Financeira */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Evolução Financeira</CardTitle>
            <CardDescription>Entradas e saídas ao longo do tempo</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={evolucaoData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="data" className="text-xs" />
                  <YAxis className="text-xs" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="entradas" 
                    name="Entradas"
                    stackId="1"
                    stroke="#22c55e" 
                    fill="#22c55e" 
                    fillOpacity={0.3}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="saidas" 
                    name="Saídas"
                    stackId="2"
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Despesas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Despesas por Categoria</CardTitle>
            <CardDescription>Distribuição das saídas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={despesasPorCategoria}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nome, percent }) => `${nome} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valor"
                    nameKey="nome"
                  >
                    {despesasPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Entradas por Categoria */}
        <Card>
          <CardHeader>
            <CardTitle>Receitas por Categoria</CardTitle>
            <CardDescription>Distribuição das entradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={entradasPorCategoria} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} className="text-xs" />
                  <YAxis type="category" dataKey="nome" width={120} className="text-xs" />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="valor" name="Valor" radius={[0, 4, 4, 0]}>
                    {entradasPorCategoria.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.cor || COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}