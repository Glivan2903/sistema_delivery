import { useState, useEffect } from 'react';
import { AdminLogin } from './AdminLogin';
import { AdminLayout } from './AdminLayout';
import { AdminDashboard } from './AdminDashboard';
import { CategoriasManager } from './CategoriasManager';
import { ProdutosManager } from './ProdutosManager';
import { EntregaManager } from './EntregaManager';
import { PagamentosManager } from './PagamentosManager';
import { ConfiguracoesManager } from './ConfiguracoesManager';
import { AdicionaisManager } from './AdicionaisManager';
import { PedidosManager } from './PedidosManager';
import { Product, Category } from '@/types/product';
import { categories as initialCategories, products as initialProducts } from '@/data/products';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

export interface DeliveryArea {
  id: string;
  name: string;
  fee: number;
  active: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}

export interface Settings {
  freeDeliveryMinimum: number;
  deliveryTime: string;
  welcomeTitle: string;
  companyName: string;
  subtitle: string;
  address: string;
  phone: string;
  whatsapp: string;
  businessHours: string;
}

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateProducts: (products: Product[]) => void;
  onUpdateCategories: (categories: Category[]) => void;
  onUpdateSettings: (settings: Settings) => void;
}

// Interface para comunicação entre AdminLogin e AdminPanel
interface LoginState {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const AdminPanel = ({ isOpen, onClose, onUpdateProducts, onUpdateCategories, onUpdateSettings }: AdminPanelProps) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Estados para dados administrativos
  const [categorias, setCategorias] = useState<Category[]>(initialCategories);
  const [produtos, setProdutos] = useState<Product[]>(initialProducts);
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([
    { id: '1', name: 'Centro', fee: 0, active: true },
    { id: '2', name: 'Bairro Novo', fee: 3.50, active: true },
    { id: '3', name: 'Industrial', fee: 5.00, active: true },
  ]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    { id: '1', name: 'Dinheiro', active: true },
    { id: '2', name: 'PIX', active: true },
    { id: '3', name: 'Cartão de Débito', active: true },
    { id: '4', name: 'Cartão de Crédito', active: true },
    { id: '5', name: 'Vale Alimentação', active: false },
  ]);
  const [settings, setSettings] = useState<Settings>({
    freeDeliveryMinimum: 35,
    deliveryTime: '30-45 min',
    welcomeTitle: 'Bem-vindo ao',
    companyName: 'Marrom Lanches',
    subtitle: 'Hambúrguers artesanais irresistíveis, entregues na sua porta com todo carinho',
    address: 'Av. Serafim Bonfim s/n',
    phone: '(79) 99813-0038',
    whatsapp: '79998130038',
    businessHours: 'Segunda a Domingo: 18h às 01h'
  });

      // Verificar estado de autenticação ao montar o componente
    useEffect(() => {
      const checkAuth = async () => {
        try {
          console.log('🔍 Iniciando verificação de autenticação...');
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          
          if (userError) {
            console.error('❌ Erro ao obter usuário:', userError);
            setCurrentUser(null);
            setIsLoggedIn(false);
            return;
          }
          
          if (user) {
            console.log('✅ Usuário autenticado encontrado:', user.email);
            setCurrentUser(user);
            setIsLoggedIn(true);
          } else {
            console.log('🔍 Nenhum usuário autenticado encontrado');
            setCurrentUser(null);
            setIsLoggedIn(false);
          }
        } catch (error) {
          console.error('💥 Erro completo ao verificar autenticação:', error);
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      };

      checkAuth();

    // Escutar mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 Evento de autenticação:', event, session?.user?.email);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ Usuário fez login com sucesso');
        setCurrentUser(session.user);
        setIsLoggedIn(true);
        setActiveSection('dashboard');
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 Usuário deslogado');
        setCurrentUser(null);
        setIsLoggedIn(false);
        setActiveSection('dashboard');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Carregar dados do Supabase quando o painel for aberto
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      loadDataFromSupabase();
    }
  }, [isOpen, isLoggedIn]);

  const loadDataFromSupabase = async () => {
    try {
      // Carregar categorias
      const { data: cats, error: catsError } = await supabase
        .from('categories')
        .select('id, name, icon, description, sort_order, active')
        .eq('active', true)
        .order('sort_order');

      if (catsError) throw catsError;
      if (cats && cats.length > 0) {
        const mappedCategories: Category[] = cats.map((cat: any) => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon || '📦',
          description: cat.description
        }));
        setCategorias(mappedCategories);
      }

      // Carregar produtos
      const { data: prods, error: prodsError } = await supabase
        .from('products')
        .select('id, name, description, price, image, category_id, available')
        .eq('available', true);

      if (prodsError) throw prodsError;
      if (prods && prods.length > 0) {
        const mappedProducts: Product[] = prods.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || '',
          price: Number(p.price),
          image: p.image || '',
          category: p.category_id || 'all',
          available: p.available
        }));
        setProdutos(mappedProducts);
      }

      // Carregar áreas de entrega
      const { data: areas, error: areasError } = await supabase
        .from('delivery_areas')
        .select('id, name, fee, active')
        .order('name');

      if (areasError) throw areasError;
      if (areas && areas.length > 0) {
        const mappedAreas: DeliveryArea[] = areas.map((area: any) => ({
          id: area.id,
          name: area.name,
          fee: area.fee,
          active: area.active
        }));
        setDeliveryAreas(mappedAreas);
      }

      // Carregar configurações da empresa
      const { data: companySettings, error: settingsError } = await supabase
        .from('company_settings')
        .select('*')
        .limit(1)
        .single();

      if (settingsError) throw settingsError;
      if (companySettings) {
        const mappedSettings: Settings = {
          companyName: companySettings.company_name,
          welcomeTitle: companySettings.welcome_title,
          subtitle: companySettings.subtitle,
          address: companySettings.address,
          phone: companySettings.phone,
          whatsapp: companySettings.whatsapp,
          businessHours: companySettings.business_hours,
          freeDeliveryMinimum: companySettings.free_delivery_minimum,
          deliveryTime: companySettings.delivery_time
        };
        setSettings(mappedSettings);
      }
    } catch (error) {
      console.error('Erro ao carregar dados do Supabase:', error);
    }
  };

  // Sincronizar mudanças com o sistema principal
  useEffect(() => {
    onUpdateProducts(produtos);
  }, [produtos, onUpdateProducts]);

  useEffect(() => {
    onUpdateCategories(categorias);
  }, [categorias, onUpdateCategories]);

  // Funções para atualizar dados administrativos
  const handleUpdateDeliveryAreas = (areas: DeliveryArea[]) => {
    setDeliveryAreas(areas);
  };

  const handleUpdateSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    onUpdateSettings(newSettings);
  };

  const handleLogin = () => {
    // Esta função é chamada pelo AdminLogin após autenticação bem-sucedida
    console.log('🔐 Login bem-sucedido - redirecionando para dashboard...');
    setLoginLoading(false); // Limpar loading do AdminLogin
    
    // Forçar verificação imediata do estado de autenticação
    const checkAuthImmediately = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          console.log('✅ Verificação imediata bem-sucedida, redirecionando...');
          setCurrentUser(user);
          setIsLoggedIn(true);
          setActiveSection('dashboard');
        }
      } catch (error) {
        console.error('❌ Erro na verificação imediata:', error);
      }
    };
    checkAuthImmediately();
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
      setIsLoggedIn(false);
      setActiveSection('dashboard');
      onClose();
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const stats = {
    categorias: categorias.length,
    produtos: produtos.length,
    entrega: deliveryAreas.filter(area => area.active).length,
    pagamentos: paymentMethods.filter(method => method.active).length
  };

  if (!isOpen) return null;

  if (!isLoggedIn) {
    return <AdminLogin 
      onLogin={handleLogin} 
      onClose={onClose} 
      isLoading={loginLoading}
      setIsLoading={setLoginLoading}
    />;
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'dashboard':
        return <AdminDashboard stats={stats} />;
      case 'categorias':
        return <CategoriasManager categorias={categorias} onUpdateCategorias={setCategorias} />;
      case 'produtos':
        return <ProdutosManager produtos={produtos} categorias={categorias} onUpdateProdutos={setProdutos} />;
      case 'pedidos':
        return <PedidosManager />;
      case 'adicionais':
        return <AdicionaisManager />;
      case 'entrega':
        return <EntregaManager deliveryAreas={deliveryAreas} onUpdateDeliveryAreas={handleUpdateDeliveryAreas} />;
      case 'pagamentos':
        return <PagamentosManager paymentMethods={paymentMethods} onUpdatePaymentMethods={setPaymentMethods} />;
      case 'configuracoes':
        return <ConfiguracoesManager settings={settings} onUpdateSettings={handleUpdateSettings} />;
      default:
        return <AdminDashboard stats={stats} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-auto">
      <AdminLayout
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        onLogout={handleLogout}
        currentUser={currentUser}
        companyName={settings.companyName}
      >
        {renderActiveSection()}
      </AdminLayout>
    </div>
  );
};