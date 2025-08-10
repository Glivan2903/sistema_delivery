import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, CreditCard, DollarSign } from 'lucide-react';
import { PaymentMethod } from './AdminPanel';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PagamentosManagerProps {
  paymentMethods: PaymentMethod[];
  onUpdatePaymentMethods: (methods: PaymentMethod[]) => void;
}

export const PagamentosManager = ({ paymentMethods, onUpdatePaymentMethods }: PagamentosManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      active: true
    });
  };

  const handleAddMethod = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da forma de pagamento é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethods.some(method => method.name.toLowerCase() === formData.name.toLowerCase())) {
      toast({
        title: "Erro",
        description: "Já existe uma forma de pagamento com este nome.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Inserir no banco de dados
      const { data, error } = await supabase
        .from('payment_methods')
        .insert({
          name: formData.name.trim(),
          active: formData.active
        })
        .select()
        .single();

      if (error) throw error;

      const newMethod: PaymentMethod = {
        id: data.id,
        name: data.name,
        active: data.active
      };

      onUpdatePaymentMethods([...paymentMethods, newMethod]);
      resetForm();
      setIsAddDialogOpen(false);
      
      toast({
        title: "Forma de pagamento adicionada!",
        description: `"${newMethod.name}" foi cadastrado com sucesso no banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao adicionar método de pagamento:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditMethod = async () => {
    if (!editingMethod || !formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome da forma de pagamento é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (paymentMethods.some(method => method.id !== editingMethod.id && method.name.toLowerCase() === formData.name.toLowerCase())) {
      toast({
        title: "Erro",
        description: "Já existe uma forma de pagamento com este nome.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('payment_methods')
        .update({
          name: formData.name.trim(),
          active: formData.active
        })
        .eq('id', editingMethod.id);

      if (error) throw error;

      const updatedMethods = paymentMethods.map(method =>
        method.id === editingMethod.id
          ? {
              ...method,
              name: formData.name.trim(),
              active: formData.active
            }
          : method
      );

      onUpdatePaymentMethods(updatedMethods);
      setEditingMethod(null);
      resetForm();
      
      toast({
        title: "Forma de pagamento atualizada!",
        description: `"${formData.name}" foi atualizado com sucesso no banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao atualizar método de pagamento:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    const methodToDelete = paymentMethods.find(method => method.id === methodId);
    
    setIsLoading(true);
    try {
      // Deletar do banco de dados
      const { error } = await supabase
        .from('payment_methods')
        .delete()
        .eq('id', methodId);

      if (error) throw error;

      const updatedMethods = paymentMethods.filter(method => method.id !== methodId);
      onUpdatePaymentMethods(updatedMethods);
      
      toast({
        title: "Forma de pagamento removida!",
        description: `"${methodToDelete?.name}" foi excluído do banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao deletar método de pagamento:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir do banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMethodStatus = async (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return;

    const newStatus = !method.active;
    
    setIsLoading(true);
    try {
      // Atualizar status no banco de dados
      const { error } = await supabase
        .from('payment_methods')
        .update({ active: newStatus })
        .eq('id', methodId);

      if (error) throw error;

      const updatedMethods = paymentMethods.map(m =>
        m.id === methodId
          ? { ...m, active: newStatus }
          : m
      );
      
      onUpdatePaymentMethods(updatedMethods);
      
      toast({
        title: newStatus ? "Método ativado!" : "Método desativado!",
        description: `"${method.name}" foi ${newStatus ? 'ativado' : 'desativado'} no banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao alterar status do método de pagamento:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPaymentIcon = (name: string) => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes('pix')) return '📱';
    if (lowerName.includes('cartão') || lowerName.includes('cartao')) return '💳';
    if (lowerName.includes('dinheiro')) return '💵';
    if (lowerName.includes('vale')) return '🎫';
    return '💰';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-brand-brown">Formas de Pagamento</h2>
          <p className="text-muted-foreground">Configure os métodos de pagamento aceitos</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-brown-dark">
              <Plus className="w-4 h-4 mr-2" />
              Nova Forma
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Forma de Pagamento</DialogTitle>
              <DialogDescription>
                Cadastre um novo método de pagamento aceito pela lanchonete.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="paymentName">Nome da Forma de Pagamento</Label>
                <Input
                  id="paymentName"
                  placeholder="Ex: PIX, Cartão de Crédito, Vale Alimentação..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="paymentActive"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="paymentActive">Aceitar este pagamento</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-brand-brown hover:bg-brand-brown-dark" onClick={handleAddMethod}>
                  Adicionar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paymentMethods.map((method) => (
          <Card key={method.id} className={!method.active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-brand-brown" />
                  <span>{method.name}</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <span className="text-lg">{getPaymentIcon(method.name)}</span>
                  <Badge variant={method.active ? "default" : "secondary"}>
                    {method.active ? "Aceito" : "Desabilitado"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm">Aceitar:</Label>
                <Switch
                  checked={method.active}
                  onCheckedChange={() => toggleMethodStatus(method.id)}
                />
              </div>

              <div className="flex gap-2">
                <Dialog open={editingMethod?.id === method.id} onOpenChange={(open) => {
                  if (open) {
                    setEditingMethod(method);
                    setFormData({
                      name: method.name,
                      active: method.active
                    });
                  } else {
                    setEditingMethod(null);
                    resetForm();
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
                      <DialogTitle>Editar Forma de Pagamento</DialogTitle>
                      <DialogDescription>
                        Altere as informações de "{method.name}".
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editPaymentName">Nome da Forma de Pagamento</Label>
                        <Input
                          id="editPaymentName"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="editPaymentActive"
                          checked={formData.active}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                        />
                        <Label htmlFor="editPaymentActive">Aceitar este pagamento</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setEditingMethod(null)}>
                          Cancelar
                        </Button>
                        <Button className="flex-1 bg-brand-brown hover:bg-brand-brown-dark" onClick={handleEditMethod}>
                          Salvar
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
                      <AlertDialogTitle>Excluir Forma de Pagamento</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir "{method.name}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => handleDeleteMethod(method.id)}
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

      {paymentMethods.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma forma de pagamento cadastrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Nova Forma" para começar
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-brand-brown" />
            <span>Resumo dos Pagamentos</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-brand-brown">
                {paymentMethods.filter(m => m.active).length}
              </p>
              <p className="text-sm text-muted-foreground">Métodos Ativos</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-muted-foreground">
                {paymentMethods.filter(m => !m.active).length}
              </p>
              <p className="text-sm text-muted-foreground">Métodos Desabilitados</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};