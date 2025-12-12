import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, DollarSign, AlertTriangle, TrendingUp, TrendingDown, CreditCard, Banknote, Smartphone } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Adega {
  id: string;
  nome: string;
}

interface VendaRecente {
  id: string;
  valor_total: number;
  created_at: string;
  vendedor: string;
}

interface VendasDia {
  data: string;
  total: number;
}

interface ProdutoEstoqueBaixo {
  id: string;
  nome: string;
  quantidade_estoque: number;
  estoque_minimo: number;
}

interface TopProduto {
  nome: string;
  quantidade: number;
  valor: number;
}

interface FormaPagamento {
  nome: string;
  valor: number;
  quantidade: number;
}

const CORES_PAGAMENTO = ["hsl(var(--primary))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))"];

export default function Dashboard() {
  const { adegaId, role } = useUserRole();
  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [selectedAdegaId, setSelectedAdegaId] = useState<string>("");
  const [stats, setStats] = useState({
    totalProdutos: 0,
    vendasHoje: 0,
    faturamentoHoje: 0,
    faturamentoOntem: 0,
  });
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([]);
  const [vendasPorDia, setVendasPorDia] = useState<VendasDia[]>([]);
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState<ProdutoEstoqueBaixo[]>([]);
  const [topProdutos, setTopProdutos] = useState<TopProduto[]>([]);
  const [formasPagamento, setFormasPagamento] = useState<FormaPagamento[]>([]);
  const [loading, setLoading] = useState(true);

  // Buscar adegas para administrador
  useEffect(() => {
    const fetchAdegas = async () => {
      if (role === "admin_geral") {
        const { data } = await supabase
          .from("adegas")
          .select("id, nome")
          .eq("ativo", true)
          .order("nome");
        
        setAdegas(data || []);
      }
    };

    fetchAdegas();
  }, [role]);

  useEffect(() => {
    const fetchStats = async () => {
      if (role === "admin_geral" && !selectedAdegaId) {
        setLoading(false);
        return;
      }

      if (role !== "admin_geral" && !adegaId) return;

      const targetAdegaId = role === "admin_geral" ? selectedAdegaId : adegaId;

      try {
        // Total de produtos
        const { count: totalProdutos } = await supabase
          .from("produtos")
          .select("id", { count: "exact" })
          .eq("ativo", true)
          .eq("adega_id", targetAdegaId);

        // Produtos com estoque baixo
        const { data: produtosBaixoEstoque } = await supabase
          .from("produtos")
          .select("id, nome, quantidade_estoque, estoque_minimo")
          .eq("ativo", true)
          .eq("adega_id", targetAdegaId);
        
        const produtosFiltrados = produtosBaixoEstoque?.filter(
          p => p.quantidade_estoque <= p.estoque_minimo
        ) || [];
        setProdutosEstoqueBaixo(produtosFiltrados.slice(0, 5));

        // Datas para hoje e ontem
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = subDays(today, 1);
        const tomorrow = subDays(today, -1);

        // Vendas de hoje
        const { data: vendasHoje } = await supabase
          .from("vendas")
          .select("id, valor_total, forma_pagamento")
          .eq("adega_id", targetAdegaId)
          .gte("created_at", today.toISOString())
          .lt("created_at", tomorrow.toISOString());

        const faturamentoHoje = vendasHoje?.reduce((sum, v) => sum + Number(v.valor_total), 0) || 0;

        // Vendas de ontem para comparação
        const { data: vendasOntem } = await supabase
          .from("vendas")
          .select("valor_total")
          .eq("adega_id", targetAdegaId)
          .gte("created_at", yesterday.toISOString())
          .lt("created_at", today.toISOString());

        const faturamentoOntem = vendasOntem?.reduce((sum, v) => sum + Number(v.valor_total), 0) || 0;

        // Formas de pagamento de hoje
        const formasMap = new Map<string, { valor: number; quantidade: number }>();
        vendasHoje?.forEach(v => {
          const forma = v.forma_pagamento || "dinheiro";
          const current = formasMap.get(forma) || { valor: 0, quantidade: 0 };
          formasMap.set(forma, {
            valor: current.valor + Number(v.valor_total),
            quantidade: current.quantidade + 1
          });
        });
        
        const formasArray: FormaPagamento[] = Array.from(formasMap.entries()).map(([nome, data]) => ({
          nome: nome.charAt(0).toUpperCase() + nome.slice(1),
          valor: data.valor,
          quantidade: data.quantidade
        }));
        setFormasPagamento(formasArray);

        // Vendas recentes com nome do vendedor
        const { data: vendas } = await supabase
          .from("vendas")
          .select("id, valor_total, created_at, usuario_id")
          .eq("adega_id", targetAdegaId)
          .order("created_at", { ascending: false })
          .limit(5);

        if (vendas && vendas.length > 0) {
          const userIds = [...new Set(vendas.map(v => v.usuario_id))];
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, nome_completo")
            .in("id", userIds);

          const profilesMap = new Map(profiles?.map(p => [p.id, p.nome_completo]) || []);
          
          const vendasFormatadas = vendas.map(v => ({
            id: v.id,
            valor_total: v.valor_total,
            created_at: v.created_at,
            vendedor: profilesMap.get(v.usuario_id) || "Usuário"
          }));
          setVendasRecentes(vendasFormatadas);
        } else {
          setVendasRecentes([]);
        }

        // Top 5 produtos mais vendidos (últimos 30 dias)
        const thirtyDaysAgo = subDays(new Date(), 30);
        const { data: itensVendidos } = await supabase
          .from("itens_venda")
          .select("nome_produto, quantidade, subtotal, venda_id")
          .gte("created_at", thirtyDaysAgo.toISOString());

        // Filtrar apenas itens de vendas da adega
        const { data: vendasAdega } = await supabase
          .from("vendas")
          .select("id")
          .eq("adega_id", targetAdegaId)
          .gte("created_at", thirtyDaysAgo.toISOString());

        const vendasIds = new Set(vendasAdega?.map(v => v.id) || []);
        const itensAdega = itensVendidos?.filter(i => vendasIds.has(i.venda_id)) || [];

        const produtosMap = new Map<string, { quantidade: number; valor: number }>();
        itensAdega.forEach(item => {
          const current = produtosMap.get(item.nome_produto) || { quantidade: 0, valor: 0 };
          produtosMap.set(item.nome_produto, {
            quantidade: current.quantidade + item.quantidade,
            valor: current.valor + Number(item.subtotal)
          });
        });

        const topProdutosArray = Array.from(produtosMap.entries())
          .map(([nome, data]) => ({ nome, ...data }))
          .sort((a, b) => b.quantidade - a.quantidade)
          .slice(0, 5);
        setTopProdutos(topProdutosArray);

        // Vendas dos últimos 7 dias
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i);
          date.setHours(0, 0, 0, 0);
          return date;
        });

        const vendasPromises = last7Days.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          const { data } = await supabase
            .from("vendas")
            .select("valor_total")
            .eq("adega_id", targetAdegaId)
            .gte("created_at", date.toISOString())
            .lt("created_at", nextDay.toISOString());

          const total = data?.reduce((sum, v) => sum + Number(v.valor_total), 0) || 0;

          return {
            data: format(date, "dd/MM", { locale: ptBR }),
            total: total
          };
        });

        const vendasDias = await Promise.all(vendasPromises);
        setVendasPorDia(vendasDias);

        setStats({
          totalProdutos: totalProdutos || 0,
          vendasHoje: vendasHoje?.length || 0,
          faturamentoHoje,
          faturamentoOntem,
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [adegaId, role, selectedAdegaId]);

  const calcularVariacao = () => {
    if (stats.faturamentoOntem === 0) return stats.faturamentoHoje > 0 ? 100 : 0;
    return ((stats.faturamentoHoje - stats.faturamentoOntem) / stats.faturamentoOntem) * 100;
  };

  const variacao = calcularVariacao();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do seu sistema de gestão
          </p>
        </div>
        
        {role === "admin_geral" && (
          <div className="w-64">
            <Select value={selectedAdegaId} onValueChange={setSelectedAdegaId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {adegas.map((adega) => (
                  <SelectItem key={adega.id} value={adega.id}>
                    {adega.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {role === "admin_geral" && !selectedAdegaId ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Selecione um cliente para visualizar as estatísticas
          </p>
        </div>
      ) : (
        <>
          {/* Cards de Métricas */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="shadow-card hover:shadow-md transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {stats.faturamentoHoje.toFixed(2)}
                </div>
                <div className="flex items-center gap-1 mt-1">
                  {variacao >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`text-xs ${variacao >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {variacao >= 0 ? '+' : ''}{variacao.toFixed(1)}% vs ontem
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-md transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.vendasHoje}</div>
                <p className="text-xs text-muted-foreground">vendas realizadas</p>
              </CardContent>
            </Card>

            <Card className="shadow-card hover:shadow-md transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Produtos</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalProdutos}</div>
                <p className="text-xs text-muted-foreground">produtos cadastrados</p>
              </CardContent>
            </Card>

            <Card className={`shadow-card hover:shadow-md transition-smooth ${produtosEstoqueBaixo.length > 0 ? 'border-orange-500/50' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
                <AlertTriangle className={`h-4 w-4 ${produtosEstoqueBaixo.length > 0 ? 'text-orange-500' : 'text-muted-foreground'}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${produtosEstoqueBaixo.length > 0 ? 'text-orange-500' : ''}`}>
                  {produtosEstoqueBaixo.length}
                </div>
                <p className="text-xs text-muted-foreground">produtos precisam reposição</p>
              </CardContent>
            </Card>
          </div>

          {/* Grid de gráficos e tabelas */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Gráfico de Vendas */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Vendas dos Últimos 7 Dias</CardTitle>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    total: {
                      label: "Faturamento",
                      color: "hsl(var(--primary))",
                    },
                  }}
                  className="h-[250px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vendasPorDia}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="data" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickFormatter={(value) => `R$${value}`}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line 
                        type="monotone" 
                        dataKey="total" 
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: "hsl(var(--primary))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Formas de Pagamento */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Formas de Pagamento (Hoje)</CardTitle>
              </CardHeader>
              <CardContent>
                {formasPagamento.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ChartContainer
                      config={{
                        valor: { label: "Valor", color: "hsl(var(--primary))" },
                      }}
                      className="h-[200px] w-[200px]"
                    >
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={formasPagamento}
                            dataKey="valor"
                            nameKey="nome"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ nome }) => nome}
                          >
                            {formasPagamento.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CORES_PAGAMENTO[index % CORES_PAGAMENTO.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>
                    <div className="flex-1 space-y-2">
                      {formasPagamento.map((forma, index) => (
                        <div key={forma.nome} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full" 
                              style={{ backgroundColor: CORES_PAGAMENTO[index % CORES_PAGAMENTO.length] }}
                            />
                            <span>{forma.nome}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">R$ {forma.valor.toFixed(2)}</div>
                            <div className="text-muted-foreground text-xs">{forma.quantidade} vendas</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhuma venda registrada hoje
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Top Produtos */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Top 5 Produtos (30 dias)</CardTitle>
              </CardHeader>
              <CardContent>
                {topProdutos.length > 0 ? (
                  <ChartContainer
                    config={{
                      quantidade: {
                        label: "Quantidade",
                        color: "hsl(var(--primary))",
                      },
                    }}
                    className="h-[250px]"
                  >
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topProdutos} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis 
                          type="category" 
                          dataKey="nome" 
                          stroke="hsl(var(--muted-foreground))" 
                          fontSize={11}
                          width={100}
                          tickFormatter={(value) => value.length > 12 ? value.substring(0, 12) + '...' : value}
                        />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Nenhum produto vendido nos últimos 30 dias
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Estoque Baixo */}
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  Produtos com Estoque Baixo
                  {produtosEstoqueBaixo.length > 0 && (
                    <Badge variant="destructive">{produtosEstoqueBaixo.length}</Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {produtosEstoqueBaixo.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Atual</TableHead>
                        <TableHead className="text-center">Mínimo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {produtosEstoqueBaixo.map((produto) => (
                        <TableRow key={produto.id}>
                          <TableCell className="font-medium">{produto.nome}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={produto.quantidade_estoque === 0 ? "destructive" : "secondary"}>
                              {produto.quantidade_estoque}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center text-muted-foreground">
                            {produto.estoque_minimo}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Todos os produtos estão com estoque adequado
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Vendas Recentes */}
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Vendas Recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {vendasRecentes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Vendedor</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendasRecentes.map((venda) => (
                      <TableRow key={venda.id}>
                        <TableCell>
                          {format(new Date(venda.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{venda.vendedor}</TableCell>
                        <TableCell className="text-right font-semibold">
                          R$ {Number(venda.valor_total).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma venda registrada ainda
                </p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
