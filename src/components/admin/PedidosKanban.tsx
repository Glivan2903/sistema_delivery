import React, { useState, useEffect, useMemo } from 'react';
import { CardPedido } from './CardPedido';
import { PopupDetalhesPedido } from './PopupDetalhesPedido';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Clock, CheckCircle, Truck, Store, Smartphone, Search, Filter, Calendar, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';

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
  order_type?: 'cliente' | 'estabelecimento';
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

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-amber-50 border-amber-300', icon: Clock, dot: 'bg-amber-400' },
  preparing: { label: 'Preparando', color: 'bg-blue-50 border-blue-300', icon: Clock, dot: 'bg-blue-400' },
  ready: { label: 'Pronto', color: 'bg-green-50 border-green-300', icon: CheckCircle, dot: 'bg-green-500' },
  delivered: { label: 'Entregue', color: 'bg-gray-50 border-gray-300', icon: Truck, dot: 'bg-gray-400' },
  cancelled: { label: 'Cancelado', color: 'bg-red-50 border-red-300', icon: CheckCircle, dot: 'bg-red-500' }
} as const;

const orderTypeConfig = {
  cliente: { label: 'Online', color: 'bg-blue-100 text-blue-800', icon: Smartphone },
  estabelecimento: { label: 'Balcão', color: 'bg-purple-100 text-purple-800', icon: Store }
};

export const PedidosKanban: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  // Layout simplificado estilo imagem
  const [autoRefresh, setAutoRefresh] = useState(true);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('24h');
  
  // Estado para cards expansíveis mobile
  const [expandedStatuses, setExpandedStatuses] = useState<Record<string, boolean>>({
    pending: false,
    preparing: false,
    ready: false,
    delivered: false,
    cancelled: false
  });

  // Estado para mostrar/ocultar filtros em mobile
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Hook para detectar dispositivo móvel
  const isMobile = useIsMobile();

  // Buscar pedidos
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      // Buscar pedidos com relacionamentos
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          delivery_area:delivery_areas(name, fee)
        `)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Buscar itens de cada pedido
      const ordersWithItems = await Promise.all(
        (ordersData || []).map(async (order) => {
      const { data: itemsData, error: itemsError } = await supabase
            .from('order_items')
            .select(`
              *,
              product:products(name),
              extras:order_item_extras(
                *,
                extra:extras(name)
              )
            `)
            .eq('order_id', order.id)
            .order('created_at', { ascending: true });

          if (itemsError) {
            console.error('Erro ao buscar itens:', itemsError);
            return { ...order, items: [] };
          }

          return {
            ...order,
            items: itemsData || []
          };
        })
      );

      setOrders((ordersWithItems as any[]).map((o: any) => ({
        ...o,
        delivery_type: (o.delivery_type === 'delivery' ? 'delivery' : 'pickup') as 'delivery' | 'pickup',
      })));
    } catch (error) {
      console.error('Erro ao buscar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh a cada 30 segundos
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchOrders, 30000);
    const listener = () => fetchOrders();
    window.addEventListener('orders-updated', listener as any);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Buscar pedidos na montagem
  useEffect(() => {
    fetchOrders();
  }, []);

  // Filtrar e ordenar pedidos
  const getDerivedOrderType = (order: Order): 'cliente' | 'estabelecimento' => {
    return order.order_type || (order.delivery_type === 'pickup' ? 'estabelecimento' : 'cliente');
  };

  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    // Filtro por período
    const now = new Date();
    switch (periodFilter) {
      case '24h':
        const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.created_at) >= yesterday);
        break;
      case '7d':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.created_at) >= weekAgo);
        break;
      case '30d':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => new Date(order.created_at) >= monthAgo);
        break;
      case 'all':
      default:
        break;
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Filtro por tipo de pedido
    if (orderTypeFilter !== 'all') {
      filtered = filtered.filter(order => getDerivedOrderType(order) === orderTypeFilter);
    }

    // Filtro por busca (nome do cliente, telefone, observações)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(order => 
        order.customer_name?.toLowerCase().includes(term) ||
        order.customer_phone?.includes(term) ||
        order.notes?.toLowerCase().includes(term) ||
        order.id.toLowerCase().includes(term)
      );
    }

    // Ordenar por data de criação (mais recente primeiro)
    return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, periodFilter, statusFilter, orderTypeFilter, searchTerm]);

  // Atualizar status do pedido
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId);

      if (error) throw error;

      // Atualizar estado local
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any, updated_at: new Date().toISOString() }
          : order
      ));

      // Fechar detalhes se estiver aberto
      if (selectedOrder?.id === orderId) {
        setIsDetailsOpen(false);
        setSelectedOrder(null);
      }

      // Recarregar lista para refletir deleções/alterações externas
      fetchOrders();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status do pedido');
    }
  };

  // Abrir detalhes do pedido
  const openOrderDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDetailsOpen(true);
  };

  // Formatar preço
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  // Formatar data
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setOrderTypeFilter('all');
    setPeriodFilter('24h');
  };

  const toggleStatusExpansion = (status: string) => {
    setExpandedStatuses(prev => ({
      ...prev,
      [status]: !prev[status]
    }));
  };

  // Contadores por status (após filtros)
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    Object.keys(statusConfig).forEach(status => {
      counts[status] = filteredAndSortedOrders.filter(order => order.status === status).length;
    });
    return counts;
  }, [filteredAndSortedOrders]);

  const summary = useMemo(() => {
    const active = (statusCounts['pending'] || 0) + (statusCounts['preparing'] || 0) + (statusCounts['ready'] || 0);
    const completed = (statusCounts['ready'] || 0) + (statusCounts['delivered'] || 0);
    const cancelled = (statusCounts['cancelled'] || 0);
    return { active, completed, cancelled };
  }, [statusCounts]);

  return (
    <div className="space-y-6">
      {/* Resumo */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="bg-white border rounded-lg p-2 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">Ativos</div>
          <div className="text-xl sm:text-3xl font-bold">{summary.active}</div>
          <div className="text-xs text-muted-foreground mt-1 hidden sm:block">Pedidos em andamento</div>
        </div>
        <div className="bg-white border rounded-lg p-2 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">Concluídos</div>
          <div className="text-xl sm:text-3xl font-bold">{summary.completed}</div>
          <div className="text-xs text-muted-foreground mt-1 hidden sm:block">Pedidos entregues ou prontos</div>
        </div>
        <div className="bg-white border rounded-lg p-2 sm:p-4">
          <div className="text-xs sm:text-sm text-muted-foreground">Cancelados</div>
          <div className="text-xl sm:text-3xl font-bold">{summary.cancelled}</div>
          <div className="text-xs text-muted-foreground mt-1 hidden sm:block">Pedidos cancelados</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border rounded-lg p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Busca - Sempre visível */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar por nome, telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Botão para mostrar/ocultar filtros em mobile */}
        {isMobile && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="flex items-center gap-2"
            >
              {showAdvancedFilters ? (
                <>
                  <X className="w-4 h-4" />
                  Ocultar Filtros
                </>
              ) : (
                <>
                  <Filter className="w-4 h-4" />
                  Mostrar Filtros
                </>
              )}
            </Button>
          </div>
        )}

        {/* Filtros Avançados - Ocultos em mobile por padrão, sempre visíveis em desktop */}
        <div className={`${isMobile && !showAdvancedFilters ? 'hidden' : 'block'} space-y-4`}>
          {isMobile && (
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-500" />
              <h3 className="font-semibold text-gray-900">Filtros Avançados</h3>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Período */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Período</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="24h">Últimas 24h</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="all">Todos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="preparing">Preparando</SelectItem>
                  <SelectItem value="ready">Pronto</SelectItem>
                  <SelectItem value="delivered">Entregue</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tipo de Pedido */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Tipo</label>
              <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  <SelectItem value="cliente">Online</SelectItem>
                  <SelectItem value="estabelecimento">Balcão</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2">
          <div className="text-sm text-gray-600 text-center sm:text-left">
            {filteredAndSortedOrders.length} de {orders.length} pedidos
          </div>
          <div className="flex gap-2 justify-center sm:justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Limpar Filtros</span>
              <span className="sm:hidden">Limpar</span>
            </Button>
            <Button
              variant="outline"
              onClick={fetchOrders}
              disabled={loading}
              className="flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
              <span className="sm:hidden">Atualizar</span>
            </Button>
            <Button
              variant={autoRefresh ? 'default' : 'outline'}
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              <span className="hidden sm:inline">{autoRefresh ? 'Auto ON' : 'Auto OFF'}</span>
              <span className="sm:hidden">{autoRefresh ? 'ON' : 'OFF'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Kanban Board - Layout mobile otimizado */}
      <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-5 lg:gap-6">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={status} className="space-y-4">
            {/* Header da coluna - Clicável em mobile */}
            <div 
              className={`flex items-center justify-between border rounded-lg px-3 py-2 ${config.color} cursor-pointer lg:cursor-default`}
              onClick={() => isMobile && toggleStatusExpansion(status)}
            >
              <div className="flex items-center gap-2">
                <config.icon className="w-5 h-5" />
                <h3 className="font-semibold text-gray-900">{config.label}</h3>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{statusCounts[status] || 0}</Badge>
                {isMobile && (
                  <div className="lg:hidden">
                    {expandedStatuses[status] ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Lista de pedidos - Ocultável em mobile */}
            <div className={`space-y-3 min-h-[400px] ${isMobile && !expandedStatuses[status] ? 'hidden' : 'block'}`}>
              {filteredAndSortedOrders
                .filter(order => order.status === status)
                .map((order: any) => (
                <CardPedido
                  key={order.id}
                  order={order}
                  onStatusChange={updateOrderStatus}
                  onViewDetails={openOrderDetails}
                  formatPrice={formatPrice}
                  formatDate={formatDate}
                />
              ))}
              
              {(!filteredAndSortedOrders.filter(order => order.status === status) || 
                filteredAndSortedOrders.filter(order => order.status === status).length === 0) && (
                <div className="text-center py-8 text-gray-400">
                  <p className="text-sm">Nenhum pedido</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Detalhes */}
      {selectedOrder && (
        <PopupDetalhesPedido
          order={selectedOrder}
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedOrder(null);
          }}
          onStatusChange={updateOrderStatus}
          formatPrice={formatPrice}
          formatDate={formatDate}
        />
      )}
    </div>
  );
};
