import { Button } from '@/components/ui/button';
import heroBanner from '@/assets/hero-banner.jpg';

interface HeroProps {
  onExploreMenu: () => void;
  companyName?: string;
  welcomeTitle?: string;
  subtitle?: string;
  freeDeliveryMinimum?: number;
}

export const Hero = ({ 
  onExploreMenu, 
  companyName = 'Marrom Lanches', 
  welcomeTitle = 'Bem-vindo ao', 
  subtitle = 'Hambúrguers artesanais irresistíveis, entregues na sua porta com todo carinho',
  freeDeliveryMinimum = 35
}: HeroProps) => {
  return (
    <section className="relative h-[400px] md:h-[500px] overflow-hidden rounded-lg mx-4 my-6 shadow-warm">
      <div 
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroBanner})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/30" />
      </div>
      
      <div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-6">
          <div className="max-w-2xl text-white">
            <h2 className="text-4xl md:text-6xl font-bold mb-4 animate-fade-in">
              {welcomeTitle}
              <span className="block text-brand-gold">{companyName}</span>
            </h2>
            <p className="text-xl md:text-2xl mb-8 animate-fade-in">{subtitle}</p>
            
            <div className="flex flex-col sm:flex-row gap-4 animate-scale-in">
              <Button 
                size="lg" 
                variant="gold"
                onClick={onExploreMenu}
                className="text-lg px-8 py-3"
              >
                Faça seu pedido agora
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Badge */}
      <div className="absolute top-4 right-4 bg-gradient-gold text-foreground px-4 py-2 rounded-full font-semibold animate-bounce-light">
        🍔 Entrega GRÁTIS acima de R$ {Number(freeDeliveryMinimum).toFixed(2).replace('.', ',')}!
      </div>
    </section>
  );
};