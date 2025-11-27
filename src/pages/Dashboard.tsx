import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format, subDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ProdutoEstoque {
  id: string;
  nome: string;
  quantidade_estoque: number;
  estoque_minimo: number;
}

interface VendaRecente {
  id: string;
  valor_total: number;
  created_at: string;
  usuario: {
    nome_completo: string;
  };
}

interface VendasDia {
  data: string;
  total: number;
}

export default function Dashboard() {
  const { adegaId, role } = useUserRole();
  const [stats, setStats] = useState({
    totalProdutos: 0,
    produtosEstoqueBaixo: 0,
    vendasHoje: 0,
    valorVendasHoje: 0,
  });
  const [produtosEstoqueBaixo, setProdutosEstoqueBaixo] = useState<ProdutoEstoque[]>([]);
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([]);
  const [vendasPorDia, setVendasPorDia] = useState<VendasDia[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!adegaId && role !== "admin_geral") return;

      try {
        // Total de produtos
        let produtosQuery = supabase
          .from("produtos")
          .select("id", { count: "exact" })
          .eq("ativo", true);

        if (role !== "admin_geral" && adegaId) {
          produtosQuery = produtosQuery.eq("adega_id", adegaId);
        }

        const { count: totalProdutos } = await produtosQuery;

        // Produtos com estoque baixo
        let estoqueBaixoQuery = supabase
          .from("produtos")
          .select("id, nome, quantidade_estoque, estoque_minimo")
          .eq("ativo", true)
          .lte("quantidade_estoque", 5)
          .order("quantidade_estoque", { ascending: true })
          .limit(5);

        if (role !== "admin_geral" && adegaId) {
          estoqueBaixoQuery = estoqueBaixoQuery.eq("adega_id", adegaId);
        }

        const { data: produtosEstoque } = await estoqueBaixoQuery;
        setProdutosEstoqueBaixo(produtosEstoque || []);

        // Vendas de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let vendasHojeQuery = supabase
          .from("vendas")
          .select("id, valor_total")
          .gte("created_at", today.toISOString());

        if (role !== "admin_geral" && adegaId) {
          vendasHojeQuery = vendasHojeQuery.eq("adega_id", adegaId);
        }

        const { data: vendasHoje } = await vendasHojeQuery;

        const valorTotal = vendasHoje?.reduce((sum, venda) => sum + Number(venda.valor_total), 0) || 0;

        // Vendas recentes
        let vendasRecentesQuery = supabase
          .from("vendas")
          .select("id, valor_total, created_at, profiles!vendas_usuario_id_fkey(nome_completo)")
          .order("created_at", { ascending: false })
          .limit(5);

        if (role !== "admin_geral" && adegaId) {
          vendasRecentesQuery = vendasRecentesQuery.eq("adega_id", adegaId);
        }

        const { data: vendas } = await vendasRecentesQuery;
        const vendasFormatadas = vendas?.map(v => ({
          id: v.id,
          valor_total: v.valor_total,
          created_at: v.created_at,
          usuario: {
            nome_completo: (v.profiles as any)?.nome_completo || "Usuário"
          }
        })) || [];
        setVendasRecentes(vendasFormatadas);

        // Vendas dos últimos 7 dias
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = subDays(new Date(), 6 - i);
          date.setHours(0, 0, 0, 0);
          return date;
        });

        const vendasPromises = last7Days.map(async (date) => {
          const nextDay = new Date(date);
          nextDay.setDate(nextDay.getDate() + 1);

          let query = supabase
            .from("vendas")
            .select("valor_total")
            .gte("created_at", date.toISOString())
            .lt("created_at", nextDay.toISOString());

          if (role !== "admin_geral" && adegaId) {
            query = query.eq("adega_id", adegaId);
          }

          const { data } = await query;
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
          produtosEstoqueBaixo: produtosEstoque?.length || 0,
          vendasHoje: vendasHoje?.length || 0,
          valorVendasHoje: valorTotal,
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [adegaId, role]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do seu sistema de gestão
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

        <Card className="shadow-card hover:shadow-md transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
            <AlertTriangle className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.produtosEstoqueBaixo}</div>
            <p className="text-xs text-muted-foreground">produtos com estoque baixo</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-md transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.vendasHoje}</div>
            <p className="text-xs text-muted-foreground">vendas realizadas hoje</p>
          </CardContent>
        </Card>

        <Card className="shadow-card hover:shadow-md transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faturamento Hoje</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {stats.valorVendasHoje.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">valor total em vendas</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
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
              className="h-[300px]"
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

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Produtos com Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            {produtosEstoqueBaixo.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produto</TableHead>
                    <TableHead className="text-right">Estoque</TableHead>
                    <TableHead className="text-right">Mínimo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosEstoqueBaixo.map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell className="font-medium">{produto.nome}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-warning font-semibold">
                          {produto.quantidade_estoque}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {produto.estoque_minimo}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum produto com estoque baixo
              </p>
            )}
          </CardContent>
        </Card>
      </div>

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
                    <TableCell>{venda.usuario.nome_completo}</TableCell>
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
    </div>
  );
}
