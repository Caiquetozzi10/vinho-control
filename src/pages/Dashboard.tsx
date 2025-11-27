import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ShoppingCart, AlertTriangle, TrendingUp } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

export default function Dashboard() {
  const { adegaId, role } = useUserRole();
  const [stats, setStats] = useState({
    totalProdutos: 0,
    produtosEstoqueBaixo: 0,
    vendasHoje: 0,
    valorVendasHoje: 0,
  });
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
          .select("id", { count: "exact" })
          .eq("ativo", true)
          .lte("quantidade_estoque", 5);

        if (role !== "admin_geral" && adegaId) {
          estoqueBaixoQuery = estoqueBaixoQuery.eq("adega_id", adegaId);
        }

        const { count: produtosEstoqueBaixo } = await estoqueBaixoQuery;

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

        setStats({
          totalProdutos: totalProdutos || 0,
          produtosEstoqueBaixo: produtosEstoqueBaixo || 0,
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
    </div>
  );
}
