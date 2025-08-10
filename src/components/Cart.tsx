import { useState, useEffect } from 'react';
import { Minus, Plus, ShoppingCart, X, MapPin, Store, CreditCard, Printer, Smartphone, User } from 'lucide-react';
import { CartItem } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';

interface DeliveryArea {
  id: string;
  name: string;
  fee: number;
  active: boolean;
}

interface CartProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
  onCheckout: (orderData: any) => void;
  isOpen: boolean;
  onClose: () => void;
  isEstablishment: boolean;
}

// Definição dos modos disponíveis
const modos = [
  { 
    id: 'cliente', 
    label: 'Pedido Online', 
    icon: Smartphone,
    description: 'Cliente fazendo pedido'
  },
  { 
    id: 'estabelecimento', 
    label: 'Pedido no Balcão', 
    icon: Store,
    description: 'Atendimento presencial'
  }
];

export const Cart = ({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  isOpen,
  onClose,
  isEstablishment,
}: CartProps) => {
  const [modoAtual, setModoAtual] = useState<'cliente' | 'estabelecimento'>('cliente');
  const [tipoEntrega, setTipoEntrega] = useState<'delivery' | 'pickup'>('delivery');
  const [formaPagamento, setFormaPagamento] = useState('');
  const [bairroSelecionado, setBairroSelecionado] = useState('');
  const [endereco, setEndereco] = useState({
    rua: '',
    numero: '',
    pontoReferencia: ''
  });
  const [dadosCliente, setDadosCliente] = useState({
    nome: '',
    telefone: '',
    mesa: '',
    observacoes: ''
  });
  const [precisaTroco, setPrecisaTroco] = useState<boolean>(false);
  const [valorTroco, setValorTroco] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [selectedDeliveryArea, setSelectedDeliveryArea] = useState<DeliveryArea | null>(null);

  // Atualizar modo quando isEstablishment mudar
  useEffect(() => {
    setModoAtual(isEstablishment ? 'estabelecimento' : 'cliente');
  }, [isEstablishment]);

  // Resetar campos quando modo mudar
  useEffect(() => {
    if (modoAtual === 'estabelecimento') {
      setTipoEntrega('pickup');
      setEndereco({ rua: '', numero: '', pontoReferencia: '' });
      setBairroSelecionado('');
      setSelectedDeliveryArea(null);
    }
  }, [modoAtual]);

  useEffect(() => {
    if (!isOpen) return;
    const fetchDeliveryAreas = async () => {
      const { data, error } = await supabase
        .from('delivery_areas')
        .select('id, name, fee, active')
        .eq('active', true)
        .order('name');
      if (!error && data) {
        setDeliveryAreas(data);
      }
    };
    fetchDeliveryAreas();
  }, [isOpen]);

  // Atualizar selectedDeliveryArea ao selecionar bairro
  useEffect(() => {
    if (!bairroSelecionado) {
      setSelectedDeliveryArea(null);
      return;
    }
    const area = deliveryAreas.find(a => a.name === bairroSelecionado);
    setSelectedDeliveryArea(area || null);
  }, [bairroSelecionado, deliveryAreas]);

  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const createPrintPage = (orderData: any) => {
    const formaPagamentoLabel = formasPagamento.find(fp => fp.value === orderData.formaPagamento)?.label;
    
    // Criar HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda - Marrom Lanches</title>
        <style>
          body {
            font-family: 'Courier New', monospace;
            margin: 0;
            padding: 20px;
            background: white;
            color: black;
            line-height: 1.4;
          }
          .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #000;
            padding-bottom: 10px;
          }
          .header h1 {
            margin: 0;
            font-size: 18px;
            font-weight: bold;
          }
          .header p {
            margin: 2px 0;
            font-size: 12px;
          }
          .section {
            margin: 15px 0;
          }
          .section-title {
            font-weight: bold;
            font-size: 14px;
            margin-bottom: 5px;
            text-decoration: underline;
          }
          .item {
            margin: 8px 0;
            font-size: 12px;
          }
          .item-name {
            font-weight: bold;
          }
          .item-details {
            margin-left: 10px;
            font-size: 11px;
          }
          .total-section {
            border-top: 2px solid #000;
            padding-top: 10px;
            margin-top: 20px;
          }
          .total-line {
            display: flex;
            justify-content: space-between;
            margin: 3px 0;
          }
          .total-final {
            font-weight: bold;
            font-size: 14px;
            border-top: 1px solid #000;
            padding-top: 5px;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 11px;
            border-top: 1px solid #000;
            padding-top: 10px;
          }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MARROM LANCHES</h1>
          <p>O melhor da cidade, direto na sua casa!</p>
          <p>Tel: (79) 99813-0038</p>
          <p>Data/Hora: ${new Date().toLocaleString('pt-BR')}</p>
        </div>

        <div class="section">
          <div class="section-title">ITENS DO PEDIDO:</div>
          ${orderData.items.map((item: any, index: number) => {
            const extrasPerUnit = (item.selectedExtras ?? []).reduce((sum: number, ex: any) => sum + (Number(ex.price) * Number(ex.quantity)), 0);
            const unitWithExtras = Number(item.price) + extrasPerUnit;
            const itemTotal = unitWithExtras * Number(item.quantity);
            const extrasText = (item.selectedExtras ?? []).length > 0
              ? `<br>Adicionais: ${(item.selectedExtras ?? []).map((ex: any) => `${ex.quantity}x ${ex.name}`).join(', ')}`
              : '';
            return `
            <div class="item">
              <div class="item-name">${index + 1}. ${item.name}</div>
              <div class="item-details">
                Qtd: ${item.quantity}x | Unit: ${formatPrice(unitWithExtras)} | Total: ${formatPrice(itemTotal)}
                ${extrasText}
                ${item.observations ? `<br>Obs: ${item.observations}` : ''}
              </div>
            </div>`;
          }).join('')}
        </div>

        <div class="section">
          <div class="section-title">TIPO DE ENTREGA:</div>
          <div>${orderData.tipoEntrega === 'delivery' ? 'ENTREGA' : 'RETIRADA NO BALCÃO'}</div>
        </div>

        ${orderData.tipoEntrega === 'delivery' && orderData.endereco ? `
          <div class="section">
            <div class="section-title">ENDEREÇO:</div>
            <div>Bairro: ${orderData.endereco.bairro}</div>
            <div>Rua: ${orderData.endereco.rua}</div>
            <div>Número: ${orderData.endereco.numero}</div>
            ${orderData.endereco.pontoReferencia ? `<div>Referência: ${orderData.endereco.pontoReferencia}</div>` : ''}
          </div>
        ` : ''}

        ${modoAtual === 'estabelecimento' ? `
          <div class="section">
            <div class="section-title">CLIENTE:</div>
            <div>Nome: ${orderData.dadosCliente.nome}</div>
          </div>
        ` : ''}

        <div class="section">
          <div class="section-title">PAGAMENTO:</div>
          <div>${formaPagamentoLabel}</div>
          ${orderData.formaPagamento === 'dinheiro' ? `
            <div style="font-size: 11px; margin-top: 3px;">
              ${orderData.precisaTroco && orderData.valorTroco 
                ? `Troco para: ${orderData.valorTroco}`
                : 'Não precisa de troco'
              }
            </div>
          ` : ''}
        </div>

        <div class="total-section">
          <div class="total-line">
            <span>Subtotal:</span>
            <span>${formatPrice(orderData.subtotal)}</span>
          </div>
          ${orderData.tipoEntrega === 'delivery' ? `
            <div class="total-line">
              <span>Taxa de Entrega:</span>
              <span>${formatPrice(orderData.taxa)}</span>
            </div>
          ` : ''}
          <div class="total-line total-final">
            <span>TOTAL:</span>
            <span>${formatPrice(orderData.total)}</span>
          </div>
        </div>

        <div class="section" style="text-align: center; margin-top: 15px;">
          <div style="font-size: 11px;">
            Tempo estimado: ${orderData.tipoEntrega === 'delivery' ? '45-60 min' : '20-30 min'}
          </div>
        </div>

        <div class="footer">
          Obrigado pela preferência!
        </div>
      </body>
      </html>
    `;

    // Criar nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      try {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
      } catch {}
      // Aguardar render e forçar impressão
      const tryPrint = () => {
        try {
          printWindow.focus();
          printWindow.print();
          printWindow.close();
        } catch {
          setTimeout(tryPrint, 300);
        }
      };
      setTimeout(tryPrint, 300);
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((total, item) => {
      const extrasPerUnit = (item.selectedExtras ?? []).reduce((sum, ex) => sum + (Number(ex.price) * Number(ex.quantity)), 0);
      return total + ((item.price + extrasPerUnit) * item.quantity);
    }, 0);
    const taxa = tipoEntrega === 'delivery' && selectedDeliveryArea ? Number(selectedDeliveryArea.fee) : 0;
    return { subtotal, taxa, total: subtotal + taxa };
  };

  const handleFinalizarPedido = async () => {
    if (modoAtual !== 'estabelecimento') {
      if (!formaPagamento) {
        alert('Por favor, selecione a forma de pagamento');
        return;
      }
    }

    // Validações específicas por modo
    if (modoAtual === 'estabelecimento') {
      if (!dadosCliente.nome.trim()) {
        alert('Por favor, informe o nome do cliente');
        return;
      }
      if (!dadosCliente.mesa.trim()) {
        alert('Por favor, informe o número da mesa');
        return;
      }
    } else {
      if (!dadosCliente.nome.trim()) {
        alert('Por favor, informe o nome do cliente');
        return;
      }
      if (tipoEntrega === 'delivery') {
        if (!bairroSelecionado || !endereco.rua || !endereco.numero) {
          alert('Por favor, preencha todos os dados de entrega');
          return;
        }
      }
    }

    setIsProcessing(true);
    try {
      // Montar dados do pedido
      const isEntrega = tipoEntrega === 'delivery';
      const deliveryArea = isEntrega ? selectedDeliveryArea : null;
      const deliveryAreaId = deliveryArea ? deliveryArea.id : null;
      const deliveryFee = isEntrega && deliveryArea ? Number(deliveryArea.fee) : 0;
      const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const total = subtotal + deliveryFee;

      // Inserir pedido na tabela orders
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          customer_name: (dadosCliente.nome || 'Cliente'),
          customer_phone: modoAtual === 'estabelecimento' ? (dadosCliente.telefone || '') : '',
          customer_address: isEntrega ? `${endereco.rua}, ${endereco.numero}` : null,
          delivery_type: tipoEntrega,
          payment_method: modoAtual === 'estabelecimento' ? 'balcao' : formaPagamento,
          delivery_area_id: deliveryAreaId,
          subtotal: subtotal,
          delivery_fee: deliveryFee,
          total: total,
          status: 'pending',
          notes: modoAtual === 'estabelecimento' ? `Mesa: ${dadosCliente.mesa}${dadosCliente.observacoes ? ' - ' + dadosCliente.observacoes : ''}` : (isEntrega ? endereco.pontoReferencia : dadosCliente.observacoes || null)
        })
        .select()
        .single();
      if (orderError) throw orderError;

      // Inserir itens do pedido
      for (const item of cartItems) {
        const { data: itemData, error: itemError } = await supabase
          .from('order_items')
          .insert({
            order_id: orderData.id,
            product_id: item.id,
            quantity: item.quantity,
            unit_price: item.price,
            total_price: item.price * item.quantity,
            observations: item.observations || null
          })
          .select()
          .single();
        if (itemError) throw itemError;

        // Inserir adicionais (extras) se houver
        if (item.selectedExtras && item.selectedExtras.length > 0) {
          for (const extra of item.selectedExtras) {
            const totalQty = Number(extra.quantity) * item.quantity;
            await supabase.from('order_item_extras').insert({
              order_item_id: itemData.id,
              extra_id: extra.id,
              quantity: totalQty,
              unit_price: Number(extra.price),
              total_price: Number(extra.price) * totalQty
            });
          }
        }
      }

      // Sucesso!
      setIsProcessing(false);
      
      if (modoAtual === 'estabelecimento') {
        // Modo estabelecimento: imprimir comanda
        const orderDataForPrint = {
          items: cartItems,
          tipoEntrega,
          formaPagamento: 'balcao',
          endereco: null,
          total,
          subtotal,
          taxa: deliveryFee,
          precisaTroco,
          valorTroco,
          dadosCliente
        };
        
        createPrintPage(orderDataForPrint);
        onCheckout(orderDataForPrint);
        alert('Comanda gerada com sucesso!');
      } else {
        // Modo cliente: enviar WhatsApp
        const orderDataForWhatsApp = {
          items: cartItems,
          tipoEntrega,
          formaPagamento,
          endereco: isEntrega ? { bairro: bairroSelecionado, ...endereco } : null,
          total,
          subtotal,
          taxa: deliveryFee,
          precisaTroco,
          valorTroco
        };
        
        onCheckout(orderDataForWhatsApp);
        
        // Redirecionar para WhatsApp após salvar no banco
        const phoneNumber = '79998130038'; // Número do WhatsApp da empresa
        const message = `Olá! Gostaria de fazer um pedido:\n\n${cartItems.map(item => `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}`).join('\n')}\n\nTotal: R$ ${total.toFixed(2).replace('.', ',')}\nForma de pagamento: ${formasPagamento.find(fp => fp.value === formaPagamento)?.label}\nTipo: ${tipoEntrega === 'delivery' ? 'Entrega' : 'Balcão'}`;
        
        const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
        alert('Pedido realizado com sucesso!');
      }
    } catch (error) {
      setIsProcessing(false);
      alert('Erro ao salvar pedido. Tente novamente.');
      console.error('Erro ao salvar pedido:', error);
    }
  };

  const formasPagamento = [
    { value: 'dinheiro', label: 'Dinheiro' },
    { value: 'pix', label: 'PIX' },
    { value: 'credito', label: 'Cartão de Crédito' },
    { value: 'debito', label: 'Cartão de Débito' }
  ];

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-brand-brown">
            <ShoppingCart className="w-5 h-5" />
            Carrinho ({cartItems.length})
          </SheetTitle>
        </SheetHeader>

        <div className="py-6 space-y-6">
          {/* Seletor de Modo removido - já existe no Header */}

          {/* Lista de Itens */}
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div key={item.cartLineId || item.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-brand-brown">{item.name}</h4>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onRemoveItem(item.cartLineId || item.id)}
                    className="w-6 h-6 text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => onUpdateQuantity(item.cartLineId || item.id, item.quantity - 1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="font-semibold w-6 text-center">{item.quantity}</span>
                    <Button
                      variant="outline"
                      size="icon"
                      className="w-8 h-8"
                      onClick={() => onUpdateQuantity(item.cartLineId || item.id, item.quantity + 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                  </div>
                  <span className="font-semibold text-brand-brown">
                    {formatPrice(((item.price + (item.selectedExtras ?? []).reduce((sum, ex) => sum + (Number(ex.price) * Number(ex.quantity)), 0)) * item.quantity))}
                  </span>
                </div>
                
                {(item.selectedExtras && item.selectedExtras.length > 0) && (
                  <div className="text-xs text-muted-foreground mt-2">
                    Adicionais: {item.selectedExtras.map(ex => `${ex.quantity}x ${ex.name}`).join(', ')}
                  </div>
                )}
                {item.observations && (
                  <p className="text-xs text-muted-foreground mt-1">Obs: {item.observations}</p>
                )}
              </div>
            ))}
          </div>

          {cartItems.length > 0 && (
            <div className="space-y-6">
              <Separator />
              
              {/* Campos específicos por modo */}
              {modoAtual === 'estabelecimento' ? (
                // Modo Estabelecimento
                <div className="space-y-4">
                  <div>
                    <Label className="block font-medium mb-2">
                      Nome do Cliente *
                    </Label>
                    <Input
                      type="text"
                      value={dadosCliente.nome}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, nome: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Digite o nome completo do cliente"
                      required
                    />
                  </div>
                  <div>
                    <Label className="block font-medium mb-2">
                      Número da Mesa *
                    </Label>
                    <Input
                      type="text"
                      value={dadosCliente.mesa}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, mesa: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="Ex: 12"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label className="block font-medium mb-2">
                      Telefone (opcional)
                    </Label>
                    <Input
                      type="text"
                      value={dadosCliente.telefone}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, telefone: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                      placeholder="(79) 99999-9999"
                    />
                  </div>
                  
                  <div>
                    <Label className="block font-medium mb-2">
                      Observações
                    </Label>
                    <Textarea
                      value={dadosCliente.observacoes}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, observacoes: e.target.value }))}
                      className="w-full border rounded-lg px-3 py-2"
                      rows={3}
                      placeholder="Observações especiais do pedido..."
                    />
                  </div>
                </div>
              ) : (
                // Modo Cliente
                <>
                  <div className="space-y-2">
                    <Label>Nome do Cliente *</Label>
                    <Input
                      value={dadosCliente.nome}
                      onChange={(e) => setDadosCliente(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Digite seu nome"
                      required
                    />
                  </div>
                  {/* Tipo de Entrega */}
                  <div className="space-y-3">
                    <h3 className="font-semibold text-brand-brown flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Tipo de Entrega
                    </h3>
                    <RadioGroup value={tipoEntrega} onValueChange={(value) => setTipoEntrega(value as 'delivery' | 'pickup')}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="delivery" id="delivery" />
                        <Label htmlFor="delivery" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Entrega
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pickup" id="pickup" />
                        <Label htmlFor="pickup" className="flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          Retirar no Balcão
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Dados de Entrega */}
                  {tipoEntrega === 'delivery' && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-brand-brown">Dados de Entrega</h4>
                      
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        <Select value={bairroSelecionado} onValueChange={setBairroSelecionado}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o bairro" />
                          </SelectTrigger>
                          <SelectContent>
                            {deliveryAreas.map((area) => (
                              <SelectItem key={area.id} value={area.name}>
                                {area.name} {area.fee > 0 ? `- R$ ${area.fee.toFixed(2).replace('.', ',')}` : '- Grátis'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2 space-y-2">
                          <Label>Rua</Label>
                          <Input
                            value={endereco.rua}
                            onChange={(e) => setEndereco(prev => ({ ...prev, rua: e.target.value }))}
                            placeholder="Nome da rua"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Número</Label>
                          <Input
                            value={endereco.numero}
                            onChange={(e) => setEndereco(prev => ({ ...prev, numero: e.target.value }))}
                            placeholder="Nº"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Ponto de Referência (opcional)</Label>
                        <Textarea
                          value={endereco.pontoReferencia}
                          onChange={(e) => setEndereco(prev => ({ ...prev, pontoReferencia: e.target.value }))}
                          placeholder="Ex: próximo ao posto, em frente à escola..."
                          rows={2}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Forma de Pagamento */}
              {modoAtual !== 'estabelecimento' && (
              <div className="space-y-3">
                <h3 className="font-semibold text-brand-brown flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  Forma de Pagamento
                </h3>
                <RadioGroup value={formaPagamento} onValueChange={(value) => {
                  setFormaPagamento(value);
                  if (value !== 'dinheiro') {
                    setPrecisaTroco(false);
                    setValorTroco('');
                  }
                }}>
                  {formasPagamento.map((forma) => (
                    <div key={forma.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={forma.value} id={forma.value} />
                      <Label htmlFor={forma.value}>{forma.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              )}

              {/* Dados do Troco - Só aparece se pagamento for dinheiro */}
              {modoAtual !== 'estabelecimento' && formaPagamento === 'dinheiro' && (
                <div className="space-y-3">
                  <h4 className="font-medium text-brand-brown">Troco</h4>
                  
                  <div className="space-y-3">
                    <Label>Precisa de troco?</Label>
                    <RadioGroup value={precisaTroco ? 'sim' : 'nao'} onValueChange={(value) => {
                      setPrecisaTroco(value === 'sim');
                      if (value === 'nao') {
                        setValorTroco('');
                      }
                    }}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="nao" id="nao-troco" />
                        <Label htmlFor="nao-troco">Não</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="sim" id="sim-troco" />
                        <Label htmlFor="sim-troco">Sim</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {precisaTroco && (
                    <div className="space-y-2">
                      <Label>Para quanto?</Label>
                      <Input
                        value={valorTroco}
                        onChange={(e) => setValorTroco(e.target.value)}
                        placeholder="Ex: R$ 50,00"
                        type="text"
                      />
                    </div>
                  )}
                </div>
              )}

              <Separator />
              
              {/* Resumo do Pedido */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>{formatPrice(calculateTotal().subtotal)}</span>
                </div>
                {tipoEntrega === 'delivery' && selectedDeliveryArea && (
                  <div className="flex justify-between text-sm">
                    <span>Taxa de entrega:</span>
                    <span>{selectedDeliveryArea.fee > 0 ? formatPrice(selectedDeliveryArea.fee) : 'Grátis'}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg text-brand-brown">
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotal().total)}</span>
                </div>
              </div>

              <Button
                variant="gold"
                className="w-full"
                onClick={handleFinalizarPedido}
                disabled={isProcessing || cartItems.length === 0}
              >
                {modoAtual === 'estabelecimento' ? (
                  <>
                    <Printer className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Processando...' : `Gerar Comanda - ${formatPrice(calculateTotal().total)}`}
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4 mr-2" />
                    {isProcessing ? 'Processando...' : `Enviar Pedido - ${formatPrice(calculateTotal().total)}`}
                  </>
                )}
              </Button>
            </div>
          )}

          {cartItems.length === 0 && (
            <div className="text-center py-8">
              <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Seu carrinho está vazio</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};