import { useEffect, useState, useRef } from "react";
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
import { Plus, Edit, Building2, Upload, X, Image, Clock, Crown } from "lucide-react";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { differenceInDays, format } from "date-fns";

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
  logo_url: string | null;
  plano: "prata" | "ouro" | "diamante";
  is_trial: boolean;
  trial_expires_at: string | null;
};

export default function Adegas() {
  const [adegas, setAdegas] = useState<Adega[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAdega, setEditingAdega] = useState<Adega | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const isSuperAdmin = user?.email === 'admin@admin.com';

  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    endereco: "",
    status_pagamento: "aguardando",
    ativo: true,
    logo_url: "",
    plano: "prata" as "prata" | "ouro" | "diamante",
    trialOpcao: "nenhum" as "nenhum" | "7" | "14" | "30",
  });
  useEffect(() => {
    fetchAdegas();
  }, []);

  const fetchAdegas = async () => {
    try {
      // Use edge function to list adegas (bypasses RLS)
      const { data, error } = await supabase.functions.invoke('admin-adega-management', {
        body: { action: 'list_adegas' },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      setAdegas(data?.data || []);
    } catch (error) {
      console.error("Erro ao buscar adegas:", error);
      toast.error("Erro ao carregar adegas");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecione uma imagem");
      return;
    }

    // Validar tamanho (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 2MB");
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("adega-logos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("adega-logos")
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_url: publicUrl });
      setPreviewUrl(publicUrl);
      toast.success("Logo enviado com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar logo:", error);
      toast.error("Erro ao enviar logo");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setFormData({ ...formData, logo_url: "" });
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
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
      const isTrial = formData.trialOpcao !== 'nenhum';
      const trialDays = isTrial ? parseInt(formData.trialOpcao, 10) : 0;

      let trialExpiresAt: string | null = null;
      if (isTrial) {
        const trialExpires = new Date();
        trialExpires.setDate(trialExpires.getDate() + trialDays);
        trialExpiresAt = trialExpires.toISOString();
      }

      const adegaData = {
        nome: formData.nome,
        email: formData.email || null,
        telefone: formData.telefone || null,
        endereco: formData.endereco || null,
        status_pagamento: formData.status_pagamento as "ativo" | "aguardando" | "bloqueado",
        ativo: formData.ativo,
        logo_url: formData.logo_url || null,
        plano: formData.plano,
        is_trial: isTrial,
        trial_expires_at: trialExpiresAt,
      };

      if (editingAdega) {
        // Use edge function for secure update
        const updatePayload: any = {
          action: 'update_adega',
          adegaId: editingAdega.id,
          nome: adegaData.nome,
          email: adegaData.email,
          telefone: adegaData.telefone,
          endereco: adegaData.endereco,
          status_pagamento: adegaData.status_pagamento,
          ativo: adegaData.ativo,
          logo_url: adegaData.logo_url,
          plano: adegaData.plano,
          is_trial: adegaData.is_trial,
          trial_expires_at: adegaData.trial_expires_at,
        };


        const { data, error } = await supabase.functions.invoke('admin-adega-management', {
          body: updatePayload,
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        toast.success("Adega atualizada com sucesso!");
      } else {
        // Use edge function for secure creation
        const { data, error } = await supabase.functions.invoke('admin-adega-management', {
          body: {
            action: 'create_adega',
            ...adegaData,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
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

    // Determine current trial option for editing
    let trialOpcao: "nenhum" | "7" | "14" | "30" = "nenhum";
    if (adega.is_trial && adega.trial_expires_at) {
      const daysLeft = differenceInDays(new Date(adega.trial_expires_at), new Date());
      trialOpcao = daysLeft > 14 ? "30" : daysLeft > 7 ? "14" : "7";
    }

    setFormData({
      nome: adega.nome,
      email: adega.email || "",
      telefone: adega.telefone || "",
      endereco: adega.endereco || "",
      status_pagamento: adega.status_pagamento,
      ativo: adega.ativo,
      logo_url: adega.logo_url || "",
      plano: adega.plano,
      trialOpcao,
    });
    setPreviewUrl(adega.logo_url || null);
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
      logo_url: "",
      plano: "prata",
      trialOpcao: "nenhum",
    });
    setEditingAdega(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getTrialStatus = (adega: Adega) => {
    if (!adega.is_trial) return null;
    if (!adega.trial_expires_at) return null;
    
    const daysLeft = differenceInDays(new Date(adega.trial_expires_at), new Date());
    
    if (daysLeft < 0) {
      return <Badge variant="destructive">Trial Expirado</Badge>;
    }
    
    return (
      <Badge className="bg-blue-500">
        <Clock className="w-3 h-3 mr-1" />
        {daysLeft} dias restantes
      </Badge>
    );
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
              {/* Upload de Logo */}
              <div className="space-y-2">
                <Label>Logo da Adega</Label>
                <div className="flex items-center gap-4">
                  {previewUrl ? (
                    <div className="relative">
                      <img
                        src={previewUrl}
                        alt="Logo preview"
                        className="h-20 w-20 rounded-lg object-cover border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6"
                        onClick={handleRemoveLogo}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="h-20 w-20 rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground/50" />
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <>
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Enviar Logo
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">
                      PNG, JPG até 2MB. O logo será exibido para todos os usuários da adega.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="nome">Nome da Adega *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Ex: Adega do João"
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Crown className="h-4 w-4" />
                    Plano
                  </Label>
                  <Select
                    value={formData.plano}
                    onValueChange={(value) =>
                      setFormData({ ...formData, plano: value as "prata" | "ouro" | "diamante" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="prata">
                        <span className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-muted-foreground" />
                          Plano Prata
                        </span>
                      </SelectItem>
                      <SelectItem value="ouro">
                        <span className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-500" />
                          Plano Ouro
                        </span>
                      </SelectItem>
                      <SelectItem value="diamante">
                        <span className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-cyan-500" />
                          Plano Diamante
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Período de teste
                  </Label>
                  <Select
                    value={formData.trialOpcao}
                    onValueChange={(value) =>
                      setFormData({ ...formData, trialOpcao: value as "nenhum" | "7" | "14" | "30" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nenhum">Sem teste (assinatura normal)</SelectItem>
                      <SelectItem value="7">Teste de 7 dias</SelectItem>
                      <SelectItem value="14">Teste de 14 dias</SelectItem>
                      <SelectItem value="30">Teste de 30 dias</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    O plano escolhido acima define os recursos liberados durante o teste.
                  </p>
                </div>

                )}
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
                <Button type="submit" disabled={uploading}>
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
              <TableHead>Logo</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Trial</TableHead>
              <TableHead>Status Pagamento</TableHead>
              <TableHead>Status Conta</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adegas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8">
                  <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">Nenhuma adega cadastrada</p>
                </TableCell>
              </TableRow>
            ) : (
              adegas.map((adega) => (
                <TableRow key={adega.id}>
                  <TableCell>
                    {adega.logo_url ? (
                      <img
                        src={adega.logo_url}
                        alt={`Logo ${adega.nome}`}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">{adega.nome}</TableCell>
                  <TableCell>{adega.email || "-"}</TableCell>
                  <TableCell>
                    <Badge className={adega.plano === 'diamante' ? 'bg-cyan-500' : adega.plano === 'ouro' ? 'bg-yellow-500' : 'bg-gray-400'}>
                      <Crown className="w-3 h-3 mr-1" />
                      {adega.plano === 'diamante' ? 'Diamante' : adega.plano === 'ouro' ? 'Ouro' : 'Prata'}
                    </Badge>
                  </TableCell>
                  <TableCell>{getTrialStatus(adega) || "-"}</TableCell>
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
