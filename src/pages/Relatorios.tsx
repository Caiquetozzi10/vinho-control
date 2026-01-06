import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Download, FileText, Calendar, Crown, Lock, TrendingUp, BarChart3 } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdegaPlan } from "@/hooks/useAdegaPlan";
import { format } from "date-fns";

type ItemVenda = {
  nome_produto: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

type Venda = {
  id: string;
  created_at: string;
  valor_total: number;
  usuario_id: string;
  forma_pagamento: string;
  profiles: {
    nome_completo: string;
  } | null;
  itens_venda?: ItemVenda[];
};

export default function Relatorios() {
  const { adegaId, role } = useUserRole();
  const { plano, temRelatoriosAvancados, isLoading: planLoading } = useAdegaPlan();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [loading, setLoading] = useState(true);
  // Operadores só veem relatório do dia
  const defaultPeriodo = role === "operador" ? "dia" : "3meses";
  const [periodo, setPeriodo] = useState(defaultPeriodo);
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");

  useEffect(() => {
    fetchVendas();
  }, [adegaId, periodo, dataInicio, dataFim]);

  const fetchVendas = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("vendas")
        .select(`
          id,
          created_at,
          valor_total,
          usuario_id,
          forma_pagamento,
          itens_venda (
            nome_produto,
            quantidade,
            preco_unitario,
            subtotal
          )
        `)
        .order("created_at", { ascending: false });

      // Filtrar por período
      const now = new Date();
      let startDate: Date;
      let endDate: Date | null = null;

      switch (periodo) {
        case "dia":
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          query = query.gte("created_at", startDate.toISOString());
          break;
        case "semana":
          const dayOfWeek = now.getDay();
          const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday, 0, 0, 0);
          query = query.gte("created_at", startDate.toISOString());
          break;
        case "mes":
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          query = query.gte("created_at", startDate.toISOString());
          break;
        case "3meses":
          startDate = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate(), 0, 0, 0);
          query = query.gte("created_at", startDate.toISOString());
          break;
        case "personalizado":
          if (dataInicio) query = query.gte("created_at", dataInicio);
          if (dataFim) {
            endDate = new Date(dataFim);
            endDate.setHours(23, 59, 59, 999);
            query = query.lte("created_at", endDate.toISOString());
          }
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get user names separately
      const vendasComNomes = await Promise.all(
        (data || []).map(async (venda) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("nome_completo")
            .eq("id", venda.usuario_id)
            .single();

          return {
            ...venda,
            profiles: profile || { nome_completo: "N/A" },
            itens_venda: venda.itens_venda || [],
          };
        })
      );

      setVendas(vendasComNomes as Venda[]);
    } catch (error) {
      console.error("Erro ao buscar vendas:", error);
      toast.error("Erro ao carregar relatório");
    } finally {
      setLoading(false);
    }
  };

  const calcularTotais = () => {
    const totalVendas = vendas.length;
    const valorTotal = vendas.reduce((sum, venda) => sum + Number(venda.valor_total), 0);
    const ticketMedio = totalVendas > 0 ? valorTotal / totalVendas : 0;

    return { totalVendas, valorTotal, ticketMedio };
  };

  const formatarFormaPagamento = (forma: string) => {
    const formas: Record<string, string> = {
      dinheiro: "Dinheiro",
      debito: "Débito",
      credito: "Crédito",
      pix: "PIX",
    };
    return formas[forma] || forma;
  };

  const exportarCSV = () => {
    const headers = ["Data", "Hora", "Vendedor", "Forma Pagamento", "Valor Total"];
    const rows = vendas.map((venda) => [
      format(new Date(venda.created_at), "dd/MM/yyyy"),
      format(new Date(venda.created_at), "HH:mm"),
      venda.profiles?.nome_completo || "N/A",
      formatarFormaPagamento(venda.forma_pagamento),
      `R$ ${Number(venda.valor_total).toFixed(2)}`,
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-vendas-${format(new Date(), "dd-MM-yyyy")}.csv`;
    a.click();
    
    toast.success("Relatório exportado com sucesso!");
  };

  // Advanced analytics functions (Plano Ouro)
  const getMostSoldProduct = () => {
    const productCounts: Record<string, number> = {};
    vendas.forEach(venda => {
      venda.itens_venda?.forEach(item => {
        productCounts[item.nome_produto] = (productCounts[item.nome_produto] || 0) + item.quantidade;
      });
    });
    const sorted = Object.entries(productCounts).sort(([,a], [,b]) => b - a);
    return sorted[0]?.[0] || "N/A";
  };

  const getMostUsedPaymentMethod = () => {
    const methodCounts: Record<string, number> = {};
    vendas.forEach(venda => {
      methodCounts[venda.forma_pagamento] = (methodCounts[venda.forma_pagamento] || 0) + 1;
    });
    const sorted = Object.entries(methodCounts).sort(([,a], [,b]) => b - a);
    return sorted[0] ? formatarFormaPagamento(sorted[0][0]) : "N/A";
  };

  const getBestDayOfWeek = () => {
    const dayCounts: Record<number, number> = {};
    const dayNames = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
    vendas.forEach(venda => {
      const day = new Date(venda.created_at).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + Number(venda.valor_total);
    });
    const sorted = Object.entries(dayCounts).sort(([,a], [,b]) => b - a);
    return sorted[0] ? dayNames[parseInt(sorted[0][0])] : "N/A";
  };

  const { totalVendas, valorTotal, ticketMedio } = calcularTotais();

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
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">Análise de vendas e desempenho</p>
        </div>
        <Button onClick={exportarCSV}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {/* Filtros de Período - Oculto para operadores */}
      {role !== "operador" && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Período</Label>
                <Select value={periodo} onValueChange={setPeriodo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dia">Hoje</SelectItem>
                    <SelectItem value="semana">Esta Semana</SelectItem>
                    <SelectItem value="mes">Este Mês</SelectItem>
                    <SelectItem value="3meses">Últimos 3 Meses</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {periodo === "personalizado" && (
                <>
                  <div className="space-y-2">
                    <Label>Data Início</Label>
                    <Input
                      type="date"
                      value={dataInicio}
                      onChange={(e) => setDataInicio(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data Fim</Label>
                    <Input
                      type="date"
                      value={dataFim}
                      onChange={(e) => setDataFim(e.target.value)}
                    />
                  </div>
                </>
              )}

              <div className="flex items-end">
                <Button onClick={fetchVendas} className="w-full">
                  Aplicar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalVendas}</div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Valor Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              R$ {valorTotal.toFixed(2)}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-success">
              R$ {ticketMedio.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Relatórios Avançados - Apenas Plano Ouro */}
      <Card className={`shadow-card ${!temRelatoriosAvancados ? 'opacity-75' : ''}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Relatórios Avançados
              {!temRelatoriosAvancados && (
                <Badge className="bg-gold text-primary-foreground ml-2">
                  <Crown className="w-3 h-3 mr-1" />
                  Plano Ouro
                </Badge>
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {temRelatoriosAvancados ? (
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="h-8 w-8 text-success" />
                    <div>
                      <p className="text-sm text-muted-foreground">Produto Mais Vendido</p>
                      <p className="font-semibold">
                        {vendas.length > 0 ? getMostSoldProduct() : "N/A"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Forma de Pagamento Preferida</p>
                      <p className="font-semibold">{getMostUsedPaymentMethod()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-muted/50">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-8 w-8 text-accent" />
                    <div>
                      <p className="text-sm text-muted-foreground">Melhor Dia da Semana</p>
                      <p className="font-semibold">{getBestDayOfWeek()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8">
              <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Recurso exclusivo do Plano Ouro</h3>
              <p className="text-muted-foreground mb-4">
                Acesse relatórios avançados com análises de produtos mais vendidos, 
                formas de pagamento e tendências de vendas.
              </p>
              <a href="/">
                <Button className="bg-gold hover:bg-gold/90 text-primary-foreground">
                  <Crown className="w-4 h-4 mr-2" />
                  Fazer Upgrade para Ouro
                </Button>
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tabela de Vendas */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalhamento de Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Hora</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Pagamento</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">
                      Nenhuma venda encontrada no período
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                vendas.map((venda) => (
                  <React.Fragment key={venda.id}>
                    <TableRow>
                      <TableCell>
                        {format(new Date(venda.created_at), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(venda.created_at), "HH:mm")}
                      </TableCell>
                      <TableCell>{venda.profiles?.nome_completo || "N/A"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {formatarFormaPagamento(venda.forma_pagamento)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        R$ {Number(venda.valor_total).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    {venda.itens_venda && venda.itens_venda.length > 0 && (
                      <TableRow className="bg-muted/50">
                        <TableCell colSpan={5} className="py-2">
                          <div className="pl-4 space-y-1">
                            <p className="text-xs font-semibold text-muted-foreground mb-2">
                              Itens da venda:
                            </p>
                            {venda.itens_venda.map((item, idx) => (
                              <div
                                key={idx}
                                className="text-sm flex justify-between items-center py-1"
                              >
                                <span>
                                  {item.quantidade}x {item.nome_produto}
                                </span>
                                <span className="text-muted-foreground">
                                  R$ {Number(item.preco_unitario).toFixed(2)} = R${" "}
                                  {Number(item.subtotal).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
