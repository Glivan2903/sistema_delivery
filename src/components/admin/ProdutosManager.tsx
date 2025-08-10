import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Package, Eye, EyeOff } from 'lucide-react';
import { Product, Category } from '@/types/product';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ProdutosManagerProps {
  produtos: Product[];
  categorias: Category[];
  onUpdateProdutos: (produtos: Product[]) => void;
}

export const ProdutosManager = ({ produtos, categorias, onUpdateProdutos }: ProdutosManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    image: '',
    available: true,
    hasAddons: false
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [filtroCategoria, setFiltroCategoria] = useState('all');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      image: '',
      available: true,
      hasAddons: false
    });
    setImageFile(null);
  };

  const handleAddProduct = async () => {
    if (!formData.name.trim() || !formData.description.trim() || !formData.price || !formData.category) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(formData.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Erro",
        description: "Preço deve ser um valor válido maior que zero.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Inserir no banco de dados
      const { data, error } = await supabase
        .from('products')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price,
          category_id: formData.category,
          image: formData.image || '/placeholder.svg',
          available: formData.available,
          has_addons: formData.hasAddons
        })
        .select()
        .single();

      if (error) throw error;

      const newProduct: Product = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        price: data.price,
        category: data.category_id,
        image: data.image || '/placeholder.svg',
        available: data.available,
        hasAddons: data.has_addons,
        preparationTime: 20,
        rating: 0
      };

      onUpdateProdutos([...produtos, newProduct]);
      resetForm();
      setIsAddDialogOpen(false);
      
      toast({
        title: "Produto adicionado!",
        description: `O produto "${newProduct.name}" foi criado com sucesso no banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao adicionar produto:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProduct = async () => {
    if (!editingProduct || !formData.name.trim() || !formData.description.trim() || !formData.price || !formData.category) {
      toast({
        title: "Erro",
        description: "Todos os campos são obrigatórios.",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(formData.price.replace(',', '.'));
    if (isNaN(price) || price <= 0) {
      toast({
        title: "Erro",
        description: "Preço deve ser um valor válido maior que zero.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('products')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim(),
          price: price,
          category_id: formData.category,
          image: formData.image || editingProduct.image,
          available: formData.available,
          has_addons: formData.hasAddons
        })
        .eq('id', editingProduct.id);

      if (error) throw error;

      const updatedProdutos = produtos.map(produto =>
        produto.id === editingProduct.id
          ? {
              ...produto,
              name: formData.name.trim(),
              description: formData.description.trim(),
              price: price,
              category: formData.category,
              image: formData.image || produto.image,
              available: formData.available,
              hasAddons: formData.hasAddons
            }
          : produto
      );

      onUpdateProdutos(updatedProdutos);
      setEditingProduct(null);
      resetForm();
      
      toast({
        title: "Produto atualizado!",
        description: `O produto "${formData.name}" foi atualizado com sucesso no banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao atualizar produto:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    const productToDelete = produtos.find(p => p.id === productId);
    
    setIsLoading(true);
    try {
      // Deletar do banco de dados
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      const updatedProdutos = produtos.filter(p => p.id !== productId);
      onUpdateProdutos(updatedProdutos);
      
      toast({
        title: "Produto removido!",
        description: `O produto "${productToDelete?.name}" foi excluído do banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao deletar produto:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir do banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProductAvailability = async (productId: string) => {
    const product = produtos.find(p => p.id === productId);
    if (!product) return;

    const newStatus = !product.available;
    
    setIsLoading(true);
    try {
      // Atualizar status no banco de dados
      const { error } = await supabase
        .from('products')
        .update({ available: newStatus })
        .eq('id', productId);

      if (error) throw error;

      const updatedProdutos = produtos.map(produto =>
        produto.id === productId
          ? { ...produto, available: newStatus }
          : produto
      );
      
      onUpdateProdutos(updatedProdutos);
      
      toast({
        title: newStatus ? "Produto ativado!" : "Produto desativado!",
        description: `O produto "${product.name}" foi ${newStatus ? 'ativado' : 'desativado'} no banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao alterar status do produto:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const produtosFiltrados = filtroCategoria === 'all' 
    ? produtos 
    : produtos.filter(p => p.category === filtroCategoria);

  const getCategoryName = (categoryId: string) => {
    return categorias.find(cat => cat.id === categoryId)?.name || categoryId;
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-brown">Gerenciar Produtos</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Controle todo o seu cardápio</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-brown-dark sm:h-10" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Produto</DialogTitle>
              <DialogDescription>
                Preencha as informações do novo produto do cardápio.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label htmlFor="productName">Nome do Produto</Label>
                  <Input
                    id="productName"
                    placeholder="Ex: X-Bacon Especial"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="productPrice">Preço (R$)</Label>
                  <Input
                    id="productPrice"
                    placeholder="Ex: 15,50"
                    value={formData.price}
                    onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="productCategory">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias.map((categoria) => (
                      <SelectItem key={categoria.id} value={categoria.id}>
                        {categoria.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="productDescription">Descrição</Label>
                <Textarea
                  id="productDescription"
                  placeholder="Descreva os ingredientes e características do produto..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="productImage">Imagem do Produto</Label>
                <Input
                  id="productImage"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setImageFile(file);
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setFormData(prev => ({ ...prev, image: reader.result as string }));
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-brown/10 file:text-brand-brown hover:file:bg-brand-brown/20"
                />
                {formData.image && (
                  <div className="mt-2">
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-24 h-24 object-cover rounded-lg border"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="productAvailable"
                  checked={formData.available}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
                />
                <Label htmlFor="productAvailable">Produto disponível</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="productHasAddons"
                  checked={formData.hasAddons}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasAddons: checked }))}
                />
                <Label htmlFor="productHasAddons">Possui adicionais</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-brand-brown hover:bg-brand-brown-dark" onClick={handleAddProduct} disabled={isLoading}>
                  {isLoading ? 'Adicionando...' : 'Adicionar Produto'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtro por categoria */}
      <div className="flex items-center space-x-4">
        <Label>Filtrar por categoria:</Label>
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categorias.map((categoria) => (
              <SelectItem key={categoria.id} value={categoria.id}>
                {categoria.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {produtosFiltrados.map((produto) => (
          <Card key={produto.id} className={!produto.available ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="w-5 h-5 text-brand-brown" />
                  <span className="line-clamp-1">{produto.name}</span>
                </CardTitle>
                <div className="flex items-center space-x-1">
                  {produto.available ? (
                    <Eye className="w-4 h-4 text-green-600" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-red-600" />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{getCategoryName(produto.category)}</Badge>
                  {produto.hasAddons && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      + Adicionais
                    </Badge>
                  )}
                </div>
                <span className="text-lg font-bold text-brand-brown">
                  R$ {produto.price.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="line-clamp-2 mb-4">
                {produto.description}
              </CardDescription>
              
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm">Disponível:</Label>
                <Switch
                  checked={produto.available}
                  onCheckedChange={() => toggleProductAvailability(produto.id)}
                  disabled={isLoading}
                />
              </div>

              <div className="flex gap-2">
                <Dialog open={editingProduct?.id === produto.id} onOpenChange={(open) => {
                  if (open) {
                    setEditingProduct(produto);
                    setFormData({
                      name: produto.name,
                      description: produto.description,
                      price: produto.price.toString().replace('.', ','),
                      category: produto.category,
                      image: produto.image,
                      available: produto.available,
                      hasAddons: produto.hasAddons || false
                    });
                  } else {
                    setEditingProduct(null);
                    resetForm();
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Editar Produto</DialogTitle>
                      <DialogDescription>
                        Altere as informações do produto "{produto.name}".
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="editProductName">Nome do Produto</Label>
                          <Input
                            id="editProductName"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="editProductPrice">Preço (R$)</Label>
                          <Input
                            id="editProductPrice"
                            value={formData.price}
                            onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="editProductCategory">Categoria</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map((categoria) => (
                              <SelectItem key={categoria.id} value={categoria.id}>
                                {categoria.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="editProductDescription">Descrição</Label>
                        <Textarea
                          id="editProductDescription"
                          value={formData.description}
                          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="editProductImage">Imagem do Produto</Label>
                        <Input
                          id="editProductImage"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setImageFile(file);
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData(prev => ({ ...prev, image: reader.result as string }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-brown/10 file:text-brand-brown hover:file:bg-brand-brown/20"
                        />
                        {formData.image && (
                          <div className="mt-2">
                            <img 
                              src={formData.image} 
                              alt="Preview" 
                              className="w-24 h-24 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="editProductAvailable"
                          checked={formData.available}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, available: checked }))}
                        />
                        <Label htmlFor="editProductAvailable">Produto disponível</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="editProductHasAddons"
                          checked={formData.hasAddons}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, hasAddons: checked }))}
                        />
                        <Label htmlFor="editProductHasAddons">Possui adicionais</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setEditingProduct(null)}>
                          Cancelar
                        </Button>
                        <Button className="flex-1 bg-brand-brown hover:bg-brand-brown-dark" onClick={handleEditProduct} disabled={isLoading}>
                          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive border-destructive/50 hover:border-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir Produto</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir o produto "{produto.name}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => handleDeleteProduct(produto.id)}
                        disabled={isLoading}
                      >
                        {isLoading ? 'Excluindo...' : 'Excluir'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {produtosFiltrados.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              {filtroCategoria === 'all' ? 'Nenhum produto cadastrado' : 'Nenhum produto nesta categoria'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {filtroCategoria === 'all' ? 'Clique em "Novo Produto" para começar' : 'Selecione outra categoria ou adicione produtos'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};