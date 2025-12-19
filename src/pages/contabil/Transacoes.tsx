import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, ArrowUpCircle, ArrowDownCircle, Pencil, Trash2, Search, Calendar } from "lucide-react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

type Categoria = {
  id: string;
  nome: string;
  tipo: string;
  cor: string;
  icone: string;
};

type Transacao = {
  id: string;
  tipo: string;
  valor: number;
  descricao: string | null;
  data_transacao: string;
  forma_pagamento: string | null;
  observacoes: string | null;
  origem: string;
  categoria: Categoria | null;
  created_at: string;
};

export default function Transacoes() {
  const { adegaId } = useUserRole();
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTransacao, setEditingTransacao] = useState<Transacao | null>(null);
  const [tipoAtivo, setTipoAtivo] = useState<"entrada" | "saida">("entrada");
  const [searchTerm, setSearchTerm] = useState("");
  const [dataInicio, setDataInicio] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dataFim, setDataFim] = useState(format(endOfMonth(new Date()), "yyyy-MM-dd"));

  const [formData, setFormData] = useState({
    tipo: "entrada" as "entrada" | "saida",
    valor: "",
    descricao: "",
    data_transacao: format(new Date(), "yyyy-MM-dd"),
    categoria_id: "",
    forma_pagamento: "",
    observacoes: "",
  });

  const formasPagamento = [
    { value: "dinheiro", label: "Dinheiro" },
    { value: "pix", label: "PIX" },
    { value: "cartao_credito", label: "Cartão de Crédito" },
    { value: "cartao_debito", label: "Cartão de Débito" },
    { value: "boleto", label: "Boleto" },
    { value: "transferencia", label: "Transferência" },
  ];

  useEffect(() => {
    if (adegaId) {
      fetchCategorias();
      fetchTransacoes();
    }
  }, [adegaId, dataInicio, dataFim]);

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias_financeiras")
        .select("*")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  const fetchTransacoes = async () => {
    if (!adegaId) return;
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from("transacoes_financeiras")
        .select(`
          *,
          categoria:categorias_financeiras(id, nome, tipo, cor, icone)
        `)
        .eq("adega_id", adegaId)
        .gte("data_transacao", dataInicio)
        .lte("data_transacao", dataFim)
        .order("data_transacao", { ascending: false });

      if (error) throw error;
      setTransacoes(data || []);
    } catch (error) {
      console.error("Erro ao buscar transações:", error);
      toast.error("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adegaId) return;

    try {
      const transacaoData = {
        adega_id: adegaId,
        tipo: formData.tipo,
        valor: parseFloat(formData.valor),
        descricao: formData.descricao || null,
        data_transacao: formData.data_transacao,
        categoria_id: formData.categoria_id || null,
        forma_pagamento: formData.forma_pagamento || null,
        observacoes: formData.observacoes || null,
        origem: "manual",
      };

      if (editingTransacao) {
        const { error } = await supabase
          .from("transacoes_financeiras")
          .update(transacaoData)
          .eq("id", editingTransacao.id);

        if (error) throw error;
        toast.success("Transação atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("transacoes_financeiras")
          .insert(transacaoData);

        if (error) throw error;
        toast.success("Transação criada com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchTransacoes();
    } catch (error) {
      console.error("Erro ao salvar transação:", error);
      toast.error("Erro ao salvar transação");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      const { error } = await supabase
        .from("transacoes_financeiras")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Transação excluída com sucesso!");
      fetchTransacoes();
    } catch (error) {
      console.error("Erro ao excluir transação:", error);
      toast.error("Erro ao excluir transação");
    }
  };

  const handleEdit = (transacao: Transacao) => {
    setEditingTransacao(transacao);
    setFormData({
      tipo: transacao.tipo as "entrada" | "saida",
      valor: transacao.valor.toString(),
      descricao: transacao.descricao || "",
      data_transacao: transacao.data_transacao,
      categoria_id: (transacao.categoria as any)?.id || "",
      forma_pagamento: transacao.forma_pagamento || "",
      observacoes: transacao.observacoes || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setEditingTransacao(null);
    setFormData({
      tipo: "entrada",
      valor: "",
      descricao: "",
      data_transacao: format(new Date(), "yyyy-MM-dd"),
      categoria_id: "",
      forma_pagamento: "",
      observacoes: "",
    });
  };

  const openNewDialog = (tipo: "entrada" | "saida") => {
    resetForm();
    setFormData(prev => ({ ...prev, tipo }));
    setDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const filteredTransacoes = transacoes.filter(t => {
    const matchesType = tipoAtivo === "entrada" ? t.tipo === "entrada" : t.tipo === "saida";
    const matchesSearch = !searchTerm || 
      t.descricao?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.categoria as any)?.nome?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const categoriasDoTipo = categorias.filter(c => c.tipo === formData.tipo);

  // Calcular totais
  const totalEntradas = transacoes.filter(t => t.tipo === "entrada").reduce((acc, t) => acc + Number(t.valor), 0);
  const totalSaidas = transacoes.filter(t => t.tipo === "saida").reduce((acc, t) => acc + Number(t.valor), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transações Financeiras</h1>
          <p className="text-muted-foreground">Gerencie entradas e saídas do seu negócio</p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={() => openNewDialog("entrada")} className="bg-green-600 hover:bg-green-700">
            <ArrowUpCircle className="h-4 w-4 mr-2" />
            Nova Entrada
          </Button>
          <Button onClick={() => openNewDialog("saida")} variant="destructive">
            <ArrowDownCircle className="h-4 w-4 mr-2" />
            Nova Saída
          </Button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowUpCircle className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Entradas</p>
                <p className="text-xl font-bold text-green-600">{formatCurrency(totalEntradas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-red-500/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <ArrowDownCircle className="h-8 w-8 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Saídas</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(totalSaidas)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-${totalEntradas - totalSaidas >= 0 ? 'blue' : 'orange'}-500/20`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-full flex items-center justify-center ${totalEntradas - totalSaidas >= 0 ? 'bg-blue-500/20' : 'bg-orange-500/20'}`}>
                <span className={`text-lg font-bold ${totalEntradas - totalSaidas >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>=</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Saldo</p>
                <p className={`text-xl font-bold ${totalEntradas - totalSaidas >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatCurrency(totalEntradas - totalSaidas)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por descrição ou categoria..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  value={dataInicio}
                  onChange={(e) => setDataInicio(e.target.value)}
                  className="w-[150px]"
                />
              </div>
              <span className="self-center text-muted-foreground">até</span>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                className="w-[150px]"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs e Tabela */}
      <Card>
        <CardContent className="p-4">
          <Tabs value={tipoAtivo} onValueChange={(v) => setTipoAtivo(v as "entrada" | "saida")}>
            <TabsList className="mb-4">
              <TabsTrigger value="entrada" className="gap-2">
                <ArrowUpCircle className="h-4 w-4" />
                Entradas
              </TabsTrigger>
              <TabsTrigger value="saida" className="gap-2">
                <ArrowDownCircle className="h-4 w-4" />
                Saídas
              </TabsTrigger>
            </TabsList>

            <TabsContent value={tipoAtivo}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Forma Pagamento</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : filteredTransacoes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Nenhuma transação encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTransacoes.map((transacao) => (
                      <TableRow key={transacao.id}>
                        <TableCell>
                          {format(new Date(transacao.data_transacao + "T00:00:00"), "dd/MM/yyyy", { locale: ptBR })}
                        </TableCell>
                        <TableCell>{transacao.descricao || "-"}</TableCell>
                        <TableCell>
                          {transacao.categoria ? (
                            <Badge 
                              variant="outline" 
                              style={{ borderColor: (transacao.categoria as any).cor, color: (transacao.categoria as any).cor }}
                            >
                              {(transacao.categoria as any).nome}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="capitalize">
                          {transacao.forma_pagamento?.replace("_", " ") || "-"}
                        </TableCell>
                        <TableCell className={`text-right font-medium ${transacao.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'}`}>
                          {transacao.tipo === 'entrada' ? '+' : '-'} {formatCurrency(Number(transacao.valor))}
                        </TableCell>
                        <TableCell>
                          <Badge variant={transacao.origem === 'manual' ? 'secondary' : 'default'}>
                            {transacao.origem === 'manual' ? 'Manual' : transacao.origem === 'venda' ? 'Venda' : 'Estoque'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {transacao.origem === 'manual' && (
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(transacao)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(transacao.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Dialog de Nova/Editar Transação */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingTransacao ? "Editar" : "Nova"} {formData.tipo === "entrada" ? "Entrada" : "Saída"}
            </DialogTitle>
            <DialogDescription>
              {formData.tipo === "entrada" ? "Registre uma entrada financeira" : "Registre uma saída financeira"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(v) => setFormData({ ...formData, tipo: v as "entrada" | "saida", categoria_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="entrada">Entrada</SelectItem>
                    <SelectItem value="saida">Saída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Valor *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor}
                  onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                  placeholder="0,00"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrição</Label>
              <Input
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Ex: Pagamento de fornecedor"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data *</Label>
                <Input
                  type="date"
                  value={formData.data_transacao}
                  onChange={(e) => setFormData({ ...formData, data_transacao: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select
                  value={formData.categoria_id}
                  onValueChange={(v) => setFormData({ ...formData, categoria_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasDoTipo.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={formData.forma_pagamento}
                onValueChange={(v) => setFormData({ ...formData, forma_pagamento: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {formasPagamento.map((fp) => (
                    <SelectItem key={fp.value} value={fp.value}>
                      {fp.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações adicionais..."
                rows={2}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" className={formData.tipo === "entrada" ? "bg-green-600 hover:bg-green-700" : ""}>
                {editingTransacao ? "Salvar" : "Criar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}