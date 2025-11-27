import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { Plus, Edit, Building2 } from "lucide-react";
import { z } from "zod";

const adegaSchema = z.object({
  nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres"),
  email: z.string().email("E-mail inválido").optional().or(z.literal("")),
});

type Adega = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  endereco: string | null;
  status_pagamento: string;
  ativo: boolean;
  data_ultimo_pagamento: string | null;
};

export default function Adegas() {
  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdega, setEditingAdega] = useState<Adega | null>(null);

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    status_pagamento: "aguardando",
    ativo: true,
  });

  useEffect(() => {
    fetchAdegas();
  }, []);

  const fetchAdegas = async () => {
    try {
      const { data, error } = await supabase
        .from("adegas")
        .select("*")
        .order("nome");

      if (error) throw error;
      setAdegas(data || []);
    } catch (error) {
      console.error("Erro ao buscar adegas:", error);
      toast.error("Erro ao carregar adegas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      adegaSchema.parse({
        nome: formData.nome,
        email: formData.email,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    try {
      const adegaData = {
        nome: formData.nome,
        email: formData.email || null,
        telefone: formData.telefone || null,
        endereco: formData.endereco || null,
        status_pagamento: formData.status_pagamento as "ativo" | "aguardando" | "bloqueado",
        ativo: formData.ativo,
      };

      if (editingAdega) {
        const { error } = await supabase
          .from("adegas")
          .update(adegaData)
          .eq("id", editingAdega.id);

        if (error) throw error;
        toast.success("Adega atualizada com sucesso!");
      } else {
        const { error } = await supabase.from("adegas").insert([adegaData]);

        if (error) throw error;
        toast.success("Adega cadastrada com sucesso!");
      }

      setDialogOpen(false);
      resetForm();
      fetchAdegas();
    } catch (error) {
      console.error("Erro ao salvar adega:", error);
      toast.error("Erro ao salvar adega");
    }
  };

  const handleEdit = (adega: Adega) => {
    setEditingAdega(adega);
    setFormData({
      nome: adega.nome,
      email: adega.email || "",
      telefone: adega.telefone || "",
      endereco: adega.endereco || "",
      status_pagamento: adega.status_pagamento,
      ativo: adega.ativo,
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      telefone: "",
      endereco: "",
      status_pagamento: "aguardando",
      ativo: true,
    });
    setEditingAdega(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ativo":
        return <Badge className="bg-success">Ativo</Badge>;
      case "aguardando":
        return <Badge variant="secondary">Aguardando</Badge>;
      case "bloqueado":
        return <Badge variant="destructive">Bloqueado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Adegas</h1>
          <p className="text-muted-foreground">Administre clientes e pagamentos</p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Adega
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAdega ? "Editar Adega" : "Nova Adega"}
              </DialogTitle>
              <DialogDescription>
                Preencha as informações da adega
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
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Status de Pagamento</Label>
                  <Select
                    value={formData.status_pagamento}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status_pagamento: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="aguardando">Aguardando</SelectItem>
                      <SelectItem value="bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Status da Conta</Label>
                  <Select
                    value={formData.ativo ? "ativo" : "inativo"}
                    onValueChange={(value) =>
                      setFormData({ ...formData, ativo: value === "ativo" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
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
                  {editingAdega ? "Atualizar" : "Cadastrar"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Status Pagamento</TableHead>
              <TableHead>Status Conta</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adegas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhuma adega cadastrada</p>
                </TableCell>
              </TableRow>
            ) : (
              adegas.map((adega) => (
                <TableRow key={adega.id}>
                  <TableCell className="font-medium">{adega.nome}</TableCell>
                  <TableCell>{adega.email || "-"}</TableCell>
                  <TableCell>{adega.telefone || "-"}</TableCell>
                  <TableCell>{getStatusBadge(adega.status_pagamento)}</TableCell>
                  <TableCell>
                    {adega.ativo ? (
                      <Badge className="bg-success">Ativo</Badge>
                    ) : (
                      <Badge variant="secondary">Inativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(adega)}>
                      <Edit className="h-4 w-4" />
                    </Button>
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
