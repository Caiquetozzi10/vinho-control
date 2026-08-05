import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Search, Package, AlertTriangle } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { z } from "zod";

const produtoSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  categoria: z.string().min(1, "Categoria é obrigatória"),
  preco_venda: z.number().positive("Preço deve ser positivo"),
  quantidade_estoque: z.number().min(0, "Quantidade não pode ser negativa"),
});

type Produto = {
  id: string;
  nome: string;
  categoria: string;
  preco_venda: number;
  custo: number | null;
  quantidade_estoque: number;
  estoque_minimo: number;
  codigo_barras: string | null;
  ativo: boolean;
};

type Categoria = {
  id: string;
  nome: string;
};

export default function Produtos() {
  const { adegaId } = useUserRole();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null);
  const [scanValue, setScanValue] = useState("");
  const scanInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    nome: "",
    categoria: "",
    preco_venda: "",
    custo: "",
    quantidade_estoque: "",
    estoque_minimo: "5",
    codigo_barras: "",
  });

  useEffect(() => {
    fetchProdutos();
    fetchCategorias();
  }, [adegaId]);


  const fetchProdutos = async () => {
    if (!adegaId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("*")
        .eq("adega_id", adegaId)
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setProdutos(data || []);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");

      if (error) throw error;
      setCategorias(data || []);
    } catch (error) {
      console.error("Erro ao buscar categorias:", error);
    }
  };

  // Leitor de código de barras: identifica o produto automaticamente
  const handleScan = async (codigoRaw: string) => {
    const codigo = codigoRaw.trim();
    if (!codigo) return;
    setScanValue("");

    const local = produtos.find((p) => p.codigo_barras === codigo);
    if (local) {
      toast.success(`Produto identificado: ${local.nome}`);
      handleEdit(local);
      return;
    }

    if (!adegaId) {
      toast.error("Erro: Adega não identificada");
      return;
    }

    const { data, error } = await supabase
      .from("produtos")
      .select("*")
      .eq("adega_id", adegaId)
      .eq("codigo_barras", codigo)
      .maybeSingle();

    if (error) {
      console.error("Erro ao buscar código de barras:", error);
      toast.error("Erro ao consultar código de barras");
      return;
    }

    if (data) {
      if (!data.ativo) {
        toast.info(`Produto inativo encontrado: ${data.nome}. Reative os dados abaixo.`);
      } else {
        toast.success(`Produto identificado: ${data.nome}`);
      }
      handleEdit(data as Produto);
      return;
    }

    // Código novo: abre cadastro já com o código preenchido
    resetForm();
    setFormData((prev) => ({ ...prev, codigo_barras: codigo }));
    setDialogOpen(true);
    toast.info("Código novo — cadastre o produto");
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      produtoSchema.parse({
        nome: formData.nome,
        categoria: formData.categoria,
        preco_venda: parseFloat(formData.preco_venda),
        quantidade_estoque: parseInt(formData.quantidade_estoque),
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    if (!adegaId) {
      toast.error("Erro: Adega não identificada");
      return;
    }

    try {
      const produtoData = {
        adega_id: adegaId,
        nome: formData.nome,
        categoria: formData.categoria as any,
        preco_venda: parseFloat(formData.preco_venda),
        custo: formData.custo ? parseFloat(formData.custo) : null,
        quantidade_estoque: parseInt(formData.quantidade_estoque),
        estoque_minimo: parseInt(formData.estoque_minimo),
        codigo_barras: formData.codigo_barras || null,
      };

      if (editingProduto) {
        const { error } = await supabase
          .from("produtos")
          .update(produtoData)
          .eq("id", editingProduto.id);

        if (error) throw error;
        toast.success("Produto atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("produtos")
          .insert([produtoData]);

        if (error) throw error;
        toast.success("Produto cadastrado com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast.error("Erro ao salvar produto");
    }
  };

  const handleEdit = (produto: Produto) => {
    setEditingProduto(produto);
    setFormData({
      nome: produto.nome,
      categoria: produto.categoria,
      preco_venda: produto.preco_venda.toString(),
      custo: produto.custo?.toString() || "",
      quantidade_estoque: produto.quantidade_estoque.toString(),
      estoque_minimo: produto.estoque_minimo.toString(),
      codigo_barras: produto.codigo_barras || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;

    try {
      const { error } = await supabase
        .from("produtos")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;
      toast.success("Produto excluído com sucesso!");
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast.error("Erro ao excluir produto");
    }
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      categoria: "",
      preco_venda: "",
      custo: "",
      quantidade_estoque: "",
      estoque_minimo: "5",
      codigo_barras: "",
    });
    setEditingProduto(null);
  };

  const filteredProdutos = produtos.filter(
    (produto) =>
      produto.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      produto.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const produtosEstoqueBaixo = produtos.filter(
    (p) => p.quantidade_estoque <= p.estoque_minimo
  );

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
          <h1 className="text-3xl font-bold tracking-tight">Produtos</h1>
          <p className="text-muted-foreground">Gerencie o catálogo de produtos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingProduto ? "Editar Produto" : "Novo Produto"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações do produto
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select
                    value={formData.categoria}
                    onValueChange={(value) => setFormData({ ...formData, categoria: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {categorias.map((cat) => (
                        <SelectItem key={cat.id} value={cat.nome}>
                          {cat.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_barras">Código de Barras</Label>
                  <Input
                    id="codigo_barras"
                    value={formData.codigo_barras}
                    onChange={(e) => setFormData({ ...formData, codigo_barras: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preco_venda">Preço de Venda (R$) *</Label>
                  <Input
                    id="preco_venda"
                    type="number"
                    step="0.01"
                    value={formData.preco_venda}
                    onChange={(e) => setFormData({ ...formData, preco_venda: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="custo">Custo (R$)</Label>
                  <Input
                    id="custo"
                    type="number"
                    step="0.01"
                    value={formData.custo}
                    onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantidade_estoque">Quantidade em Estoque *</Label>
                  <Input
                    id="quantidade_estoque"
                    type="number"
                    value={formData.quantidade_estoque}
                    onChange={(e) => setFormData({ ...formData, quantidade_estoque: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estoque_minimo">Estoque Mínimo</Label>
                  <Input
                    id="estoque_minimo"
                    type="number"
                    value={formData.estoque_minimo}
                    onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    resetForm();
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingProduto ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {produtosEstoqueBaixo.length > 0 && (
        <Card className="border-warning bg-warning/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-medium">
                {produtosEstoqueBaixo.length} produto(s) com estoque baixo
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-card border-primary/30">
        <CardContent className="p-4 space-y-2">
          <Label htmlFor="scan" className="flex items-center gap-2">
            <Barcode className="h-4 w-4 text-primary" />
            Leitor de código de barras
          </Label>
          <Input
            id="scan"
            ref={scanInputRef}
            autoFocus
            placeholder="Aproxime o leitor e escaneie o produto..."
            value={scanValue}
            onChange={(e) => setScanValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleScan(scanValue);
              }
            }}
          />
          <p className="text-xs text-muted-foreground">
            Se o código já existir, o produto é identificado e aberto para edição. Se for novo, o cadastro abre com o código preenchido.
          </p>
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou código de barras..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Card className="shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Código</TableHead>
              <TableHead className="text-right">Preço</TableHead>
              <TableHead className="text-right">Estoque</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProdutos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum produto encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredProdutos.map((produto) => (
                <TableRow key={produto.id}>
                  <TableCell className="font-medium">{produto.nome}</TableCell>
                  <TableCell>{produto.categoria}</TableCell>
                  <TableCell>{produto.codigo_barras || "-"}</TableCell>
                  <TableCell className="text-right">
                    R$ {produto.preco_venda.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <span
                      className={
                        produto.quantidade_estoque <= produto.estoque_minimo
                          ? "text-warning font-medium"
                          : ""
                      }
                    >
                      {produto.quantidade_estoque}
                    </span>
                  </TableCell>
                  <TableCell>
                    {produto.quantidade_estoque <= produto.estoque_minimo ? (
                      <Badge variant="destructive">Estoque Baixo</Badge>
                    ) : (
                      <Badge variant="default" className="bg-success">
                        Disponível
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(produto)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(produto.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
