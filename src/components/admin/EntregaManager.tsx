import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Edit, Trash2, Truck, MapPin } from 'lucide-react';
import { DeliveryArea } from './AdminPanel';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EntregaManagerProps {
  deliveryAreas: DeliveryArea[];
  onUpdateDeliveryAreas: (areas: DeliveryArea[]) => void;
}

export const EntregaManager = ({ deliveryAreas, onUpdateDeliveryAreas }: EntregaManagerProps) => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<DeliveryArea | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    fee: '',
    active: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const resetForm = () => {
    setFormData({
      name: '',
      fee: '',
      active: true
    });
  };

  const handleAddArea = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do bairro é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (deliveryAreas.some(area => area.name.toLowerCase() === formData.name.toLowerCase())) {
      toast({
        title: "Erro",
        description: "Já existe um bairro com este nome.",
        variant: "destructive"
      });
      return;
    }

    const fee = parseFloat(formData.fee.replace(',', '.')) || 0;
    if (fee < 0) {
      toast({
        title: "Erro",
        description: "Taxa de entrega não pode ser negativa.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Inserir no banco de dados
      const { data, error } = await supabase
        .from('delivery_areas')
        .insert({
          name: formData.name.trim(),
          fee: fee,
          active: formData.active
        })
        .select()
        .single();

      if (error) throw error;

      const newArea: DeliveryArea = {
        id: data.id,
        name: data.name,
        fee: data.fee,
        active: data.active
      };

      onUpdateDeliveryAreas([...deliveryAreas, newArea]);
      resetForm();
      setIsAddDialogOpen(false);
      
      toast({
        title: "Área de entrega adicionada!",
        description: `O bairro "${newArea.name}" foi cadastrado com sucesso no banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao adicionar área:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditArea = async () => {
    if (!editingArea || !formData.name.trim()) {
      toast({
        title: "Erro",
        description: "Nome do bairro é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (deliveryAreas.some(area => area.id !== editingArea.id && area.name.toLowerCase() === formData.name.toLowerCase())) {
      toast({
        title: "Erro",
        description: "Já existe um bairro com este nome.",
        variant: "destructive"
      });
      return;
    }

    const fee = parseFloat(formData.fee.replace(',', '.')) || 0;
    if (fee < 0) {
      toast({
        title: "Erro",
        description: "Taxa de entrega não pode ser negativa.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('delivery_areas')
        .update({
          name: formData.name.trim(),
          fee: fee,
          active: formData.active
        })
        .eq('id', editingArea.id);

      if (error) throw error;

      const updatedAreas = deliveryAreas.map(area =>
        area.id === editingArea.id
          ? {
              ...area,
              name: formData.name.trim(),
              fee: fee,
              active: formData.active
            }
          : area
      );

      onUpdateDeliveryAreas(updatedAreas);
      setEditingArea(null);
      resetForm();
      
      toast({
        title: "Área de entrega atualizada!",
        description: `O bairro "${formData.name}" foi atualizado com sucesso no banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao atualizar área:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteArea = async (areaId: string) => {
    const areaToDelete = deliveryAreas.find(area => area.id === areaId);
    
    setIsLoading(true);
    try {
      // Deletar do banco de dados
      const { error } = await supabase
        .from('delivery_areas')
        .delete()
        .eq('id', areaId);

      if (error) throw error;

      const updatedAreas = deliveryAreas.filter(area => area.id !== areaId);
      onUpdateDeliveryAreas(updatedAreas);
      
      toast({
        title: "Área de entrega removida!",
        description: `O bairro "${areaToDelete?.name}" foi excluído do banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao deletar área:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir do banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleAreaStatus = async (areaId: string) => {
    const area = deliveryAreas.find(a => a.id === areaId);
    if (!area) return;

    const newStatus = !area.active;
    
    setIsLoading(true);
    try {
      // Atualizar status no banco de dados
      const { error } = await supabase
        .from('delivery_areas')
        .update({ active: newStatus })
        .eq('id', areaId);

      if (error) throw error;

      const updatedAreas = deliveryAreas.map(area =>
        area.id === areaId
          ? { ...area, active: newStatus }
          : area
      );
      
      onUpdateDeliveryAreas(updatedAreas);
      
      toast({
        title: newStatus ? "Área ativada!" : "Área desativada!",
        description: `Entrega para "${area.name}" foi ${newStatus ? 'ativada' : 'desativada'} no banco de dados.`
      });
    } catch (error: any) {
      console.error('Erro ao alterar status da área:', error);
      toast({
        title: "Erro",
        description: "Falha ao alterar status no banco de dados. Tente novamente.",
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
          <h2 className="text-3xl font-bold text-brand-brown">Gerenciar Entrega</h2>
          <p className="text-muted-foreground">Configure áreas de entrega e taxas</p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
          setIsAddDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-brand-brown hover:bg-brand-brown-dark">
              <Plus className="w-4 h-4 mr-2" />
              Nova Área
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Área de Entrega</DialogTitle>
              <DialogDescription>
                Cadastre um novo bairro ou região para entrega.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="areaName">Nome do Bairro/Região</Label>
                <Input
                  id="areaName"
                  placeholder="Ex: Centro, Bairro Novo, Industrial..."
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="deliveryFee">Taxa de Entrega (R$)</Label>
                <Input
                  id="deliveryFee"
                  placeholder="Ex: 3,50 (use 0 para entrega grátis)"
                  value={formData.fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee: e.target.value }))}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="areaActive"
                  checked={formData.active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                />
                <Label htmlFor="areaActive">Área ativa para entrega</Label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setIsAddDialogOpen(false)} disabled={isLoading}>
                  Cancelar
                </Button>
                <Button className="flex-1 bg-brand-brown hover:bg-brand-brown-dark" onClick={handleAddArea} disabled={isLoading}>
                  {isLoading ? 'Salvando...' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveryAreas.map((area) => (
          <Card key={area.id} className={!area.active ? 'opacity-60' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-brand-brown" />
                  <span>{area.name}</span>
                </CardTitle>
                <Badge variant={area.active ? "default" : "secondary"}>
                  {area.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <CardDescription>
                Taxa: {area.fee === 0 ? "Grátis" : `R$ ${area.fee.toFixed(2).replace('.', ',')}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm">Ativo:</Label>
                <Switch
                  checked={area.active}
                  onCheckedChange={() => toggleAreaStatus(area.id)}
                />
              </div>

              <div className="flex gap-2">
                <Dialog open={editingArea?.id === area.id} onOpenChange={(open) => {
                  if (open) {
                    setEditingArea(area);
                    setFormData({
                      name: area.name,
                      fee: area.fee.toString().replace('.', ','),
                      active: area.active
                    });
                  } else {
                    setEditingArea(null);
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
                      <DialogTitle>Editar Área de Entrega</DialogTitle>
                      <DialogDescription>
                        Altere as informações da área "{area.name}".
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="editAreaName">Nome do Bairro/Região</Label>
                        <Input
                          id="editAreaName"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        />
                      </div>

                      <div>
                        <Label htmlFor="editDeliveryFee">Taxa de Entrega (R$)</Label>
                        <Input
                          id="editDeliveryFee"
                          value={formData.fee}
                          onChange={(e) => setFormData(prev => ({ ...prev, fee: e.target.value }))}
                        />
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          id="editAreaActive"
                          checked={formData.active}
                          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                        />
                        <Label htmlFor="editAreaActive">Área ativa para entrega</Label>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={() => setEditingArea(null)} disabled={isLoading}>
                          Cancelar
                        </Button>
                        <Button className="flex-1 bg-brand-brown hover:bg-brand-brown-dark" onClick={handleEditArea} disabled={isLoading}>
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
                      <AlertDialogTitle>Excluir Área de Entrega</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tem certeza que deseja excluir a área "{area.name}"? 
                        Esta ação não pode ser desfeita.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction 
                        className="bg-destructive hover:bg-destructive/90"
                        onClick={() => handleDeleteArea(area.id)}
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

      {deliveryAreas.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Truck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhuma área de entrega cadastrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Clique em "Nova Área" para começar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};