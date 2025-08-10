import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Clock, 
  CheckCircle, 
  Truck, 
  Store,
  Smartphone,
  MapPin,
  User,
  Eye,
  ArrowRight,
  ArrowLeft,
  Printer,
  Calendar,
  Check,
  X
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

interface CardPedidoProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
  onViewDetails: (order: Order) => void;
  formatPrice: (price: number) => string;
  formatDate: (dateString: string) => string;
}

const statusConfig = {
  pending: { 
    label: 'Pendente', 
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    icon: Clock,
    nextStatus: 'preparing',
    prevStatus: null as unknown as string | null,
  },
  accepted: { 
    // compat legado
    label: 'Aceito', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    nextStatus: 'ready',
    prevStatus: 'pending'
  },
  out_for_delivery: { 
    // compat legado
    label: 'Saiu para entrega', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: Truck,
    nextStatus: 'delivered',
    prevStatus: 'ready'
  },
  preparing: { 
    label: 'Preparando', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Clock,
    nextStatus: 'ready',
    prevStatus: 'pending'
  },
  ready: { 
    label: 'Pronto', 
    color: 'bg-green-100 text-green-800 border-green-200',
    icon: CheckCircle,
    nextStatus: 'delivered',
    prevStatus: 'preparing'
  },
  delivered: { 
    label: 'Entregue', 
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: Truck,
    nextStatus: null,
    prevStatus: 'ready'
  },
  cancelled: { 
    label: 'Cancelado', 
    color: 'bg-red-100 text-red-800 border-red-200',
    icon: CheckCircle,
    nextStatus: null,
    prevStatus: null as unknown as string | null,
  }
} as const;

const orderTypeConfig = {
  cliente: { 
    label: 'Online', 
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    icon: Smartphone
  },
  estabelecimento: { 
    label: 'Balcão', 
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    icon: Store
  }
};

const paymentMethodLabels = {
  dinheiro: 'Dinheiro',
  pix: 'PIX',
  credito: 'Cartão de Crédito',
  debito: 'Cartão de Débito'
};

export const CardPedido: React.FC<CardPedidoProps> = ({
  order,
  onStatusChange,
  onViewDetails,
  formatPrice,
  formatDate
}) => {
  const currentStatus = statusConfig[order.status as keyof typeof statusConfig];
  const safeCurrentStatus = currentStatus ?? {
    label: order.status || 'Status',
    color: 'bg-gray-100 text-gray-800 border-gray-200',
    icon: CheckCircle,
    nextStatus: null as unknown as string | null,
    prevStatus: null as unknown as string | null,
  };
  const orderType = orderTypeConfig[(order.order_type || 'cliente') as keyof typeof orderTypeConfig] || orderTypeConfig.cliente;
  // Código curto do pedido para exibição
  const orderCode = `#${(order.id || '').slice(-6)}`;
  const tableNumberMatch1 = (order.notes || '').match(/Mesa:\s*([A-Za-z0-9-]+)/i);
  const tableNumber1 = tableNumberMatch1 ? tableNumberMatch1[1] : undefined;
  const tableNumberMatch = (order.notes || '').match(/Mesa:\s*([A-Za-z0-9-]+)/i);
  const tableNumber = tableNumberMatch ? tableNumberMatch[1] : undefined;

  const handleNextStatus = () => {
    if (safeCurrentStatus.nextStatus) {
      onStatusChange(order.id, safeCurrentStatus.nextStatus);
    }
  };

  const getOrderDate = () => formatDate(order.created_at);

  const handlePrevStatus = () => {
    if (safeCurrentStatus.prevStatus) {
      onStatusChange(order.id, safeCurrentStatus.prevStatus);
    }
  };

  const handleCancel = () => {
    onStatusChange(order.id, 'cancelled');
  };

  const handlePrintComanda = async () => {
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
          body { font-family: monospace; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .section { margin: 15px 0; }
          .item { margin: 8px 0; }
          .total { border-top: 2px solid #000; padding-top: 10px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${companyName.toUpperCase()}</h1>
          ${address ? `<div>${address}</div>` : ''}
          ${phone ? `<div>Tel: ${phone}</div>` : ''}
          ${whatsapp ? `<div>WhatsApp: ${whatsapp}</div>` : ''}
          ${businessHours ? `<div>Horário: ${businessHours}</div>` : ''}
          <div style="margin-top:6px">Pedido ${order.id.slice(-6)} • ${getOrderDate()}</div>
        </div>
        
        <div class="section">
          <h3>Cliente: ${order.customer_name}</h3>
          <p>Tipo: ${order.delivery_type === 'delivery' ? 'ENTREGA' : 'BALCÃO'}</p>
        </div>
        
        ${isDelivery && order.customer_address ? `
        <div class="section">
          <h3>Entrega:</h3>
          <div>${order.customer_address}</div>
          ${order.delivery_area?.name ? `<div>Bairro: ${order.delivery_area.name}</div>` : ''}
        </div>` : ''}

        <div class="section">
          <h3>Itens:</h3>
          ${(order.items || []).map(item => `
            <div class="item">
              ${item.quantity}x ${item.product?.name || 'Produto'}
          </div>
          `).join('')}
        </div>
        
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className={`rounded-xl border p-3 shadow-sm hover:shadow-md transition-shadow min-h-[120px] flex flex-col justify-between`}>
      {/* Linha 1: Nome - mesa - código */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {order.delivery_type === 'delivery' ? (
            <MapPin className="w-5 h-5 text-red-500" />
          ) : (
            <Store className="w-5 h-5 text-green-600" />
          )}
          <span className="text-[15px] font-semibold text-gray-900">{order.customer_name || 'Cliente'}</span>
          {order.delivery_type !== 'delivery' && tableNumber1 && (
            <span className="text-xs text-gray-700">- Mesa {tableNumber1}</span>
          )}
        </div>
        <div className="text-[12px] text-purple-600 font-mono">{orderCode}</div>
      </div>

      {/* Linha 2: Data/Hora - Valor */}
      <div className="flex items-center justify-between text-[13px] text-gray-700 mt-1">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          {getOrderDate()}
        </div>
        <div className="text-[15px] font-bold text-brand-brown">{formatPrice(order.total)}</div>
          </div>

      {/* Linha 3: Botões na horizontal (padrão por status) */}
      <div className="flex items-center justify-end gap-2 mt-2">
        <Button variant="outline" size="icon" onClick={() => onViewDetails(order)} title="Visualizar" aria-label="Visualizar" className="bg-gray-100">
          <Eye className="w-4 h-4" />
        </Button>
        {order.status === 'pending' ? (
          <>
            <Button variant="default" size="icon" onClick={handleNextStatus} title="Aceitar" aria-label="Aceitar" className="bg-brand-brown">
              <Check className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleCancel} title="Cancelar" aria-label="Cancelar" className="bg-red-600 text-white hover:bg-red-700">
              <X className="w-4 h-4" />
            </Button>
          </>
        ) : (
          <>
            {safeCurrentStatus.prevStatus && (
              <Button variant="outline" size="icon" onClick={handlePrevStatus} title="Anterior" aria-label="Anterior">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            {safeCurrentStatus.nextStatus && (
              <Button variant="default" size="icon" onClick={handleNextStatus} title="Próximo" aria-label="Próximo" className="bg-brand-brown">
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
