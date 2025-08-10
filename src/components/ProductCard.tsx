import { Star, Clock, Plus } from 'lucide-react';
import { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  isEstablishmentOpen?: boolean;
}

export const ProductCard = ({ product, onAddToCart, isEstablishmentOpen = true }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  return (
    <Card className="group hover:shadow-warm transition-all duration-300 hover:-translate-y-1 overflow-hidden">
      <div className="relative">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-28 sm:h-32 lg:h-36 object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {!product.available && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-semibold bg-destructive px-3 py-1 rounded text-xs sm:text-sm">
              Indisponível
            </span>
          </div>
        )}
      </div>
      
      <CardContent className="p-2.5 sm:p-3">
        <div className="mb-1.5">
          <h3 className="font-semibold text-sm sm:text-base text-brand-brown mb-1 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {product.description}
          </p>
        </div>

        {product.ingredients && (
          <div className="mb-1.5 hidden sm:block">
            <p className="text-xs text-muted-foreground line-clamp-1">
              {product.ingredients.join(', ')}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3 mb-1.5 text-xs text-muted-foreground">
          {product.rating && (
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-brand-gold text-brand-gold" />
              <span>{product.rating}</span>
            </div>
          )}
          {product.preparationTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{product.preparationTime} min</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-base sm:text-lg font-bold text-brand-brown">
            {formatPrice(product.price)}
          </span>
          {isEstablishmentOpen && (
            <Button
              variant="gold"
              size="sm"
              onClick={() => onAddToCart(product)}
              disabled={!product.available}
              className="gap-1 text-xs px-2"
            >
              <Plus className="w-3 h-3" />
              <span className="hidden sm:inline">Adicionar</span>
              <span className="sm:hidden">+</span>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};