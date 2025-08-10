import { Product } from '@/types/product';
import { ProductCard } from './ProductCard';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  isEstablishmentOpen?: boolean;
}

export const ProductGrid = ({ products, onAddToCart, isEstablishmentOpen = true }: ProductGridProps) => {
  if (products.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">🍔</div>
        <h3 className="text-xl font-semibold text-brand-brown mb-2">
          Nenhum produto encontrado
        </h3>
        <p className="text-muted-foreground">
          Tente selecionar uma categoria diferente
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          isEstablishmentOpen={isEstablishmentOpen}
        />
      ))}
    </div>
  );
};