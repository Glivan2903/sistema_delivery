import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, Tag, Truck, CreditCard, TrendingUp, Users, Clock, DollarSign, ShoppingCart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

interface AdminDashboardProps {
  stats: {
    categorias: number;
    produtos: number;
    entrega: number;
    pagamentos: number;
  };
}

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingOrders: number;
  preparingOrders: number;
  readyOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  topProducts: Array<{
    name: string;
    quantity: number;
    revenue: number;
  }>;
  ordersByDay: Array<{
    date: string;
    orders: number;
    revenue: number;
  }>;
  ordersByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  deliveryVsPickup: Array<{
    type: string;
    count: number;
    percentage: number;
  }>;
}

export const AdminDashboard = ({ stats }: AdminDashboardProps) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Buscar dados do dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // Buscar pedidos
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Buscar itens dos pedidos para análise de produtos
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          product:products(name)
        `);

      if (itemsError) throw itemsError;

      // Processar dados
      const processedData = processOrdersData(orders || [], orderItems || []);
      setDashboardData(processedData);
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Processar dados dos pedidos
  const processOrdersData = (orders: any[], orderItems: any[]): DashboardData => {
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Filtrar pedidos dos últimos 7 dias para gráfico temporal
    const recentOrders = orders.filter(order => new Date(order.created_at) >= last7Days);

    // Estatísticas gerais
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total), 0);
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Contadores por status
    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length,
    };

    // Produtos mais pedidos
    const productStats = new Map<string, { name: string; quantity: number; revenue: number }>();
    
    orderItems.forEach(item => {
      const productName = item.product?.name || 'Produto desconhecido';
      const existing = productStats.get(productName) || { name: productName, quantity: 0, revenue: 0 };
      
      existing.quantity += item.quantity;
      existing.revenue += Number(item.total_price);
      
      productStats.set(productName, existing);
    });

    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Pedidos por dia (últimos 7 dias)
    const ordersByDay = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      
      const dayOrders = recentOrders.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate.toDateString() === date.toDateString();
      });

      ordersByDay.push({
        date: dateStr,
        orders: dayOrders.length,
        revenue: dayOrders.reduce((sum, order) => sum + Number(order.total), 0)
      });
    }

    // Pedidos por status (para gráfico de pizza)
    const totalActiveOrders = statusCounts.pending + statusCounts.preparing + statusCounts.ready;
    const ordersByStatus = [
      { status: 'Pendente', count: statusCounts.pending, percentage: totalActiveOrders > 0 ? (statusCounts.pending / totalActiveOrders) * 100 : 0 },
      { status: 'Preparando', count: statusCounts.preparing, percentage: totalActiveOrders > 0 ? (statusCounts.preparing / totalActiveOrders) * 100 : 0 },
      { status: 'Pronto', count: statusCounts.ready, percentage: totalActiveOrders > 0 ? (statusCounts.ready / totalActiveOrders) * 100 : 0 },
    ];

    // Delivery vs Pickup
    const deliveryCount = orders.filter(o => o.delivery_type === 'delivery').length;
    const pickupCount = orders.filter(o => o.delivery_type === 'pickup').length;
    const total = deliveryCount + pickupCount;
    
    const deliveryVsPickup = [
      { type: 'Delivery', count: deliveryCount, percentage: total > 0 ? (deliveryCount / total) * 100 : 0 },
      { type: 'Balcão', count: pickupCount, percentage: total > 0 ? (pickupCount / total) * 100 : 0 },
    ];

    return {
      totalOrders,
      totalRevenue,
      averageOrderValue,
      pendingOrders: statusCounts.pending,
      preparingOrders: statusCounts.preparing,
      readyOrders: statusCounts.ready,
      deliveredOrders: statusCounts.delivered,
      cancelledOrders: statusCounts.cancelled,
      topProducts,
      ordersByDay,
      ordersByStatus,
      deliveryVsPickup
    };
  };

  // Carregar dados na montagem
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Configurações dos gráficos
  const chartConfig = {
    topProducts: {
      "Produtos": {
        label: "Produtos Mais Pedidos",
        color: "hsl(var(--chart-1))"
      }
    },
    ordersByDay: {
      "Pedidos": {
        label: "Pedidos por Dia",
        color: "hsl(var(--chart-2))"
      },
      "Receita": {
        label: "Receita por Dia",
        color: "hsl(var(--chart-3))"
      }
    },
    ordersByStatus: {
      "Pendente": {
        label: "Pendente",
        color: "hsl(var(--chart-4))"
      },
      "Preparando": {
        label: "Preparando",
        color: "hsl(var(--chart-5))"
      },
      "Pronto": {
        label: "Pronto",
        color: "hsl(var(--chart-6))"
      }
    },
    deliveryVsPickup: {
      "Delivery": {
        label: "Delivery",
        color: "hsl(var(--chart-7))"
      },
      "Balcão": {
        label: "Balcão",
        color: "hsl(var(--chart-8))"
      }
    }
  };

  const cards = [
    {
      title: 'Total de Pedidos',
      value: dashboardData?.totalOrders || 0,
      description: 'Todos os tempos',
      icon: ShoppingCart,
      color: 'text-blue-600'
    },
    {
      title: 'Pedidos Pendentes',
      value: dashboardData?.pendingOrders || 0,
      description: 'Aguardando confirmação',
      icon: Clock,
      color: 'text-orange-600'
    },
    {
      title: 'Em Preparação',
      value: dashboardData?.preparingOrders || 0,
      description: 'Sendo preparados',
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Prontos para Entrega',
      value: dashboardData?.readyOrders || 0,
      description: 'Aguardando entrega',
      icon: Truck,
      color: 'text-green-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-brown">Dashboard</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Carregando dados...</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold text-brand-brown">Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Visão geral e análises do negócio</p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {card.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <CardDescription className="text-xs">
                  {card.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Produtos mais pedidos */}
        <Card>
          <CardHeader>
            <CardTitle>Produtos Mais Pedidos</CardTitle>
            <CardDescription>Top 5 produtos por quantidade</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig.topProducts}>
              <BarChart data={dashboardData?.topProducts || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="quantity" fill="hsl(var(--chart-1))" />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pedidos por status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Pedidos ativos por status</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig.ordersByStatus}>
              <PieChart>
                <Pie
                  data={dashboardData?.ordersByStatus || []}
                  dataKey="count"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="hsl(var(--chart-4))"
                >
                  {dashboardData?.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${4 + index}))`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pedidos por dia */}
        <Card>
          <CardHeader>
            <CardTitle>Pedidos dos Últimos 7 Dias</CardTitle>
            <CardDescription>Volume diário de pedidos</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig.ordersByDay}>
              <LineChart data={dashboardData?.ordersByDay || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="orders" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--chart-2))" }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Delivery vs Pickup */}
        <Card>
          <CardHeader>
            <CardTitle>Delivery vs Balcão</CardTitle>
            <CardDescription>Distribuição por tipo de pedido</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig.deliveryVsPickup}>
              <PieChart>
                <Pie
                  data={dashboardData?.deliveryVsPickup || []}
                  dataKey="count"
                  nameKey="type"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="hsl(var(--chart-7))"
                >
                  {dashboardData?.deliveryVsPickup.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${7 + index}))`} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Estatísticas adicionais */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Resumo de categorias e produtos */}
        <Card>
          <CardHeader>
            <CardTitle>Configurações do Sistema</CardTitle>
            <CardDescription>Resumo das configurações ativas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Tag className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{stats.categorias}</div>
                <div className="text-sm text-blue-600">Categorias</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Package className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-600">{stats.produtos}</div>
                <div className="text-sm text-green-600">Produtos</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <Truck className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-orange-600">{stats.entrega}</div>
                <div className="text-sm text-orange-600">Áreas de Entrega</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <CreditCard className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{stats.pagamentos}</div>
                <div className="text-sm text-purple-600">Formas de Pagamento</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Métricas de performance */}
        <Card>
          <CardHeader>
            <CardTitle>Métricas de Performance</CardTitle>
            <CardDescription>Indicadores de eficiência</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa de Entrega</span>
                <span className="text-sm font-medium">
                  {dashboardData && dashboardData.totalOrders > 0 
                    ? `${((dashboardData.deliveredOrders / dashboardData.totalOrders) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Taxa de Cancelamento</span>
                <span className="text-sm font-medium">
                  {dashboardData && dashboardData.totalOrders > 0 
                    ? `${((dashboardData.cancelledOrders / dashboardData.totalOrders) * 100).toFixed(1)}%`
                    : '0%'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Pedidos por Dia (média)</span>
                <span className="text-sm font-medium">
                  {dashboardData && dashboardData.totalOrders > 0 
                    ? (dashboardData.totalOrders / 7).toFixed(1)
                    : '0'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Receita por Dia (média)</span>
                <span className="text-sm font-medium">
                  {dashboardData && dashboardData.totalRevenue > 0 
                    ? `R$ ${(dashboardData.totalRevenue / 7).toFixed(2)}`
                    : 'R$ 0,00'
                  }
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};