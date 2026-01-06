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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Plus, Edit, Users as UsersIcon, UserX, Key, AlertTriangle, Crown } from "lucide-react";
import { useAdegaPlan } from "@/hooks/useAdegaPlan";
import { useUserRole } from "@/hooks/useUserRole";

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
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [resetPasswordUsuario, setResetPasswordUsuario] = useState<Profile | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const { plano, maxOperadores, isLoading: planLoading } = useAdegaPlan();
  const { adegaId, role } = useUserRole();
  const isAdminGeral = role === 'admin_geral';

  const [formData, setFormData] = useState({
    nome_completo: "",
    email: "",
    senha: "",
    telefone: "",
    adega_id: "",
    role: "operador",
    ativo: true,
  });

  // Count operators in current adega
  const operadoresCount = usuarios.filter(
    u => u.adega_id === adegaId && u.user_roles.some(r => r.role === 'operador')
  ).length;
  
  const canAddOperator = isAdminGeral || operadoresCount < maxOperadores;

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
      senha: "",
      telefone: usuario.telefone || "",
      adega_id: usuario.adega_id || "",
      role: usuario.user_roles[0]?.role || "operador",
      ativo: usuario.ativo,
    });
    setDialogOpen(true);
  };

  const handleCreateUsuario = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check operator limit for non-admin users
    if (!isAdminGeral && formData.role === 'operador' && !canAddOperator) {
      toast.error(`Limite de ${maxOperadores} operadores atingido. Faça upgrade para o Plano Ouro.`);
      return;
    }

    if (!formData.senha || formData.senha.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    setActionLoading(true);
    try {
      // Use edge function for secure user creation
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'create_user',
          email: formData.email,
          password: formData.senha,
          nomeCompleto: formData.nome_completo,
          telefone: formData.telefone || null,
          adegaId: formData.adega_id || null,
          role: formData.role,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Usuário criado com sucesso!");
      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      toast.error(error.message || "Erro ao criar usuário");
    } finally {
      setActionLoading(false);
    }
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
    setActionLoading(true);
    try {
      // Use edge function for secure status toggle (includes force logout)
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'toggle_user_status',
          userId: usuario.id,
          ativo: !usuario.ativo,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(usuario.ativo ? "Usuário bloqueado" : "Usuário ativado");
      fetchData();
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
      toast.error(error.message || "Erro ao atualizar status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetPassword = (usuario: Profile) => {
    setResetPasswordUsuario(usuario);
    setNewPassword("");
    setResetPasswordDialogOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordUsuario) return;

    if (!newPassword || newPassword.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    setActionLoading(true);
    try {
      // Use edge function for secure password reset
      const { data, error } = await supabase.functions.invoke('admin-user-management', {
        body: {
          action: 'reset_password',
          userId: resetPasswordUsuario.id,
          newPassword: newPassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success("Senha alterada com sucesso!");
      setResetPasswordDialogOpen(false);
      setResetPasswordUsuario(null);
      setNewPassword("");
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      toast.error(error.message || "Erro ao redefinir senha");
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome_completo: "",
      email: "",
      senha: "",
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
        return <Badge className="bg-accent">Admin Loja</Badge>;
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
        <div className="flex items-center gap-4">
          {!isAdminGeral && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant={plano === 'ouro' ? 'default' : 'secondary'} className={plano === 'ouro' ? 'bg-gold' : 'bg-silver'}>
                <Crown className="w-3 h-3 mr-1" />
                Plano {plano === 'ouro' ? 'Ouro' : 'Prata'}
              </Badge>
              <span className="text-muted-foreground">
                {operadoresCount}/{maxOperadores === Infinity ? '∞' : maxOperadores} operadores
              </span>
            </div>
          )}
          <Button 
            onClick={() => setDialogOpen(true)} 
            className="gap-2"
            disabled={!isAdminGeral && !canAddOperator}
          >
            <Plus className="h-4 w-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {!isAdminGeral && !canAddOperator && (
        <Alert className="border-gold/50 bg-gold/10">
          <AlertTriangle className="h-4 w-4 text-gold" />
          <AlertDescription className="text-foreground">
            Você atingiu o limite de {maxOperadores} operadores do Plano Prata. 
            <a href="/landing" className="ml-1 text-gold hover:underline font-medium">
              Faça upgrade para o Plano Ouro
            </a> para adicionar operadores ilimitados.
          </AlertDescription>
        </Alert>
      )}

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
                        onClick={() => handleResetPassword(usuario)}
                        disabled={actionLoading}
                      >
                        <Key className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleAtivo(usuario)}
                        disabled={actionLoading}
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
            <DialogTitle>{editingUsuario ? "Editar" : "Criar"} Usuário</DialogTitle>
            <DialogDescription>
              {editingUsuario ? "Atualize as informações do usuário" : "Crie um novo usuário no sistema"}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={editingUsuario ? handleUpdateUsuario : handleCreateUsuario} className="space-y-4">
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
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email} 
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  disabled={!!editingUsuario}
                  required
                />
              </div>

              {!editingUsuario && (
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
              )}

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
                    <SelectItem value="gerente_adega">Admin Loja</SelectItem>
                    <SelectItem value="operador">Operador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
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
              <Button type="submit" disabled={actionLoading}>
                {actionLoading ? "Processando..." : (editingUsuario ? "Atualizar" : "Criar")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Redefinir Senha</DialogTitle>
            <DialogDescription>
              Digite a nova senha para {resetPasswordUsuario?.nome_completo}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new_password">Nova Senha</Label>
              <Input
                id="new_password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setResetPasswordDialogOpen(false);
                  setResetPasswordUsuario(null);
                  setNewPassword("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={handleConfirmResetPassword} disabled={actionLoading}>
                {actionLoading ? "Processando..." : "Redefinir Senha"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
