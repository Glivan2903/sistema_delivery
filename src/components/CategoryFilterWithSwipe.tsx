import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Product, Category } from '@/types/product';
import { ProductGrid } from '@/components/ProductGrid';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryFilterWithSwipeProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  products: Product[];
  onAddToCart: (product: Product) => void;
  isEstablishmentOpen?: boolean;
}

export const CategoryFilterWithSwipe = ({ 
  selectedCategory, 
  onCategoryChange, 
  categories, 
  products,
  onAddToCart,
  isEstablishmentOpen = true
}: CategoryFilterWithSwipeProps) => {
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const allCategories = [{ id: 'all', name: 'Todos', icon: '🍽️' }, ...categories];
  const currentIndex = allCategories.findIndex(cat => cat.id === selectedCategory);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < allCategories.length - 1) {
      navigateToCategory(currentIndex + 1);
    }
    if (isRightSwipe && currentIndex > 0) {
      navigateToCategory(currentIndex - 1);
    }
  };

  const navigateToCategory = useCallback((index: number) => {
    setIsTransitioning(true);
    onCategoryChange(allCategories[index].id);
    setTimeout(() => setIsTransitioning(false), 300);
  }, [allCategories, onCategoryChange]);

  const scrollToCategory = (categoryId: string) => {
    const button = document.querySelector(`[data-category="${categoryId}"]`);
    if (button && scrollRef.current) {
      button.scrollIntoView({ behavior: 'smooth', inline: 'center' });
    }
  };

  useEffect(() => {
    scrollToCategory(selectedCategory);
  }, [selectedCategory]);

  const filteredProducts = products.filter(product => 
    selectedCategory === 'all' || product.category === selectedCategory
  );

  return (
    <div className="bg-background sticky top-[88px] z-40 border-b border-border">
      <div className="container mx-auto px-4 py-4">
        {/* Categories Header with Navigation */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-brand-brown">Categorias</h3>
          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => currentIndex > 0 && navigateToCategory(currentIndex - 1)}
              disabled={currentIndex <= 0}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {currentIndex + 1}/{allCategories.length}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => currentIndex < allCategories.length - 1 && navigateToCategory(currentIndex + 1)}
              disabled={currentIndex >= allCategories.length - 1}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Scrollable Categories */}
        <div 
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide"
        >
          {allCategories.map((category) => (
            <Button
              key={category.id}
              data-category={category.id}
              variant={selectedCategory === category.id ? 'default' : 'warm'}
              onClick={() => onCategoryChange(category.id)}
              className="whitespace-nowrap flex-shrink-0"
            >
              {category.icon} {category.name}
            </Button>
          ))}
        </div>

        {/* Swipe Indicator */}
        <div className="flex justify-center mt-3 md:hidden">
          <div className="flex gap-1">
            {allCategories.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-brand-brown' 
                    : 'bg-brand-brown/20'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Products Section with Swipe */}
      <div 
        className="md:hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="container mx-auto px-4 py-4">
          <div className={`transition-all duration-300 ${isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}>
            <ProductGrid 
              products={filteredProducts}
              onAddToCart={onAddToCart}
              isEstablishmentOpen={isEstablishmentOpen}
            />
          </div>
        </div>
        
        {/* Swipe hint */}
        {filteredProducts.length > 0 && (
          <div className="text-center pb-4">
            <p className="text-xs text-muted-foreground">
              👈 Deslize para navegar entre categorias 👉
            </p>
          </div>
        )}
      </div>
    </div>
  );
};