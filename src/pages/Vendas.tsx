import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Search, ShoppingCart, Trash2, Plus, Minus, CreditCard, Banknote, Smartphone, Wallet, Barcode } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { ReciboPrint } from "@/components/ReciboPrint";

type Produto = {
  id: string;
  nome: string;
  preco_venda: number;
  quantidade_estoque: number;
  codigo_barras?: string | null;
};

type ItemCarrinho = {
  produto: Produto;
  quantidade: number;
};

type DadosRecibo = {
  nomeAdega: string;
  itens: { nome: string; quantidade: number; preco_unitario: number; subtotal: number }[];
  total: number;
  formaPagamento: string;
  valorRecebido?: number;
  troco?: number;
  vendedor: string;
  data: Date;
};

export default function Vendas() {
  const { adegaId, adegaNome } = useUserRole();
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [finalizando, setFinalizando] = useState(false);
  const [formaPagamento, setFormaPagamento] = useState<string>("dinheiro");
  const [valorRecebido, setValorRecebido] = useState<string>("");
  const [codigoBarras, setCodigoBarras] = useState("");
  const [dadosRecibo, setDadosRecibo] = useState<DadosRecibo | null>(null);
  const reciboEstabelecimentoRef = useRef<HTMLDivElement>(null);
  const reciboClienteRef = useRef<HTMLDivElement>(null);
  const codigoBarrasInputRef = useRef<HTMLInputElement>(null);

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
        .select("id, nome, preco_venda, quantidade_estoque, codigo_barras")
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

  const calcularTroco = () => {
    const total = calcularTotal();
    const recebido = parseFloat(valorRecebido) || 0;
    return recebido - total;
  };

  // Buscar produto por código de barras
  const buscarPorCodigoBarras = (codigo: string) => {
    if (!codigo.trim()) return;
    
    const produto = produtos.find((p) => p.codigo_barras === codigo.trim());
    
    if (produto) {
      adicionarAoCarrinho(produto);
      setCodigoBarras("");
    } else {
      toast.error("Produto não encontrado com este código de barras");
    }
    
    // Manter foco no input de código de barras
    codigoBarrasInputRef.current?.focus();
  };

  // Função para impressão do recibo
  const imprimirRecibos = (dados: DadosRecibo) => {
    const printWindow = window.open("", "_blank", "width=320,height=600");
    if (!printWindow) {
      toast.error("Não foi possível abrir janela de impressão. Verifique se pop-ups estão bloqueados.");
      return;
    }

    const formatarFormaPagamento = (forma: string) => {
      const formas: Record<string, string> = {
        dinheiro: "Dinheiro",
        debito: "Cartão Débito",
        credito: "Cartão Crédito",
        pix: "PIX",
      };
      return formas[forma] || forma;
    };

    const gerarReciboHTML = (via: string) => `
      <div style="width: 80mm; padding: 10px; font-family: monospace; font-size: 12px;">
        <div style="text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px;">
          <h1 style="margin: 0; font-size: 16px; text-transform: uppercase;">${dados.nomeAdega}</h1>
          <p style="margin: 4px 0; font-size: 10px;">CUPOM NÃO FISCAL</p>
          <p style="margin: 4px 0; font-size: 11px; font-weight: bold;">Via ${via}</p>
        </div>
        
        <div style="border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; font-size: 10px;">
          <p style="margin: 2px 0;">Data: ${dados.data.toLocaleDateString("pt-BR")} ${dados.data.toLocaleTimeString("pt-BR")}</p>
          <p style="margin: 2px 0;">Vendedor: ${dados.vendedor}</p>
        </div>
        
        <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
          <thead>
            <tr style="border-bottom: 1px solid #000;">
              <th style="text-align: left; padding: 4px 0;">Item</th>
              <th style="text-align: center;">Qtd</th>
              <th style="text-align: right;">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${dados.itens.map(item => `
              <tr>
                <td style="padding: 2px 0; text-align: left; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.nome}</td>
                <td style="text-align: center;">${item.quantidade}</td>
                <td style="text-align: right;">R$ ${item.subtotal.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div style="border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px;">
          <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px;">
            <span>TOTAL:</span>
            <span>R$ ${dados.total.toFixed(2)}</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 10px; margin-top: 4px;">
            <span>Pagamento:</span>
            <span>${formatarFormaPagamento(dados.formaPagamento)}</span>
          </div>
          ${dados.formaPagamento === "dinheiro" && dados.valorRecebido ? `
            <div style="display: flex; justify-content: space-between; font-size: 10px;">
              <span>Recebido:</span>
              <span>R$ ${dados.valorRecebido.toFixed(2)}</span>
            </div>
            ${dados.troco && dados.troco > 0 ? `
              <div style="display: flex; justify-content: space-between; font-size: 10px; font-weight: bold;">
                <span>Troco:</span>
                <span>R$ ${dados.troco.toFixed(2)}</span>
              </div>
            ` : ''}
          ` : ''}
        </div>
        
        <div style="text-align: center; font-size: 10px; margin-top: 16px;">
          <p style="margin: 0;">Obrigado pela preferência!</p>
          <p style="margin: 8px 0;">--------------------------------</p>
        </div>
      </div>
    `;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Recibo</title>
        <style>
          @media print {
            body { margin: 0; }
            .page-break { page-break-after: always; }
          }
        </style>
      </head>
      <body>
        ${gerarReciboHTML("Estabelecimento")}
        <div class="page-break"></div>
        ${gerarReciboHTML("Cliente")}
        <script>
          window.onload = function() {
            window.print();
            window.onafterprint = function() {
              window.close();
            };
          };
        </script>
      </body>
      </html>
    `);
    printWindow.document.close();
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

    if (formaPagamento === "dinheiro") {
      const recebido = parseFloat(valorRecebido) || 0;
      const total = calcularTotal();
      if (recebido < total) {
        toast.error("Valor recebido é menor que o total da venda");
        return;
      }
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
            forma_pagamento: formaPagamento,
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

      // Preparar dados do recibo e imprimir
      const dadosReciboAtual: DadosRecibo = {
        nomeAdega: adegaNome || "Adega",
        itens: carrinho.map((item) => ({
          nome: item.produto.nome,
          quantidade: item.quantidade,
          preco_unitario: item.produto.preco_venda,
          subtotal: item.produto.preco_venda * item.quantidade,
        })),
        total: calcularTotal(),
        formaPagamento,
        valorRecebido: formaPagamento === "dinheiro" ? parseFloat(valorRecebido) || 0 : undefined,
        troco: formaPagamento === "dinheiro" ? calcularTroco() : undefined,
        vendedor: user.email || "Operador",
        data: new Date(),
      };

      // Imprimir recibos
      imprimirRecibos(dadosReciboAtual);

      toast.success("Venda finalizada com sucesso!");
      setCarrinho([]);
      setFormaPagamento("dinheiro");
      setValorRecebido("");
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
    setFormaPagamento("dinheiro");
    setValorRecebido("");
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
          {/* Barra de busca e código de barras */}
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar produtos por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative flex-1">
              <Barcode className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={codigoBarrasInputRef}
                placeholder="Código de barras..."
                value={codigoBarras}
                onChange={(e) => setCodigoBarras(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    buscarPorCodigoBarras(codigoBarras);
                  }
                }}
                className="pl-10"
              />
            </div>
          </div>

          {/* Grid de produtos */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredProdutos.length === 0 ? (
              <p className="col-span-full text-center text-muted-foreground py-8">
                Nenhum produto encontrado
              </p>
            ) : (
              filteredProdutos.map((produto) => (
                <Card
                  key={produto.id}
                  className="shadow-card hover:shadow-md transition-smooth cursor-pointer hover:border-primary/50"
                  onClick={() => adicionarAoCarrinho(produto)}
                >
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-sm line-clamp-2">{produto.nome}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-primary">
                        R$ {produto.preco_venda.toFixed(2)}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {produto.quantidade_estoque}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
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
                <p className="text-muted-foreground text-center py-4">
                  Carrinho vazio
                </p>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
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
              )}

              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total:</span>
                  <span className="text-primary">
                    R$ {calcularTotal().toFixed(2)}
                  </span>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Forma de Pagamento</Label>
                  <RadioGroup value={formaPagamento} onValueChange={setFormaPagamento}>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="dinheiro" id="dinheiro" />
                      <Label htmlFor="dinheiro" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Banknote className="h-4 w-4" />
                        Dinheiro
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="debito" id="debito" />
                      <Label htmlFor="debito" className="flex items-center gap-2 cursor-pointer flex-1">
                        <CreditCard className="h-4 w-4" />
                        Débito
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="credito" id="credito" />
                      <Label htmlFor="credito" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Wallet className="h-4 w-4" />
                        Crédito
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-accent cursor-pointer">
                      <RadioGroupItem value="pix" id="pix" />
                      <Label htmlFor="pix" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-4 w-4" />
                        PIX
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {formaPagamento === "dinheiro" && (
                  <div className="space-y-3 p-3 bg-muted rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="valorRecebido" className="text-sm">Valor Recebido</Label>
                      <Input
                        id="valorRecebido"
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={valorRecebido}
                        onChange={(e) => setValorRecebido(e.target.value)}
                        className="text-lg"
                      />
                    </div>
                    {valorRecebido && parseFloat(valorRecebido) >= calcularTotal() && (
                      <div className="flex justify-between items-center p-2 bg-background rounded border border-primary/20">
                        <span className="text-sm font-medium">Troco:</span>
                        <span className="text-lg font-bold text-primary">
                          R$ {calcularTroco().toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <Button
                  className="w-full"
                  size="lg"
                  onClick={finalizarVenda}
                  disabled={finalizando || carrinho.length === 0}
                >
                  {finalizando ? "Finalizando..." : "Finalizar Venda"}
                </Button>

                {carrinho.length > 0 && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCarrinho([])}
                  >
                    Limpar Carrinho
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
