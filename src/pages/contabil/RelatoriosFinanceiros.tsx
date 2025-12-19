import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, eachMonthOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FileText, Download, TrendingUp, TrendingDown, Minus, Calendar } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';

type FluxoCaixaItem = {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
  saldoAcumulado: number;
};

type ResultadoMensal = {
  mes: string;
  receitas: number;
  despesas: number;
  cmv: number;
  lucroBruto: number;
  lucroLiquido: number;
  margemBruta: number;
  margemLiquida: number;
};

type CategoriaResumo = {
  categoria: string;
  tipo: string;
  valor: number;
  percentual: number;
};

export default function RelatoriosFinanceiros() {
  const { adegaId } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState("mes_atual");
  const [relatorioAtivo, setRelatorioAtivo] = useState("fluxo_caixa");
  
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaItem[]>([]);
  const [resultadosMensais, setResultadosMensais] = useState<ResultadoMensal[]>([]);
  const [categoriasResumo, setCategoriasResumo] = useState<CategoriaResumo[]>([]);

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
        return { start: startOfYear(now), end: endOfYear(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchData = async () => {
    if (!adegaId) return;
    setLoading(true);

    try {
      const { start, end } = getDateRange();
      
      const { data: transacoes, error } = await supabase
        .from("transacoes_financeiras")
        .select(`
          *,
          categoria:categorias_financeiras(nome, tipo, cor)
        `)
        .eq("adega_id", adegaId)
        .gte("data_transacao", format(start, "yyyy-MM-dd"))
        .lte("data_transacao", format(end, "yyyy-MM-dd"))
        .order("data_transacao");

      if (error) throw error;

      // Processar Fluxo de Caixa
      const fluxoPorDia: Record<string, { entradas: number; saidas: number }> = {};
      const categoriasTotais: Record<string, { tipo: string; valor: number }> = {};
      const resultadosPorMes: Record<string, { receitas: number; despesas: number; cmv: number }> = {};

      transacoes?.forEach((t) => {
        const valor = Number(t.valor);
        const dia = t.data_transacao;
        const mes = format(new Date(t.data_transacao + "T00:00:00"), "yyyy-MM");
        const categoriaNome = (t.categoria as any)?.nome || "Sem categoria";
        const categoriaTipo = t.tipo;

        // Fluxo por dia
        if (!fluxoPorDia[dia]) {
          fluxoPorDia[dia] = { entradas: 0, saidas: 0 };
        }
        if (t.tipo === "entrada") {
          fluxoPorDia[dia].entradas += valor;
        } else {
          fluxoPorDia[dia].saidas += valor;
        }

        // Categorias
        if (!categoriasTotais[categoriaNome]) {
          categoriasTotais[categoriaNome] = { tipo: categoriaTipo, valor: 0 };
        }
        categoriasTotais[categoriaNome].valor += valor;

        // Resultados mensais
        if (!resultadosPorMes[mes]) {
          resultadosPorMes[mes] = { receitas: 0, despesas: 0, cmv: 0 };
        }
        if (t.tipo === "entrada") {
          resultadosPorMes[mes].receitas += valor;
        } else {
          resultadosPorMes[mes].despesas += valor;
          if (categoriaNome === "Compra de Mercadorias") {
            resultadosPorMes[mes].cmv += valor;
          }
        }
      });

      // Formatar Fluxo de Caixa
      let saldoAcumulado = 0;
      const fluxoArray = Object.entries(fluxoPorDia)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([data, valores]) => {
          const saldo = valores.entradas - valores.saidas;
          saldoAcumulado += saldo;
          return {
            data: format(new Date(data + "T00:00:00"), "dd/MM", { locale: ptBR }),
            entradas: valores.entradas,
            saidas: valores.saidas,
            saldo,
            saldoAcumulado,
          };
        });
      setFluxoCaixa(fluxoArray);

      // Formatar Categorias
      const totalGeral = Object.values(categoriasTotais).reduce((acc, c) => acc + c.valor, 0);
      const categoriasArray = Object.entries(categoriasTotais)
        .map(([categoria, { tipo, valor }]) => ({
          categoria,
          tipo,
          valor,
          percentual: totalGeral > 0 ? (valor / totalGeral) * 100 : 0,
        }))
        .sort((a, b) => b.valor - a.valor);
      setCategoriasResumo(categoriasArray);

      // Formatar Resultados Mensais
      const meses = eachMonthOfInterval({ start, end });
      const resultadosArray = meses.map(mes => {
        const mesKey = format(mes, "yyyy-MM");
        const dados = resultadosPorMes[mesKey] || { receitas: 0, despesas: 0, cmv: 0 };
        const lucroBruto = dados.receitas - dados.cmv;
        const lucroLiquido = dados.receitas - dados.despesas;
        
        return {
          mes: format(mes, "MMM/yy", { locale: ptBR }),
          receitas: dados.receitas,
          despesas: dados.despesas,
          cmv: dados.cmv,
          lucroBruto,
          lucroLiquido,
          margemBruta: dados.receitas > 0 ? (lucroBruto / dados.receitas) * 100 : 0,
          margemLiquida: dados.receitas > 0 ? (lucroLiquido / dados.receitas) * 100 : 0,
        };
      });
      setResultadosMensais(resultadosArray);

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

  const exportarCSV = () => {
    let csvContent = "";
    
    if (relatorioAtivo === "fluxo_caixa") {
      csvContent = "Data,Entradas,Saídas,Saldo,Saldo Acumulado\n";
      fluxoCaixa.forEach(item => {
        csvContent += `${item.data},${item.entradas},${item.saidas},${item.saldo},${item.saldoAcumulado}\n`;
      });
    } else if (relatorioAtivo === "resultado") {
      csvContent = "Mês,Receitas,Despesas,CMV,Lucro Bruto,Lucro Líquido,Margem Bruta %,Margem Líquida %\n";
      resultadosMensais.forEach(item => {
        csvContent += `${item.mes},${item.receitas},${item.despesas},${item.cmv},${item.lucroBruto},${item.lucroLiquido},${item.margemBruta.toFixed(1)},${item.margemLiquida.toFixed(1)}\n`;
      });
    } else {
      csvContent = "Categoria,Tipo,Valor,Percentual\n";
      categoriasResumo.forEach(item => {
        csvContent += `${item.categoria},${item.tipo},${item.valor},${item.percentual.toFixed(1)}%\n`;
      });
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_${relatorioAtivo}_${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
  };

  // Cálculos de resumo
  const totalReceitas = resultadosMensais.reduce((acc, r) => acc + r.receitas, 0);
  const totalDespesas = resultadosMensais.reduce((acc, r) => acc + r.despesas, 0);
  const lucroLiquidoTotal = totalReceitas - totalDespesas;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Análises detalhadas das finanças</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
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
          
          <Button variant="outline" onClick={exportarCSV}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Resumo Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Receitas</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalReceitas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingDown className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Despesas</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalDespesas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${lucroLiquidoTotal >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                {lucroLiquidoTotal >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Resultado</p>
                <p className={`text-xl font-bold ${lucroLiquidoTotal >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(lucroLiquidoTotal)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Relatórios */}
      <Tabs value={relatorioAtivo} onValueChange={setRelatorioAtivo}>
        <TabsList>
          <TabsTrigger value="fluxo_caixa" className="gap-2">
            <FileText className="h-4 w-4" />
            Fluxo de Caixa
          </TabsTrigger>
          <TabsTrigger value="resultado" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Resultado Mensal
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-2">
            <Minus className="h-4 w-4" />
            Por Categoria
          </TabsTrigger>
        </TabsList>

        {/* Fluxo de Caixa */}
        <TabsContent value="fluxo_caixa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fluxo de Caixa</CardTitle>
              <CardDescription>Movimentação diária de entradas e saídas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fluxoCaixa}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="data" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="entradas" name="Entradas" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead className="text-right">Entradas</TableHead>
                    <TableHead className="text-right">Saídas</TableHead>
                    <TableHead className="text-right">Saldo do Dia</TableHead>
                    <TableHead className="text-right">Saldo Acumulado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fluxoCaixa.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>{item.data}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(item.entradas)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(item.saidas)}</TableCell>
                      <TableCell className={`text-right ${item.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatCurrency(item.saldo)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${item.saldoAcumulado >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatCurrency(item.saldoAcumulado)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Resultado Mensal */}
        <TabsContent value="resultado" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resultado Mensal</CardTitle>
              <CardDescription>Comparativo de receitas, despesas e lucro por mês</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mb-6">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={resultadosMensais}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="mes" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="receitas" name="Receitas" stroke="#22c55e" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" strokeWidth={2} dot={{ r: 4 }} />
                    <Line type="monotone" dataKey="lucroLiquido" name="Lucro Líquido" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Receitas</TableHead>
                    <TableHead className="text-right">CMV</TableHead>
                    <TableHead className="text-right">Lucro Bruto</TableHead>
                    <TableHead className="text-right">Despesas</TableHead>
                    <TableHead className="text-right">Lucro Líquido</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultadosMensais.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium capitalize">{item.mes}</TableCell>
                      <TableCell className="text-right text-green-600">{formatCurrency(item.receitas)}</TableCell>
                      <TableCell className="text-right text-orange-600">{formatCurrency(item.cmv)}</TableCell>
                      <TableCell className="text-right text-purple-600">{formatCurrency(item.lucroBruto)}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(item.despesas)}</TableCell>
                      <TableCell className={`text-right font-medium ${item.lucroLiquido >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                        {formatCurrency(item.lucroLiquido)}
                      </TableCell>
                      <TableCell className={`text-right ${item.margemLiquida >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {item.margemLiquida.toFixed(1)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Por Categoria */}
        <TabsContent value="categorias" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo por Categoria</CardTitle>
              <CardDescription>Distribuição de valores por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">% do Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoriasResumo.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.categoria}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 ${item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                          {item.tipo === 'entrada' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                          {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right ${item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(item.valor)}
                      </TableCell>
                      <TableCell className="text-right">{item.percentual.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}