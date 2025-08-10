import { useEffect, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Product, Extra, SelectedExtra } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
interface AddToCartModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number, observations?: string, selectedExtras?: SelectedExtra[]) => void;
}

export const AddToCartModal = ({
  product,
  isOpen,
  onClose,
  onAddToCart
}: AddToCartModalProps) => {
  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');
  const [extras, setExtras] = useState<Extra[]>([]);
  const [selectedExtrasMap, setSelectedExtrasMap] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isOpen) return;
    const fetchExtras = async () => {
      const { data, error } = await supabase
        .from('extras')
        .select('id, name, price')
        .eq('active', true)
        .order('name');
      if (!error && data) {
        // Ensure numbers
        const parsed = data.map((e: any) => ({ ...e, price: Number(e.price) }));
        setExtras(parsed as Extra[]);
      }
    };
    fetchExtras();
  }, [isOpen]);
  const formatPrice = (price: number) => {
    return price.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity >= 1) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (product) {
      const selectedExtras: SelectedExtra[] = Object.entries(selectedExtrasMap)
        .filter(([, qty]) => qty > 0)
        .map(([id, qty]) => {
          const ex = extras.find(e => e.id === id)!;
          return { id, name: ex.name, price: Number(ex.price), quantity: qty };
        });
      onAddToCart(product, quantity, observations, selectedExtras);
      onClose();
      setQuantity(1);
      setObservations('');
      setSelectedExtrasMap({});
    }
  };

  const handleClose = () => {
    onClose();
    setQuantity(1);
    setObservations('');
    setSelectedExtrasMap({});
  };

  if (!product) return null;

  // Cálculo do total para exibição no rodapé
  const extrasTotalPerUnit = extras.reduce((sum, ex) => sum + ((selectedExtrasMap[ex.id] || 0) * Number(ex.price)), 0);
  const totalValue = (product.price + extrasTotalPerUnit) * quantity;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md w-[92vw] md:w-auto md:max-w-md flex flex-col max-h-[80vh] md:max-h-none">
        <DialogHeader>
          <DialogTitle className="text-brand-brown">
            Adicionar ao Carrinho
          </DialogTitle>
        </DialogHeader>

        {/* Bloco fixo (não rola): imagem, título e quantidade */}
        <div className="space-y-6">
          <div className="flex gap-3">
            <img
              src={product.image}
              alt={product.name}
               className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1">
               <h3 className="font-semibold text-brand-brown text-[15px]">{product.name}</h3>
               <p className="text-xs text-muted-foreground line-clamp-2">
                {product.description}
              </p>
               <p className="font-bold text-brand-brown mt-1 text-[15px]">
                {formatPrice(product.price)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity" className="text-brand-brown font-medium">
              Quantidade
            </Label>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity - 1)}
                disabled={quantity <= 1}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="text-base font-semibold min-w-[2rem] text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>

        </div>

        {/* Área rolável apenas para Adicionais e Observações (mobile) */}
        <div className="flex-1 overflow-y-auto pr-1 -mr-1 space-y-6 md:overflow-visible md:max-h-none mt-4">
          {/* Adicionais - Só mostra se o produto tiver hasAddons = true */}
          {product.hasAddons && (
            <div className="space-y-2">
              <Label className="text-brand-brown font-medium">Adicionais</Label>
              {extras.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum adicional disponível</p>
              ) : (
                <div className="space-y-3">
                  {extras.map((ex) => {
                    const qty = selectedExtrasMap[ex.id] || 0;
                    return (
                    <div key={ex.id} className="flex items-center justify-between border rounded-md p-2">
                        <div>
                          <div className="font-medium text-brand-brown text-[14px]">{ex.name}</div>
                          <div className="text-xs text-muted-foreground">{formatPrice(Number(ex.price))}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setSelectedExtrasMap(prev => ({ ...prev, [ex.id]: Math.max(0, (prev[ex.id] || 0) - 1) }))}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-5 text-center font-semibold text-sm">{qty}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 w-7 p-0"
                            onClick={() => setSelectedExtrasMap(prev => ({ ...prev, [ex.id]: (prev[ex.id] || 0) + 1 }))}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observations" className="text-brand-brown font-medium">
              Observações (opcional)
            </Label>
            <Textarea
              id="observations"
              placeholder="Ex: sem cebola, ponto da carne, etc."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="resize-none"
              rows={3}
            />
          </div>

        </div>

        {/* Rodapé fixo para ações (sempre acessível no mobile) */}
        <div className="mt-auto bg-background pt-3 border-t">
          <div className="flex items-center justify-between gap-3">
            <div className="text-base font-bold text-brand-brown">
              Total: {formatPrice(totalValue)}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleClose}
              >
                Cancelar
              </Button>
              <Button
                variant="gold"
                onClick={handleAddToCart}
                disabled={!product.available}
              >
                Adicionar ao Carrinho
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};