import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type Categoria = {
  id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  created_at: string;
};

export default function Categorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    descricao: "",
  });

  useEffect(() => {
    carregarCategorias();
  }, []);

  const carregarCategorias = async () => {
    try {
      const { data, error } = await supabase
        .from("categorias")
        .select("*")
        .order("nome");

      if (error) throw error;
      setCategorias(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar categorias: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nome.trim()) {
      toast.error("Nome da categoria é obrigatório");
      return;
    }

    try {
      if (editingCategoria) {
        const { error } = await supabase
          .from("categorias")
          .update({
            nome: formData.nome,
            descricao: formData.descricao || null,
          })
          .eq("id", editingCategoria.id);

        if (error) throw error;
        toast.success("Categoria atualizada com sucesso!");
      } else {
        const { error } = await supabase
          .from("categorias")
          .insert({
            nome: formData.nome,
            descricao: formData.descricao || null,
          });

        if (error) throw error;
        toast.success("Categoria criada com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      carregarCategorias();
    } catch (error: any) {
      toast.error("Erro ao salvar categoria: " + error.message);
    }
  };

  const handleEdit = (categoria: Categoria) => {
    setEditingCategoria(categoria);
    setFormData({
      nome: categoria.nome,
      descricao: categoria.descricao || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria?")) return;

    try {
      const { error } = await supabase
        .from("categorias")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Categoria excluída com sucesso!");
      carregarCategorias();
    } catch (error: any) {
      toast.error("Erro ao excluir categoria: " + error.message);
    }
  };

  const toggleAtivo = async (categoria: Categoria) => {
    try {
      const { error } = await supabase
        .from("categorias")
        .update({ ativo: !categoria.ativo })
        .eq("id", categoria.id);

      if (error) throw error;
      toast.success(
        categoria.ativo ? "Categoria desativada" : "Categoria ativada"
      );
      carregarCategorias();
    } catch (error: any) {
      toast.error("Erro ao atualizar categoria: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({ nome: "", descricao: "" });
    setEditingCategoria(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Tags className="h-8 w-8" />
            Categorias
          </h1>
          <p className="text-muted-foreground">
            Gerencie as categorias de produtos
          </p>
        </div>
        <Button
          onClick={() => setDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Nova Categoria
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Categorias</CardTitle>
          <CardDescription>
            Categorias cadastradas no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
                      Nenhuma categoria cadastrada
                    </TableCell>
                  </TableRow>
                ) : (
                  categorias.map((categoria) => (
                    <TableRow key={categoria.id}>
                      <TableCell className="font-medium">
                        {categoria.nome}
                      </TableCell>
                      <TableCell>
                        {categoria.descricao || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={categoria.ativo ? "default" : "secondary"}
                          className="cursor-pointer"
                          onClick={() => toggleAtivo(categoria)}
                        >
                          {categoria.ativo ? "Ativa" : "Inativa"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(categoria)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(categoria.id)}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCategoria ? "Editar" : "Nova"} Categoria
            </DialogTitle>
            <DialogDescription>
              {editingCategoria
                ? "Atualize os dados da categoria"
                : "Preencha os dados da nova categoria"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label htmlFor="nome">Nome *</Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Vinhos Tintos"
                  required
                />
              </div>
              <div>
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Descrição da categoria (opcional)"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={handleDialogClose}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingCategoria ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
