import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, ShoppingCart, Trash2, Plus, Minus } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";

type Produto = {
  id: string;
  nome: string;
  preco_venda: number;
  quantidade_estoque: number;
};

type ItemCarrinho = {
  produto: Produto;
  quantidade: number;
};

export default function Vendas() {
  const { adegaId } = useUserRole();
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);

  useEffect(() => {
    fetchProdutos();
  }, [adegaId]);

  const fetchProdutos = async () => {
    if (!adegaId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, preco_venda, quantidade_estoque")
        .eq("adega_id", adegaId)
        .eq("ativo", true)
        .gt("quantidade_estoque", 0)
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

  const adicionarAoCarrinho = (produto: Produto) => {
    const itemExistente = carrinho.find((item) => item.produto.id === produto.id);

    if (itemExistente) {
      if (itemExistente.quantidade >= produto.quantidade_estoque) {
        toast.error("Quantidade máxima em estoque atingida");
        return;
      }
      setCarrinho(
        carrinho.map((item) =>
          item.produto.id === produto.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        )
      );
    } else {
      setCarrinho([...carrinho, { produto, quantidade: 1 }]);
    }
    toast.success(`${produto.nome} adicionado ao carrinho`);
  };

  const aumentarQuantidade = (produtoId: string) => {
    const item = carrinho.find((i) => i.produto.id === produtoId);
    if (item && item.quantidade >= item.produto.quantidade_estoque) {
      toast.error("Quantidade máxima em estoque atingida");
      return;
    }

    setCarrinho(
      carrinho.map((item) =>
        item.produto.id === produtoId
          ? { ...item, quantidade: item.quantidade + 1 }
          : item
      )
    );
  };

  const diminuirQuantidade = (produtoId: string) => {
    setCarrinho(
      carrinho
        .map((item) =>
          item.produto.id === produtoId
            ? { ...item, quantidade: item.quantidade - 1 }
            : item
        )
        .filter((item) => item.quantidade > 0)
    );
  };

  const removerDoCarrinho = (produtoId: string) => {
    setCarrinho(carrinho.filter((item) => item.produto.id !== produtoId));
  };

  const calcularTotal = () => {
    return carrinho.reduce(
      (total, item) => total + item.produto.preco_venda * item.quantidade,
      0
    );
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0) {
      toast.error("Adicione produtos ao carrinho");
      return;
    }

    if (!adegaId || !user) {
      toast.error("Erro ao identificar usuário ou adega");
      return;
    }

    setFinalizando(true);

    try {
      // Criar venda
      const { data: venda, error: vendaError } = await supabase
        .from("vendas")
        .insert([
          {
            adega_id: adegaId,
            usuario_id: user.id,
            valor_total: calcularTotal(),
          },
        ])
        .select()
        .single();

      if (vendaError) throw vendaError;

      // Criar itens da venda
      const itensVenda = carrinho.map((item) => ({
        venda_id: venda.id,
        produto_id: item.produto.id,
        nome_produto: item.produto.nome,
        quantidade: item.quantidade,
        preco_unitario: item.produto.preco_venda,
        subtotal: item.produto.preco_venda * item.quantidade,
      }));

      const { error: itensError } = await supabase
        .from("itens_venda")
        .insert(itensVenda);

      if (itensError) throw itensError;

      toast.success("Venda finalizada com sucesso!");
      setCarrinho([]);
      fetchProdutos();
    } catch (error) {
      console.error("Erro ao finalizar venda:", error);
      toast.error("Erro ao finalizar venda");
    } finally {
      setFinalizando(false);
    }
  };

  const filteredProdutos = produtos.filter((produto) =>
    produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const novaVenda = () => {
    setCarrinho([]);
    setSearchTerm("");
    toast.success("Novo carrinho iniciado");
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ponto de Venda</h1>
          <p className="text-muted-foreground">Sistema rápido para registrar vendas</p>
        </div>
        <Button onClick={novaVenda} size="lg" className="gap-2">
          <Plus className="h-5 w-5" />
          Nova Venda
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Produtos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProdutos.map((produto) => (
              <Card
                key={produto.id}
                className="shadow-card hover:shadow-md transition-smooth cursor-pointer"
                onClick={() => adicionarAoCarrinho(produto)}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{produto.nome}</CardTitle>
                    <Badge variant="secondary">
                      {produto.quantidade_estoque} un.
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-primary">
                    R$ {produto.preco_venda.toFixed(2)}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Carrinho */}
        <div className="lg:col-span-1">
          <Card className="shadow-card sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Carrinho
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {carrinho.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Carrinho vazio
                </p>
              ) : (
                <>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {carrinho.map((item) => (
                      <div
                        key={item.produto.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.produto.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            R$ {item.produto.preco_venda.toFixed(2)} × {item.quantidade}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => diminuirQuantidade(item.produto.id)}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium">
                            {item.quantidade}
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => aumentarQuantidade(item.produto.id)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removerDoCarrinho(item.produto.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-4 space-y-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total:</span>
                      <span className="text-primary">
                        R$ {calcularTotal().toFixed(2)}
                      </span>
                    </div>

                    <Button
                      className="w-full"
                      size="lg"
                      onClick={finalizarVenda}
                      disabled={finalizando}
                    >
                      {finalizando ? "Finalizando..." : "Finalizar Venda"}
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => setCarrinho([])}
                    >
                      Limpar Carrinho
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
