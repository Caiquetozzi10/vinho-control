import { forwardRef } from "react";

type ItemVenda = {
  nome: string;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
};

interface ReciboPrintProps {
  nomeAdega: string;
  itens: ItemVenda[];
  total: number;
  formaPagamento: string;
  valorRecebido?: number;
  troco?: number;
  vendedor: string;
  data: Date;
  via: "estabelecimento" | "cliente";
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

export const ReciboPrint = forwardRef<HTMLDivElement, ReciboPrintProps>(
  ({ nomeAdega, itens, total, formaPagamento, valorRecebido, troco, vendedor, data, via }, ref) => {
    return (
      <div ref={ref} className="p-4 bg-white text-black font-mono text-sm" style={{ width: "80mm" }}>
        {/* Cabeçalho */}
        <div className="text-center border-b border-dashed border-black pb-2 mb-2">
          <h1 className="text-lg font-bold uppercase">{nomeAdega}</h1>
          <p className="text-xs">CUPOM NÃO FISCAL</p>
          <p className="text-xs uppercase font-semibold mt-1">
            Via {via === "estabelecimento" ? "Estabelecimento" : "Cliente"}
          </p>
        </div>

        {/* Data e Vendedor */}
        <div className="border-b border-dashed border-black pb-2 mb-2 text-xs">
          <p>Data: {data.toLocaleDateString("pt-BR")} {data.toLocaleTimeString("pt-BR")}</p>
          <p>Vendedor: {vendedor}</p>
        </div>

        {/* Itens */}
        <div className="border-b border-dashed border-black pb-2 mb-2">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left py-1">Item</th>
                <th className="text-center">Qtd</th>
                <th className="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              {itens.map((item, index) => (
                <tr key={index}>
                  <td className="py-1 text-left max-w-[100px] truncate">{item.nome}</td>
                  <td className="text-center">{item.quantidade}</td>
                  <td className="text-right">R$ {item.subtotal.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Total */}
        <div className="border-b border-dashed border-black pb-2 mb-2">
          <div className="flex justify-between font-bold text-base">
            <span>TOTAL:</span>
            <span>R$ {total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>Forma de Pagamento:</span>
            <span>{formatarFormaPagamento(formaPagamento)}</span>
          </div>
          {formaPagamento === "dinheiro" && valorRecebido !== undefined && (
            <>
              <div className="flex justify-between text-xs">
                <span>Valor Recebido:</span>
                <span>R$ {valorRecebido.toFixed(2)}</span>
              </div>
              {troco !== undefined && troco > 0 && (
                <div className="flex justify-between text-xs font-semibold">
                  <span>Troco:</span>
                  <span>R$ {troco.toFixed(2)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        <div className="text-center text-xs pt-2">
          <p>Obrigado pela preferência!</p>
          <p className="mt-2">--------------------------------</p>
        </div>
      </div>
    );
  }
);

ReciboPrint.displayName = "ReciboPrint";
