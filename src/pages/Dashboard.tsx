import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [selectedAdegaId, setSelectedAdegaId] = useState<string>("");
  const [stats, setStats] = useState({
    totalProdutos: 0,
    vendasHoje: 0,
  });
  const [vendasRecentes, setVendasRecentes] = useState<VendaRecente[]>([]);
  const [vendasPorDia, setVendasPorDia] = useState<VendasDia[]>([]);
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
      // Para admin_geral, só buscar dados se tiver selecionado uma adega
      if (role === "admin_geral" && !selectedAdegaId) {
        setLoading(false);
        return;
      }

      // Para outros roles, precisa ter adegaId
      if (role !== "admin_geral" && !adegaId) return;

      const targetAdegaId = role === "admin_geral" ? selectedAdegaId : adegaId;

      try {
        // Total de produtos
        const { count: totalProdutos } = await supabase
          .from("produtos")
          .select("id", { count: "exact" })
          .eq("ativo", true)
          .eq("adega_id", targetAdegaId);

        // Vendas de hoje
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: vendasHoje } = await supabase
          .from("vendas")
          .select("id")
          .eq("adega_id", targetAdegaId)
          .gte("created_at", today.toISOString());

        // Vendas recentes
        const { data: vendas } = await supabase
          .from("vendas")
          .select("id, valor_total, created_at, profiles!vendas_usuario_id_fkey(nome_completo)")
          .eq("adega_id", targetAdegaId)
          .order("created_at", { ascending: false })
          .limit(5);

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
        });
      } catch (error) {
        console.error("Erro ao buscar estatísticas:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [adegaId, role, selectedAdegaId]);

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
          <div className="grid gap-4 md:grid-cols-2">
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
                <CardTitle className="text-sm font-medium">Vendas Hoje</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.vendasHoje}</div>
                <p className="text-xs text-muted-foreground">vendas realizadas hoje</p>
              </CardContent>
            </Card>
          </div>

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
        </>
      )}
    </div>
  );
}
