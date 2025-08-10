import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  Store,
  Smartphone,
  MapPin,
  User,
  Phone,
  CreditCard,
  X,
  ArrowRight,
  Printer,
  Trash
} from 'lucide-react';

interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_address: string | null;
  delivery_type: 'delivery' | 'pickup';
  payment_method: string;
  delivery_area_id: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes: string | null;
  order_type: 'cliente' | 'estabelecimento';
  created_at: string;
  updated_at: string;
  delivery_area?: {
    name: string;
    fee: number;
  };
  items?: OrderItem[];
}

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  observations: string | null;
  product?: {
    name: string;
  };
  extras?: OrderItemExtra[];
}

interface OrderItemExtra {
  id: string;
  extra_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  extra?: {
    name: string;
  };
}

interface PopupDetalhesPedidoProps {
  order: Order;
  isOpen: boolean;
  onClose: () => void;
  onStatusChange: (orderId: string, newStatus: string) => void;
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
}

const statusConfig = {
  pending: { 
    label: 'Pendente', 
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    nextStatus: 'preparing',
    nextLabel: 'Iniciar Preparo',
    prevStatus: null as unknown as string | null,
  },
  accepted: { 
    // compat legado
    label: 'Aceito', 
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    nextStatus: 'ready',
    nextLabel: 'Marcar Pronto',
    prevStatus: 'pending'
  },
  out_for_delivery: { 
    // compat legado
    label: 'Saiu para entrega', 
    color: 'bg-green-100 text-green-800',
    icon: Truck,
    nextStatus: 'delivered',
    nextLabel: 'Marcar Entregue',
    prevStatus: 'ready'
  },
  preparing: { 
    label: 'Preparando', 
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    nextStatus: 'ready',
    nextLabel: 'Marcar Pronto',
    prevStatus: 'pending'
  },
  ready: { 
    label: 'Pronto', 
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    nextStatus: 'delivered',
    nextLabel: 'Marcar Entregue',
    prevStatus: 'preparing'
  },
  delivered: { 
    label: 'Entregue', 
    color: 'bg-gray-100 text-gray-800',
    icon: Truck,
    nextStatus: null,
    nextLabel: null,
    prevStatus: 'ready'
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'bg-red-100 text-red-800',
    icon: CheckCircle,
    nextStatus: null,
    nextLabel: null,
    prevStatus: null as unknown as string | null,
  }
} as const;

const orderTypeConfig = {
  cliente: { 
    label: 'Pedido Online', 
    color: 'bg-blue-100 text-blue-800',
    icon: Smartphone,
    description: 'Cliente fez pedido pelo site/app'
  },
  estabelecimento: { 
    label: 'Pedido no Balcão', 
    color: 'bg-purple-100 text-purple-800',
    icon: Store,
    description: 'Atendimento presencial'
  }
};

const paymentMethodLabels = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito'
};

export const PopupDetalhesPedido: React.FC<PopupDetalhesPedidoProps> = ({
  order,
  isOpen,
  onClose,
  onStatusChange,
  formatPrice,
  formatDate
}) => {
  const currentStatus = statusConfig[order.status as keyof typeof statusConfig];
  const safeCurrentStatus = currentStatus ?? {
    label: order.status || 'Status',
    color: 'bg-gray-100 text-gray-800',
    icon: CheckCircle,
    nextStatus: null as unknown as string | null,
    nextLabel: null as unknown as string | null,
    prevStatus: null as unknown as string | null,
  };
  const orderType = orderTypeConfig[(order.order_type || 'cliente') as keyof typeof orderTypeConfig] || orderTypeConfig.cliente;
  const paymentLabel = paymentMethodLabels[order.payment_method as keyof typeof paymentMethodLabels] || order.payment_method;

  const handleNextStatus = () => {
    if (safeCurrentStatus.nextStatus) {
      onStatusChange(order.id, safeCurrentStatus.nextStatus);
      onClose();
    }
  };

  const handlePrintComanda = async () => {
    // Buscar configurações da empresa para imprimir cabeçalho dinâmico
    const { data: companySettings } = await supabase
      .from('company_settings')
      .select('*')
      .limit(1)
      .single();

    const companyName = companySettings?.company_name || 'Marrom Lanches';
    const address = companySettings?.address || '';
    const phone = companySettings?.phone || '';
    const whatsapp = companySettings?.whatsapp || '';
    const businessHours = companySettings?.business_hours || '';

    const isDelivery = order.delivery_type === 'delivery';

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Comanda - ${order.customer_name}</title>
        <style>
          @page { size: 80mm auto; margin: 5mm; }
          body { font-family: 'Courier New', monospace; margin: 0; padding: 0; width: 72mm; }
          .wrap { padding: 6px 8px; }
          .center { text-align: center; }
          .header { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 6px; }
          .section { margin: 8px 0; }
          .title { font-weight: bold; margin-bottom: 4px; }
          .item { margin: 4px 0; }
          .total { border-top: 1px dashed #000; padding-top: 6px; margin-top: 6px; }
          .small { font-size: 12px; }
          .line { border-top: 1px dashed #000; margin: 6px 0; }
          .row { display: flex; justify-content: space-between; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body class="wrap">
        <div class="header center">
          <div style="font-size:16px; font-weight:bold;">${companyName.toUpperCase()}</div>
          ${address ? `<div class="small">${address}</div>` : ''}
          ${phone ? `<div class="small">Tel: ${phone}</div>` : ''}
          ${whatsapp ? `<div class="small">WhatsApp: ${whatsapp}</div>` : ''}
          ${businessHours ? `<div class="small">${businessHours}</div>` : ''}
          <div class="small" style="margin-top:4px">PEDIDO ${order.id.slice(-6)} • ${formatDate(order.created_at)}</div>
        </div>

        <div class="section">
          <div class="title">CLIENTE</div>
          <div>${order.customer_name}</div>
          <div class="small">${orderType.label.toUpperCase()} • ${safeCurrentStatus.label.toUpperCase()}</div>
        </div>

        ${isDelivery && order.customer_address ? `
        <div class="section">
          <div class="title">ENTREGA</div>
          <div>${order.customer_address}</div>
          ${order.delivery_area?.name ? `<div class="small">Bairro: ${order.delivery_area.name}</div>` : ''}
        </div>` : ''}

        <div class="section">
          <div class="title">ITENS</div>
          ${order.items?.map(item => `
            <div class="item">
              <div class="row"><div>${item.quantity}x ${item.product?.name || 'Produto'}</div><div>${formatPrice(item.total_price)}</div></div>
              ${item.observations ? `<div class="small">Obs: ${item.observations}</div>` : ''}
            </div>
          `).join('') || ''}
        </div>

        <div class="total">
          <div class="row"><div class="title">TOTAL</div><div class="title">${formatPrice(order.total)}</div></div>
          <div class="small">Pagamento: ${paymentLabel}</div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      try {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
      } catch {}
      setTimeout(() => {
        try { printWindow.focus(); printWindow.print(); } catch {}
      }, 300);
    }
  };

  const handleDeleteOrder = async () => {
    if (!confirm('Tem certeza que deseja excluir este pedido? Esta ação não pode ser desfeita.')) return;
    try {
      await supabase.from('orders').delete().eq('id', order.id);
    } catch (e) {
      // fallback: se não puder excluir (restrições), apenas cancelar
      await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id);
    }
    onStatusChange(order.id, 'cancelled');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 pr-8">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={orderType.color}>
                <orderType.icon className="w-4 h-4 mr-1" />
                {orderType.label}
              </Badge>
              <Badge variant="outline" className={safeCurrentStatus.color}>
                <safeCurrentStatus.icon className="w-4 h-4 mr-1" />
                {safeCurrentStatus.label}
              </Badge>
          </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status no topo */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Status do Pedido</h3>
            <div className="max-w-xs">
              <Select value={order.status} onValueChange={(val) => onStatusChange(order.id, val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(statusConfig).map((st) => (
                    <SelectItem key={st} value={st}>{statusConfig[st as keyof typeof statusConfig].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
        </div>

          {/* Informações do Cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações do Cliente
              </h3>
              
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                <label className="text-sm font-medium text-gray-600">Nome</label>
                <p className="text-gray-900 font-medium">{order.customer_name}</p>
                  </div>
                  
              {order.customer_phone && (
                  <div>
                  <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                      Telefone
                    </label>
                  <p className="text-gray-900">{order.customer_phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Tipo de Entrega */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              {order.delivery_type === 'delivery' ? (
                <MapPin className="w-5 h-5 text-red-500" />
              ) : (
                <Store className="w-5 h-5 text-green-500" />
              )}
              {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada no Balcão'}
            </h3>
            
            {order.delivery_type === 'delivery' && order.customer_address && (
              <div>
                <label className="text-sm font-medium text-gray-600">Endereço</label>
                <p className="text-gray-900">{order.customer_address}</p>
                </div>
            )}
            
            {order.delivery_area && (
              <div className="mt-2">
                <label className="text-sm font-medium text-gray-600">Bairro</label>
                <p className="text-gray-900">{order.delivery_area.name}</p>
              </div>
            )}
          </div>

          {/* Itens do Pedido */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Itens do Pedido</h3>
            
            <div className="space-y-3">
              {order.items?.map((item, index) => (
                <div key={item.id} className="border-b border-gray-200 pb-3 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <span className="bg-brand-brown text-white text-sm font-bold px-2 py-1 rounded-full min-w-[24px] text-center">
                        {item.quantity}
                      </span>
                      <span className="font-medium text-gray-900">
                        {item.product?.name || 'Produto'}
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900">
                      {formatPrice(item.total_price)}
                    </span>
                  </div>
                  
                  {item.observations && (
                    <div className="ml-11 text-sm text-gray-600 bg-white p-2 rounded border">
                      📝 {item.observations}
                  </div>
                  )}
                  
                  {item.extras && item.extras.length > 0 && (
                    <div className="ml-11 mt-2">
                      <div className="text-sm text-gray-600 mb-1">Adicionais:</div>
                      <div className="space-y-1">
                        {item.extras.map((extra) => (
                          <div key={extra.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">
                              {extra.quantity}x {extra.extra?.name || 'Adicional'}
                            </span>
                            <span className="text-gray-600">
                              {formatPrice(extra.total_price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Ajuste manual de status - mantido apenas no topo (seção removida) */}

          {/* Pagamento e Valores */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pagamento e Valores
            </h3>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">{formatPrice(order.subtotal)}</span>
              </div>
              
              {order.delivery_fee > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Taxa de Entrega:</span>
                  <span className="font-medium">{formatPrice(order.delivery_fee)}</span>
                </div>
              )}
              
              <Separator />
              
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span className="text-brand-brown">{formatPrice(order.total)}</span>
              </div>
              
              <div className="mt-3">
                <label className="text-sm font-medium text-gray-600">Forma de Pagamento</label>
                <p className="text-gray-900 font-medium">💳 {paymentLabel}</p>
              </div>
            </div>
          </div>

          {/* Observações */}
          {order.notes && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-3">Observações</h3>
              <div className="bg-white p-3 rounded border">
                <p className="text-gray-700">{order.notes}</p>
              </div>
            </div>
          )}

          {/* Informações Adicionais */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3">Informações Adicionais</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Data/Hora do Pedido</label>
                <p className="text-gray-900">{formatDate(order.created_at)}</p>
              </div>
              
              {order.updated_at !== order.created_at && (
                <div>
                  <label className="text-sm font-medium text-gray-600">Última Atualização</label>
                  <p className="text-gray-900">{formatDate(order.updated_at)}</p>
                </div>
              )}
              
              <div>
                <label className="text-sm font-medium text-gray-600">ID do Pedido</label>
                <p className="text-gray-900 font-mono text-sm">{order.id}</p>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handlePrintComanda}
              className="flex items-center gap-2"
              title="Imprimir"
            >
              <Printer className="w-4 h-4" />
              <span className="sm:inline hidden">Imprimir</span>
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrder}
              className="flex items-center gap-2"
              title="Excluir"
            >
              <Trash className="w-4 h-4" />
              <span className="sm:inline hidden">Excluir</span>
            </Button>
            
            <div className="flex gap-3 flex-1">
              {safeCurrentStatus.prevStatus && (
                <Button
                  variant="outline"
                  onClick={() => onStatusChange(order.id, safeCurrentStatus.prevStatus as any)}
                  className="flex items-center gap-2 flex-1"
                >
                  Voltar
                </Button>
              )}

              {safeCurrentStatus.nextStatus && (
              <Button
                onClick={handleNextStatus}
                className="flex items-center gap-2 flex-1"
              >
                <ArrowRight className="w-4 h-4" />
                {safeCurrentStatus.nextLabel}
              </Button>
              )}
            </div>
            
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
