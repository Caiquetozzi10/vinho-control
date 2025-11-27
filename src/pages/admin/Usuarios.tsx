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
import { Plus, Edit, Users as UsersIcon, UserX } from "lucide-react";

type Profile = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  ativo: boolean;
  adega_id: string | null;
  adegas: { nome: string } | null;
  user_roles: Array<{ role: string }>;
};

type Adega = {
  id: string;
  nome: string;
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Profile[]>([]);
  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Profile | null>(null);

  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    telefone: "",
    adega_id: "",
    role: "operador",
    ativo: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usuariosRes, adegasRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("*")
          .order("nome_completo"),
        supabase.from("adegas").select("id, nome").order("nome"),
      ]);

      if (usuariosRes.error) throw usuariosRes.error;
      if (adegasRes.error) throw adegasRes.error;

      // Get user roles and adegas separately
      const usuariosComDados = await Promise.all(
        (usuariosRes.data || []).map(async (usuario) => {
          const [rolesRes, adegaRes] = await Promise.all([
            supabase
              .from("user_roles")
              .select("role")
              .eq("user_id", usuario.id),
            usuario.adega_id
              ? supabase
                  .from("adegas")
                  .select("nome")
                  .eq("id", usuario.adega_id)
                  .single()
              : Promise.resolve({ data: null, error: null }),
          ]);

          return {
            ...usuario,
            user_roles: rolesRes.data || [],
            adegas: adegaRes.data,
          };
        })
      );

      setUsuarios(usuariosComDados as Profile[]);
      setAdegas(adegasRes.data || []);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (usuario: Profile) => {
    setEditingUsuario(usuario);
    setFormData({
      nome_completo: usuario.nome_completo,
      email: usuario.email,
      telefone: usuario.telefone || "",
      adega_id: usuario.adega_id || "",
      role: usuario.user_roles[0]?.role || "operador",
      ativo: usuario.ativo,
    });
    setDialogOpen(true);
  };

  const handleUpdateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUsuario) return;

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          nome_completo: formData.nome_completo,
          telefone: formData.telefone || null,
          adega_id: formData.adega_id || null,
          ativo: formData.ativo,
        })
        .eq("id", editingUsuario.id);

      if (profileError) throw profileError;

      // Update role
      // First delete existing role, then insert new one
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", editingUsuario.id);

      const { error: roleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: editingUsuario.id,
          role: formData.role as "admin_geral" | "gerente_adega" | "operador",
          adega_id: formData.adega_id || null,
        });

      if (roleError) throw roleError;

      toast.success("Usuário atualizado com sucesso!");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      toast.error("Erro ao atualizar usuário");
    }
  };

  const handleToggleAtivo = async (usuario: Profile) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ ativo: !usuario.ativo })
        .eq("id", usuario.id);

      if (error) throw error;
      toast.success(
        usuario.ativo ? "Usuário bloqueado" : "Usuário ativado"
      );
      fetchData();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      toast.error("Erro ao atualizar status");
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      email: "",
      telefone: "",
      adega_id: "",
      role: "operador",
      ativo: true,
    });
    setEditingUsuario(null);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin_geral":
        return <Badge className="bg-primary">Admin Geral</Badge>;
      case "gerente_adega":
        return <Badge className="bg-accent">Gerente</Badge>;
      case "operador":
        return <Badge variant="secondary">Operador</Badge>;
      default:
        return <Badge>{role}</Badge>;
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
          <h1 className="text-3xl font-bold tracking-tight">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">Administre acessos e permissões</p>
        </div>
      </div>

      <Card className="shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Adega</TableHead>
              <TableHead>Função</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usuarios.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <UsersIcon className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              usuarios.map((usuario) => (
                <TableRow key={usuario.id}>
                  <TableCell className="font-medium">{usuario.nome_completo}</TableCell>
                  <TableCell>{usuario.email}</TableCell>
                  <TableCell>{usuario.adegas?.nome || "-"}</TableCell>
                  <TableCell>
                    {usuario.user_roles.length > 0
                      ? getRoleBadge(usuario.user_roles[0].role)
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {usuario.ativo ? (
                      <Badge className="bg-success">Ativo</Badge>
                    ) : (
                      <Badge variant="destructive">Bloqueado</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(usuario)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(usuario)}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetForm();
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>Atualize as informações do usuário</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateUsuario} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="nome_completo">Nome Completo</Label>
                <Input
                  id="nome_completo"
                  value={formData.nome_completo}
                  onChange={(e) =>
                    setFormData({ ...formData, nome_completo: e.target.value })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" value={formData.email} disabled />
              </div>

              <div className="space-y-2">
                <Label htmlFor="telefone">Telefone</Label>
                <Input
                  id="telefone"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Adega</Label>
                <Select
                  value={formData.adega_id}
                  onValueChange={(value) => setFormData({ ...formData, adega_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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

              <div className="space-y-2">
                <Label>Função</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin_geral">Admin Geral</SelectItem>
                    <SelectItem value="gerente_adega">Gerente</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2 space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.ativo ? "ativo" : "bloqueado"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ativo: value === "ativo" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativo">Ativo</SelectItem>
                    <SelectItem value="bloqueado">Bloqueado</SelectItem>
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
              <Button type="submit">Atualizar</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
