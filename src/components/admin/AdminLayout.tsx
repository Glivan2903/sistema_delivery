import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { LogOut, Package, Tag, Truck, CreditCard, Settings, BarChart3, ClipboardList, PlusCircle, User, Bell, Check, X, Menu, Power } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import marromLogo from '@/assets/marrom-logo.jpg';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AdminLayoutProps {
  children: ReactNode;
  activeSection: string;
  onSectionChange: (section: string) => void;
  onLogout: () => void;
  currentUser: SupabaseUser | null;
  companyName?: string;
}

const menuItems = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'categorias', name: 'Categorias', icon: Tag },
  { id: 'produtos', name: 'Produtos', icon: Package },
  { id: 'pedidos', name: 'Pedidos', icon: ClipboardList },
  { id: 'adicionais', name: 'Adicionais', icon: PlusCircle },
  { id: 'entrega', name: 'Entrega', icon: Truck },
  { id: 'pagamentos', name: 'Pagamentos', icon: CreditCard },
  { id: 'configuracoes', name: 'Configurações', icon: Settings },
];

export const AdminLayout = ({ children, activeSection, onSectionChange, onLogout, currentUser, companyName }: AdminLayoutProps) => {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [newOrders, setNewOrders] = useState<any[]>([]);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isEstablishmentOpen, setIsEstablishmentOpen] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Carregar status do estabelecimento e logotipo
  useEffect(() => {
    const fetchEstablishmentStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('is_open, logo_url')
          .limit(1)
          .single();
        
        if (error) {
          console.error('Erro ao carregar status do estabelecimento:', error);
          return;
        }
        
        if (data) {
          // Padrão: true se null/undefined
          const isOpen = data.is_open !== false;
          console.log('Status do estabelecimento carregado:', isOpen, 'Valor original:', data.is_open);
          setIsEstablishmentOpen(isOpen);
          setLogoUrl(data.logo_url);
        } else {
          console.log('Nenhuma configuração encontrada, usando padrão: true');
          setIsEstablishmentOpen(true);
        }
      } catch (error) {
        console.error('Erro ao carregar status do estabelecimento:', error);
        // Em caso de erro, usar padrão
        setIsEstablishmentOpen(true);
      }
    };

    fetchEstablishmentStatus();
  }, []);

  // Função para atualizar status do estabelecimento
  const handleToggleEstablishmentStatus = async (isOpen: boolean) => {
    try {
      console.log('Tentando atualizar status para:', isOpen);
      
      // Primeiro, buscar o ID da configuração
      const { data: settingsData, error: fetchError } = await supabase
        .from('company_settings')
        .select('id, is_open')
        .limit(1)
        .single();

      if (fetchError) {
        console.error('Erro ao buscar configurações:', fetchError);
        return;
      }

      if (!settingsData?.id) {
        console.error('Nenhuma configuração encontrada');
        return;
      }

      console.log('Configuração atual:', settingsData);

      // Atualizar o status
      const { data: updateData, error: updateError } = await supabase
        .from('company_settings')
        .update({ is_open: isOpen })
        .eq('id', settingsData.id)
        .select('is_open')
        .single();

      if (updateError) {
        console.error('Erro ao atualizar status:', updateError);
        return;
      }

      console.log('Status atualizado com sucesso:', updateData);

      setIsEstablishmentOpen(isOpen);
      
      // Disparar evento para atualizar outras partes da aplicação
      window.dispatchEvent(new CustomEvent('establishment-status-changed', { 
        detail: { isOpen } 
      }));
    } catch (error) {
      console.error('Erro ao atualizar status do estabelecimento:', error);
    }
  };

  useEffect(() => {
    const subscription = supabase
      .channel('orders-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, payload => {
        setNewOrdersCount(prev => prev + 1);
        setNewOrders(prev => [{
          id: payload.new?.id,
          customer_name: payload.new?.customer_name,
          total: payload.new?.total,
          created_at: payload.new?.created_at,
        }, ...prev].slice(0, 5));
        try {
          // Alarme ~3s via WebAudio
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.connect(gain);
          gain.connect(ctx.destination);
          // padrão de alarme variando frequência
          const start = ctx.currentTime;
          for (let i = 0; i < 6; i++) {
            const t = start + i * 0.5;
            const freq = i % 2 === 0 ? 900 : 1200;
            osc.frequency.setValueAtTime(freq, t);
            gain.gain.setValueAtTime(0.001, t);
            gain.gain.exponentialRampToValueAtTime(0.25, t + 0.01);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.45);
          }
          osc.start(start);
          osc.stop(start + 3.0);
        } catch {}
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm flex-shrink-0">
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src={logoUrl || marromLogo}
              alt={companyName || 'Marrom Lanches'}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-brand-brown">Painel Administrativo</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">{companyName || 'Marrom Lanches'}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Establishment Status Switch - Mobile */}
            <div className="lg:hidden flex items-center space-x-2">
              <Power className={`w-4 h-4 ${isEstablishmentOpen ? 'text-green-600' : 'text-red-600'}`} />
              <Switch
                checked={isEstablishmentOpen}
                onCheckedChange={handleToggleEstablishmentStatus}
                className="data-[state=checked]:bg-green-600"
              />
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </Button>

            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <button className="relative hidden sm:block" title="Novos pedidos" onClick={() => setIsPopoverOpen(v => !v)}>
                  <Bell className="w-5 h-5 text-brand-brown" />
                  {newOrdersCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-[10px] rounded-full w-5 h-5 flex items-center justify-center">
                      {newOrdersCount}
                    </span>
                  )}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" align="end">
                <div className="p-3 border-b font-medium">Novos pedidos</div>
                <div className="max-h-64 overflow-auto">
                  {newOrders.length === 0 ? (
                    <div className="p-3 text-sm text-muted-foreground">Sem notificações</div>
                  ) : (
                    newOrders.map((o) => (
                      <div key={o.id} className="p-3 border-b last:border-b-0 text-sm">
                        <div className="flex justify-between">
                          <span className="font-medium">#{String(o.id || '').slice(-6)}</span>
                          <span>R$ {Number(o.total || 0).toFixed(2).replace('.', ',')}</span>
                        </div>
                        <div className="text-muted-foreground truncate">{o.customer_name || 'Cliente'}</div>
                        <div className="text-xs text-muted-foreground mb-2">{new Date(o.created_at).toLocaleString('pt-BR')}</div>
                        <div className="flex gap-2 justify-end">
                          <Button variant="outline" size="icon" title="Cancelar" onClick={async () => {
                            await supabase.from('orders').update({ status: 'cancelled' }).eq('id', o.id);
                            setNewOrders(prev => prev.filter(x => x.id !== o.id));
                            setNewOrdersCount(c => Math.max(0, c - 1));
                            setIsPopoverOpen(false);
                            try { window.dispatchEvent(new CustomEvent('orders-updated')); } catch {}
                          }}>✕</Button>
                          <Button size="icon" title="Confirmar" onClick={async () => {
                            await supabase.from('orders').update({ status: 'preparing' }).eq('id', o.id);
                            setNewOrders(prev => prev.filter(x => x.id !== o.id));
                            setNewOrdersCount(c => Math.max(0, c - 1));
                            setIsPopoverOpen(false);
                            try { window.dispatchEvent(new CustomEvent('orders-updated')); } catch {}
                          }}>✓</Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setNewOrdersCount(0); setNewOrders([]); setIsPopoverOpen(false); }}>Marcar lidas</Button>
                  <Button size="sm" className="flex-1" onClick={() => { onSectionChange('pedidos'); setIsPopoverOpen(false); }}>Ver pedidos</Button>
                </div>
              </PopoverContent>
            </Popover>
            {/* Establishment Status Switch - Desktop */}
            <div className="hidden lg:flex items-center space-x-2">
              <Power className={`w-4 h-4 ${isEstablishmentOpen ? 'text-green-600' : 'text-red-600'}`} />
              <Switch
                checked={isEstablishmentOpen}
                onCheckedChange={handleToggleEstablishmentStatus}
                className="data-[state=checked]:bg-green-600"
              />
              <Label className="text-sm text-muted-foreground">
                {isEstablishmentOpen ? 'Aberto' : 'Fechado'}
              </Label>
            </div>

            {currentUser && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{currentUser.email}</span>
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onLogout}
              className="text-destructive hover:text-destructive border-destructive/50 hover:border-destructive hidden sm:flex"
            >
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
        )}
        
        {/* Mobile Sidebar */}
        <aside className={`lg:hidden fixed left-0 top-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 ease-in-out ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-brand-brown">Menu</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileMenuOpen(false)}
                className="lg:hidden"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <nav>
              <ul className="space-y-2">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onSectionChange(item.id);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors ${
                          isActive 
                            ? 'bg-brand-brown text-white' 
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{item.name}</span>
                      </button>
                    </li>
                  );
                })}
                
                {/* Botão Sair no final do menu mobile */}
                <li className="pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-colors text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Sair</span>
                  </button>
                </li>
              </ul>
            </nav>
          </div>
        </aside>

        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 bg-card border-r border-border flex-shrink-0">
          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <li key={item.id}>
                    <button
                      onClick={() => onSectionChange(item.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        isActive 
                          ? 'bg-brand-brown text-white' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="p-3 sm:p-4 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};