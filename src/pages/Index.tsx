import { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { CategoryFilter } from '@/components/CategoryFilter';
import { CategoryFilterWithSwipe } from '@/components/CategoryFilterWithSwipe';
import { SearchBar } from '@/components/SearchBar';
import { ProductGrid } from '@/components/ProductGrid';
import { Cart } from '@/components/Cart';
import { AddToCartModal } from '@/components/AddToCartModal';
import { AdminPanel } from '@/components/admin/AdminPanel';
import { useCart } from '@/hooks/useCart';
import { products as initialProducts, categories as initialCategories } from '@/data/products';
import { Product, Category, SelectedExtra } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Settings, ShoppingCart, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

// Interface para as configurações da empresa
interface CompanySettings {
  companyName: string;
  subtitle: string;
  welcomeTitle: string;
  freeDeliveryMinimum: number;
  deliveryTime: string;
  address: string;
  phone: string;
  whatsapp: string;
  businessHours: string;
  logoUrl?: string | null;
}

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAddToCartModalOpen, setIsAddToCartModalOpen] = useState(false);
  const [isEstablishment, setIsEstablishment] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isEstablishmentOpen, setIsEstablishmentOpen] = useState(true);
  const [showClosedDialog, setShowClosedDialog] = useState(false);
  
  // Estado para configurações da empresa
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    companyName: 'Marrom Lanches',
    subtitle: 'O melhor da cidade, direto na sua casa!',
    welcomeTitle: 'Bem-vindo ao',
    freeDeliveryMinimum: 35,
    deliveryTime: '30-45 min',
    address: 'Av. Serafim Bonfim s/n',
    phone: '(79) 99813-0038',
    whatsapp: '79998130038',
    businessHours: 'Segunda a Domingo: 18h às 01h',
    logoUrl: null
  });
  
  const {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    getTotalItems,
    clearCart
  } = useCart();

  // Carregar dados do Supabase
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carregar categorias
        const { data: cats } = await supabase
          .from('categories')
          .select('id, name, icon, description, sort_order, active')
          .eq('active', true)
          .order('sort_order');
        if (cats && cats.length) {
          setCategories(cats as any as Category[]);
        }

        // Carregar produtos
        const { data: prods } = await supabase
          .from('products')
          .select('id, name, description, price, image, category_id, available, has_addons')
          .eq('available', true);
        if (prods && prods.length) {
          const mapped: Product[] = (prods as any[]).map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description || '',
            price: Number(p.price),
            image: p.image || '',
            category: p.category_id,
            available: p.available,
            hasAddons: p.has_addons || false
          }));
          setProducts(mapped);
        }

        // Carregar configurações da empresa
        const { data: settings, error: settingsError } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .single();

        if (settingsError) {
          console.error('Erro ao carregar configurações:', settingsError);
        }

        if (settings) {
          console.log('Configurações carregadas:', settings);
          
          setCompanySettings({
            companyName: settings.company_name || 'Marrom Lanches',
            subtitle: settings.subtitle || 'O melhor da cidade, direto na sua casa!',
            welcomeTitle: settings.welcome_title || 'Bem-vindo ao',
            freeDeliveryMinimum: settings.free_delivery_minimum || 35,
            deliveryTime: settings.delivery_time || '30-45 min',
            address: settings.address || 'Av. Serafim Bonfim s/n',
            phone: settings.phone || '(79) 99813-0038',
            whatsapp: settings.whatsapp || '79998130038',
            businessHours: settings.business_hours || 'Segunda a Domingo: 18h às 01h',
            logoUrl: settings.logo_url || null
          });

          // Verificar status do estabelecimento (padrão: true se null/undefined)
          const isOpen = settings.is_open !== false;
          console.log('Status do estabelecimento na página principal:', isOpen, 'Valor original:', settings.is_open);
          setIsEstablishmentOpen(isOpen);
          
          // Mostrar aviso se estiver fechado
          if (!isOpen) {
            console.log('Estabelecimento está fechado, mostrando popup');
            setShowClosedDialog(true);
          }
        } else {
          console.log('Nenhuma configuração encontrada, usando padrão: aberto');
          setIsEstablishmentOpen(true);
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      }
    };

    fetchData();
  }, []);

  // Escutar mudanças no status do estabelecimento
  useEffect(() => {
    const handleStatusChange = (event: CustomEvent) => {
      setIsEstablishmentOpen(event.detail.isOpen);
      if (!event.detail.isOpen) {
        setShowClosedDialog(true);
      }
    };

    window.addEventListener('establishment-status-changed', handleStatusChange as EventListener);
    
    return () => {
      window.removeEventListener('establishment-status-changed', handleStatusChange as EventListener);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm, products]);

  const handleAddToCart = (product: Product) => {
    if (!isEstablishmentOpen) {
      setShowClosedDialog(true);
      return;
    }
    setSelectedProduct(product);
    setIsAddToCartModalOpen(true);
  };

  const handleConfirmAddToCart = (product: Product, quantity: number, observations?: string, selectedExtras?: SelectedExtra[]) => {
    addToCart(product, quantity, observations, selectedExtras);
  };

  const handleCheckout = (orderData: any) => {
    console.log('Pedido finalizado:', orderData);
    // Limpar carrinho após o pedido
    setTimeout(() => {
      clearCart();
      setIsCartOpen(false);
    }, 2000);
  };

  const scrollToMenu = () => {
    const menuSection = document.getElementById('menu-section');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-warm">
      <Header 
        cartItemsCount={getTotalItems()}
        onCartClick={() => setIsCartOpen(true)}
        onAdminClick={() => setIsAdminOpen(true)}
        isEstablishment={isEstablishment}
        onToggleMode={setIsEstablishment}
        settings={companySettings}
      />
      
      <Hero 
        onExploreMenu={scrollToMenu}
        companyName={companySettings.companyName}
        welcomeTitle={companySettings.welcomeTitle}
        subtitle={companySettings.subtitle}
        freeDeliveryMinimum={companySettings.freeDeliveryMinimum}
      />

      {/* Banner de estabelecimento fechado */}
      {!isEstablishmentOpen && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                <strong>Estabelecimento Fechado:</strong> Não estamos aceitando pedidos no momento.
              </p>
            </div>
          </div>
        </div>
      )}


      
      {/* Desktop Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
        categories={categories}
        products={filteredProducts}
      />

      {/* Mobile Category Filter with Swipe */}
      <div className="md:hidden">
        <CategoryFilterWithSwipe
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          categories={categories}
          products={filteredProducts}
          onAddToCart={handleAddToCart}
          isEstablishmentOpen={isEstablishmentOpen}
        />
      </div>

      {/* Floating Cart Button */}
      <div className="fixed bottom-6 right-6 z-40 md:hidden">
        <Button
          variant="gold"
          size="lg"
          onClick={() => setIsCartOpen(true)}
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        >
          <ShoppingCart className="w-6 h-6" />
          {getTotalItems() > 0 && (
            <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-6 h-6 flex items-center justify-center">
              {getTotalItems()}
            </span>
          )}
        </Button>
      </div>

      {/* Desktop Menu Section */}
      <main id="menu-section" className="container mx-auto px-4 py-8 hidden md:block">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-brand-brown mb-2">
              Nosso Cardápio
            </h2>
            <p className="text-muted-foreground">
              Escolha entre nossos deliciosos hambúrguers artesanais
            </p>
          </div>
          <SearchBar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>

        <ProductGrid 
          products={filteredProducts}
          onAddToCart={handleAddToCart}
          isEstablishmentOpen={isEstablishmentOpen}
        />
      </main>

      {/* Mobile Search Bar */}
      <div className="md:hidden bg-background border-b border-border sticky top-[88px] z-39">
        <div className="container mx-auto px-4 py-3">
          <SearchBar 
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
          />
        </div>
      </div>

      <footer className="bg-brand-brown text-primary-foreground py-4 md:py-12 mt-16 relative">
        <div className="container mx-auto px-4">
          {/* Layout Mobile: Elementos lado a lado */}
          <div className="md:hidden grid grid-cols-3 gap-3">
            {/* Empresa - Mobile */}
            <div className="text-center">
              <h3 className="text-sm font-bold mb-1">{companySettings.companyName}</h3>
              <p className="text-xs text-primary-foreground/80 leading-tight">{companySettings.subtitle}</p>
            </div>

            {/* Contato - Mobile */}
            <div className="text-center">
              <h4 className="text-xs font-semibold mb-1">Contato</h4>
              <div className="space-y-1 text-xs">
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-sm">📞</span>
                  <span className="font-medium text-xs">{companySettings.phone}</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-sm">💬</span>
                  <span className="font-medium text-xs">WhatsApp</span>
                </div>
              </div>
            </div>

            {/* Localização - Mobile */}
            <div className="text-center">
              <h4 className="text-xs font-semibold mb-1">Localização</h4>
              <div className="space-y-1 text-xs">
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-sm">📍</span>
                  <span className="font-medium text-xs leading-tight">{companySettings.address}</span>
                </div>
                <div className="flex flex-col items-center space-y-1">
                  <span className="text-sm">⏰</span>
                  <span className="font-medium text-xs leading-tight">{companySettings.businessHours}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Layout Desktop: Mantém o design original */}
          <div className="hidden md:grid md:grid-cols-3 gap-8">
            {/* Informações da Empresa */}
            <div className="text-left">
              <h3 className="text-2xl font-bold mb-4">{companySettings.companyName}</h3>
              <p className="text-base text-primary-foreground/80 leading-relaxed">{companySettings.subtitle}</p>
            </div>

            {/* Contato */}
            <div className="text-left">
              <h4 className="text-xl font-semibold mb-3">Contato</h4>
              <div className="space-y-2 text-base">
                <div className="flex items-center justify-start space-x-2">
                  <span className="text-base">📞</span>
                  <span className="font-medium">{companySettings.phone}</span>
                </div>
                <div className="flex items-center justify-start space-x-2">
                  <span className="text-base">💬</span>
                  <span className="font-medium">WhatsApp para pedidos</span>
                </div>
              </div>
            </div>

            {/* Endereço e Horário */}
            <div className="text-left">
              <h4 className="text-xl font-semibold mb-3">Localização</h4>
              <div className="space-y-2 text-base">
                <div className="flex items-center justify-start space-x-2">
                  <span className="text-base">📍</span>
                  <span className="font-medium">{companySettings.address}</span>
                </div>
                <div className="flex items-center justify-start space-x-2">
                  <span className="text-base">⏰</span>
                  <span className="font-medium">{companySettings.businessHours}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Linha divisória - Apenas no desktop */}
          <div className="hidden md:block border-t border-primary-foreground/20 my-6"></div>

          {/* Informações adicionais - Apenas no desktop */}
          <div className="hidden md:block text-center text-base text-primary-foreground/80">
            <p className="mb-1">© 2024 {companySettings.companyName} - Todos os direitos reservados</p>
            <p className="leading-relaxed">Desenvolvido com ❤️ para conectar você aos melhores sabores</p>
          </div>
        </div>
      </footer>

      <Cart
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        isEstablishment={isEstablishment}
      />

      <AddToCartModal
        product={selectedProduct}
        isOpen={isAddToCartModalOpen}
        onClose={() => setIsAddToCartModalOpen(false)}
        onAddToCart={handleConfirmAddToCart}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onUpdateProducts={setProducts}
        onUpdateCategories={setCategories}
        onUpdateSettings={setCompanySettings}
      />

      {/* Dialog de aviso quando estabelecimento está fechado */}
      <Dialog open={showClosedDialog} onOpenChange={setShowClosedDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Estabelecimento Fechado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              O estabelecimento está temporariamente fechado e não está aceitando pedidos no momento.
            </p>
            <p className="text-sm text-muted-foreground">
              Por favor, tente novamente mais tarde ou entre em contato conosco para verificar nossos horários de funcionamento.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setShowClosedDialog(false)}>
                Entendi
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
