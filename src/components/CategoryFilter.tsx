import { Button } from '@/components/ui/button';
import { Category, Product } from '@/types/product';
import { CategoryFilterWithSwipe } from './CategoryFilterWithSwipe';

interface CategoryFilterProps {
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: Category[];
  products: Product[];
}

export const CategoryFilter = ({ selectedCategory, onCategoryChange, categories, products }: CategoryFilterProps) => {
  return (
    <>
      {/* Desktop Version */}
      <div className="hidden md:block bg-background py-6 sticky top-[88px] z-40 border-b border-border">
        <div className="container mx-auto px-4">
          <h3 className="text-lg font-semibold mb-4 text-brand-brown">Categorias</h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'warm'}
              onClick={() => onCategoryChange('all')}
              className="whitespace-nowrap"
            >
              🍽️ Todos
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'warm'}
                onClick={() => onCategoryChange(category.id)}
                className="whitespace-nowrap"
              >
                {category.icon} {category.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Version with Swipe (this will be handled by the parent) */}
    </>
  );
};