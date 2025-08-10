import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Tag } from 'lucide-react';
import { Category } from '@/types/product';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface CategoriasManagerProps {
  categorias: Category[];
  onUpdateCategorias: (categorias: Category[]) => void;
}

export const CategoriasManager = ({ categorias, onUpdateCategorias }: CategoriasManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState('📦');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (categorias.some(cat => cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      toast({
        title: "Erro",
        description: "Já existe uma categoria com este nome.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Inserir no Supabase
      const { data, error } = await supabase
        .from('categories')
        .insert({
          name: newCategoryName.trim(),
          icon: selectedEmoji,
          description: newCategoryDescription.trim() || null,
          sort_order: categorias.length + 1,
          active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Atualizar estado local
      const newCategory: Category = {
        id: data.id,
        name: data.name,
        icon: data.icon || '📦',
        description: data.description || undefined
      };

      onUpdateCategorias([...categorias, newCategory]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setSelectedEmoji('📦');
      setIsAddDialogOpen(false);
      
      toast({
        title: "Categoria adicionada!",
        description: `A categoria "${newCategory.name}" foi criada com sucesso no banco de dados.`
      });
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar categoria no banco de dados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da categoria é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (categorias.some(cat => cat.id !== editingCategory.id && cat.name.toLowerCase() === newCategoryName.toLowerCase())) {
      toast({
        title: "Erro",
        description: "Já existe uma categoria com este nome.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Atualizar no Supabase
      const { error } = await supabase
        .from('categories')
        .update({
          name: newCategoryName.trim(),
          icon: selectedEmoji,
          description: newCategoryDescription.trim() || null
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      // Atualizar estado local
      const updatedCategorias = categorias.map(cat =>
        cat.id === editingCategory.id
          ? { ...cat, name: newCategoryName.trim(), icon: selectedEmoji, description: newCategoryDescription.trim() || undefined }
          : cat
      );

      onUpdateCategorias(updatedCategorias);
      setEditingCategory(null);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setSelectedEmoji('📦');
      
      toast({
        title: "Categoria atualizada!",
        description: `A categoria foi atualizada com sucesso no banco de dados.`
      });
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar categoria no banco de dados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const categoryToDelete = categorias.find(cat => cat.id === categoryId);
    
    setIsLoading(true);
    try {
      // Deletar no Supabase (soft delete - marcar como inativa)
      const { error } = await supabase
        .from('categories')
        .update({ active: false })
        .eq('id', categoryId);

      if (error) throw error;

      // Atualizar estado local
      const updatedCategorias = categorias.filter(cat => cat.id !== categoryId);
      onUpdateCategorias(updatedCategorias);
      
      toast({
        title: "Categoria removida!",
        description: `A categoria "${categoryToDelete?.name}" foi desativada com sucesso.`
      });
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      toast({
        title: "Erro",
        description: "Falha ao deletar categoria no banco de dados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-brand-brown">Gerenciar Categorias</h2>
          <p className="text-muted-foreground">Organize seus produtos por categorias</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-brown-dark">
              <Plus className="w-4 h-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Nova Categoria</DialogTitle>
              <DialogDescription>
                Digite o nome da nova categoria de produtos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="categoryName">Nome da Categoria</Label>
                <Input
                  id="categoryName"
                  placeholder="Ex: Hambúrguers, Bebidas, Sobremesas..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="categoryDescription">Descrição (opcional)</Label>
                <Input
                  id="categoryDescription"
                  placeholder="Ex: Deliciosos hambúrguers artesanais"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Emoji da Categoria</Label>
                <div className="grid grid-cols-8 gap-2 p-2 border rounded-md bg-muted/30">
                  {['🍔', '🍟', '🥤', '🍕', '🌭', '🥪', '🍰', '🧁', '🍦', '☕', '🥘', '🍝', '🥗', '🍻', '🍗', '📦'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`p-2 text-2xl rounded-md hover:bg-brand-brown/20 transition-colors ${
                        selectedEmoji === emoji ? 'bg-brand-brown/30 ring-2 ring-brand-brown' : ''
                      }`}
                      onClick={() => setSelectedEmoji(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Emoji selecionado: <span className="text-lg">{selectedEmoji}</span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-brand-brown hover:bg-brand-brown-dark" 
                  onClick={handleAddCategory}
                  disabled={isLoading}
                >
                  {isLoading ? 'Adicionando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map((categoria) => (
          <Card key={categoria.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="w-5 h-5 text-brand-brown" />
                  <span>{categoria.name}</span>
                </CardTitle>
                <Badge variant="secondary">{categoria.icon}</Badge>
              </div>
              {categoria.description && (
                <CardDescription>{categoria.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Dialog open={editingCategory?.id === categoria.id} onOpenChange={(open) => {
                  if (open) {
                    setEditingCategory(categoria);
                    setNewCategoryName(categoria.name);
                    setNewCategoryDescription(categoria.description || '');
                    setSelectedEmoji(categoria.icon);
                  } else {
                    setEditingCategory(null);
                    setNewCategoryName('');
                    setNewCategoryDescription('');
                    setSelectedEmoji('📦');
                  }
                }}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Edit className="w-4 h-4 mr-1" />
                      Editar
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Editar Categoria</DialogTitle>
                      <DialogDescription>
                        Altere o nome da categoria "{categoria.name}".
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editCategoryName">Nome da Categoria</Label>
                        <Input
                          id="editCategoryName"
                          value={newCategoryName}
                          onChange={(e) => setNewCategoryName(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label htmlFor="editCategoryDescription">Descrição (opcional)</Label>
                        <Input
                          id="editCategoryDescription"
                          placeholder="Ex: Deliciosos hambúrguers artesanais"
                          value={newCategoryDescription}
                          onChange={(e) => setNewCategoryDescription(e.target.value)}
                        />
                      </div>

                      <div>
                        <Label>Emoji da Categoria</Label>
                        <div className="grid grid-cols-8 gap-2 p-2 border rounded-md bg-muted/30">
                          {['🍔', '🍟', '🥤', '🍕', '🌭', '🥪', '🍰', '🧁', '🍦', '☕', '🥘', '🍝', '🥗', '🍻', '🍗', '📦'].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              className={`p-2 text-2xl rounded-md hover:bg-brand-brown/20 transition-colors ${
                                selectedEmoji === emoji ? 'bg-brand-brown/30 ring-2 ring-brand-brown' : ''
                              }`}
                              onClick={() => setSelectedEmoji(emoji)}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          Emoji selecionado: <span className="text-lg">{selectedEmoji}</span>
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setEditingCategory(null)}>
                          Cancelar
                        </Button>
                        <Button 
                          className="flex-1 bg-brand-brown hover:bg-brand-brown-dark" 
                          onClick={handleEditCategory}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Salvando...' : 'Salvar'}
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
                      <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a categoria "{categoria.name}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => handleDeleteCategory(categoria.id)}
                      >
                        Excluir
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {categorias.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Tag className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma categoria cadastrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Nova Categoria" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};