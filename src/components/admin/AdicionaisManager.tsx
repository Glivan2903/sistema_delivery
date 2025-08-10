import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ExtraRow {
  id: string;
  name: string;
  price: number;
  active: boolean;
}

export const AdicionaisManager = () => {
  const [extras, setExtras] = useState<ExtraRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');

  const fetchExtras = async () => {
    setLoading(true);
    const { data } = await supabase.from('extras').select('*').order('name');
    if (data) setExtras(data.map((e: any) => ({ ...e, price: Number(e.price) })) as ExtraRow[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchExtras();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setPrice('');
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (row: ExtraRow) => {
    setEditingId(row.id);
    setName(row.name);
    setPrice(String(row.price));
    setOpen(true);
  };

  const saveExtra = async () => {
    if (!name || !price) return;
    const payload = { name, price: Number(price), active: true };
    if (editingId) {
      await supabase.from('extras').update(payload).eq('id', editingId);
    } else {
      await supabase.from('extras').insert(payload);
    }
    setOpen(false);
    resetForm();
    fetchExtras();
  };

  const removeExtra = async (id: string) => {
    if (!confirm('Excluir este adicional?')) return;
    await supabase.from('extras').delete().eq('id', id);
    fetchExtras();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-brown">Adicionais</h2>
          <p className="text-sm text-muted-foreground">Gerencie os adicionais exibidos no carrinho.</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> Novo adicional
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-brand-brown">Lista de adicionais</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Carregando...</div>
          ) : extras.length === 0 ? (
            <div className="text-sm text-muted-foreground">Nenhum adicional cadastrado.</div>
          ) : (
            <div className="space-y-3">
              {extras.map((ex) => (
                <div key={ex.id} className="flex items-center justify-between border rounded-md p-3">
                  <div>
                    <div className="font-medium text-brand-brown">{ex.name}</div>
                    <div className="text-sm text-muted-foreground">R$ {ex.price.toFixed(2)}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openEdit(ex)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => removeExtra(ex.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-brand-brown">{editingId ? 'Editar adicional' : 'Novo adicional'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Bacon extra" />
            </div>
            <div className="space-y-2">
              <Label>Valor</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="3.00" />
            </div>
            <Separator />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={saveExtra}>{editingId ? 'Salvar' : 'Adicionar'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
