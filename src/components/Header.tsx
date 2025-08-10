import { ShoppingCart, MapPin, Clock, Store, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import marromLogo from '@/assets/marrom-logo.jpg';

interface CompanySettings {
  freeDeliveryMinimum: number;
  deliveryTime: string;
  welcomeTitle: string;
  companyName: string;
  subtitle: string;
  address: string;
  phone: string;
  whatsapp: string;
  businessHours: string;
  logoUrl?: string | null;
}

interface HeaderProps {
  cartItemsCount: number;
  onCartClick: () => void;
  onAdminClick: () => void;
  isEstablishment: boolean;
  onToggleMode: (isEstablishment: boolean) => void;
  settings?: CompanySettings;
}

export const Header = ({ cartItemsCount, onCartClick, onAdminClick, isEstablishment, onToggleMode, settings }: HeaderProps) => {
  const companyName = settings?.companyName || 'Marrom Lanches';
  const subtitle = settings?.subtitle || 'O melhor da cidade, direto na sua casa!';
  const freeDeliveryText = settings?.freeDeliveryMinimum != null
    ? `Entrega grátis acima de R$ ${Number(settings.freeDeliveryMinimum).toFixed(2).replace('.', ',')}`
    : 'Entrega grátis acima de R$ 35';
  const deliveryTimeText = settings?.deliveryTime || '30-45 min';
  const address = settings?.address || 'Av. Serafim Bonfim s/n';
  const phone = settings?.phone || '(79) 99813-0038';
  const businessHours = settings?.businessHours || 'Segunda a Domingo: 18h às 01h';
  const logoUrl = settings?.logoUrl;
  
  return (
    <header className="bg-background border-b border-border shadow-warm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <img 
              src={logoUrl || marromLogo} 
              alt={companyName} 
              className="w-12 h-12 rounded-full object-cover"
            />
            <div>
              <h1 className="text-xl font-bold text-brand-brown">{companyName}</h1>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
          </div>

          {/* Delivery Info */}
          <div className="hidden lg:flex items-center space-x-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <MapPin className="w-4 h-4" />
              <span>{freeDeliveryText}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{deliveryTimeText}</span>
            </div>
          </div>

          {/* Mode Toggle and Actions */}
          <div className="flex items-center gap-2">
            {/* Cliente/Estabelecimento Toggle - SEMPRE VISÍVEL */}
            <div className="flex items-center border rounded-lg p-1 bg-background">
              <Toggle
                pressed={!isEstablishment}
                onPressedChange={(pressed) => onToggleMode(!pressed)}
                variant="outline"
                size="sm"
                className="data-[state=on]:bg-brand-brown data-[state=on]:text-white border-0"
              >
                <MapPin className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">Delivery</span>
              </Toggle>
              <Toggle
                pressed={isEstablishment}
                onPressedChange={(pressed) => onToggleMode(pressed)}
                variant="outline"
                size="sm"
                className="data-[state=on]:bg-brand-brown data-[state=on]:text-white border-0"
              >
                <Store className="w-4 h-4" />
                <span className="hidden lg:inline ml-1">Estabelecimento</span>
              </Toggle>
            </div>

            {/* Admin Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAdminClick}
              className="hidden sm:flex border-brand-brown/20 hover:bg-brand-brown hover:text-white"
            >
              <Settings className="w-4 h-4" />
              <span className="hidden lg:inline ml-1">Admin</span>
            </Button>

            {/* Cart Button - Hidden on mobile (floating button will be shown) */}
            <Button
              variant="gold"
              onClick={onCartClick}
              className="relative hidden md:flex"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden lg:inline ml-1">Carrinho</span>
              {cartItemsCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Button>

            {/* Mobile Admin Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={onAdminClick}
              className="sm:hidden border-brand-brown/20"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};