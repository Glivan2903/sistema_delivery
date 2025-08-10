import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings as SettingsIcon, Save, RotateCcw, Eye, Upload, X } from 'lucide-react';
import { Settings } from './AdminPanel';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ConfiguracoesManagerProps {
  settings: Settings;
  onUpdateSettings: (settings: Settings) => void;
}

export const ConfiguracoesManager = ({ settings, onUpdateSettings }: ConfiguracoesManagerProps) => {
  const [formData, setFormData] = useState<Settings>(settings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleInputChange = (field: keyof Settings, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    // Validações
    if (formData.freeDeliveryMinimum < 0) {
      toast({
        title: "Erro",
        description: "Valor mínimo para entrega grátis não pode ser negativo.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.companyName.trim()) {
      toast({
        title: "Erro",
        description: "Nome da empresa é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Salvar no banco de dados
      const { error } = await supabase
        .from('company_settings')
        .update({
          company_name: formData.companyName,
          welcome_title: formData.welcomeTitle,
          subtitle: formData.subtitle,
          address: formData.address,
          phone: formData.phone,
          whatsapp: formData.whatsapp,
          business_hours: formData.businessHours,
          free_delivery_minimum: formData.freeDeliveryMinimum,
          delivery_time: formData.deliveryTime
        })
        .eq('id', (await supabase.from('company_settings').select('id').limit(1).single()).data?.id);

      if (error) throw error;

      onUpdateSettings(formData);
      setHasChanges(false);
      
      toast({
        title: "Configurações salvas!",
        description: "As alterações foram salvas no banco de dados com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: "Erro",
        description: "Falha ao salvar no banco de dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem.",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (máximo 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 2MB.",
        variant: "destructive"
      });
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `logo-${Date.now()}.${fileExt}`;

      // Upload para o Supabase Storage
      const { data, error } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (error) throw error;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      // Atualizar configurações com a nova URL do logotipo
      const { error: updateError } = await supabase
        .from('company_settings')
        .update({ logo_url: publicUrl })
        .eq('id', (await supabase.from('company_settings').select('id').limit(1).single()).data?.id);

      if (updateError) throw updateError;

      setLogoPreview(publicUrl);
      setLogoFile(null);
      setHasChanges(true);

      toast({
        title: "Logotipo atualizado!",
        description: "O logotipo foi enviado com sucesso."
      });
    } catch (error: any) {
      console.error('Erro ao fazer upload do logotipo:', error);
      toast({
        title: "Erro",
        description: "Falha ao fazer upload do logotipo. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleReset = () => {
    setFormData(settings);
    setHasChanges(false);
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    toast({
      title: "Alterações descartadas",
      description: "Os dados foram restaurados para os valores salvos."
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-brand-brown">Configurações Gerais</h2>
          <p className="text-sm sm:text-base text-muted-foreground">Personalize as informações da sua lanchonete</p>
        </div>
        
        {hasChanges && (
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleReset} size="sm" className="sm:h-10">
              <RotateCcw className="w-4 h-4 mr-2" />
              Descartar
            </Button>
            <Button onClick={handleSave} className="bg-brand-brown hover:bg-brand-brown-dark sm:h-10" disabled={isLoading} size="sm">
              <Save className="w-4 h-4 mr-2" />
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {/* 1. Título Principal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-brand-brown" />
              <span>1. Título Principal</span>
            </CardTitle>
            <CardDescription>
              Configurações do cabeçalho da página
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="companyName">Título (Nome da empresa)</Label>
                <Input
                  id="companyName"
                  placeholder="Ex: Marrom Lanches"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="subtitle">Slogan logo abaixo</Label>
                <Input
                  id="subtitle"
                  placeholder="Ex: O melhor da cidade, direto na sua casa!"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="freeDelivery">Entrega grátis acima de R$</Label>
                <Input
                  id="freeDelivery"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 35.00"
                  value={formData.freeDeliveryMinimum}
                  onChange={(e) => handleInputChange('freeDeliveryMinimum', parseFloat(e.target.value) || 0)}
                />
              </div>

              <div>
                <Label htmlFor="deliveryTime">Tempo de entrega</Label>
                <Input
                  id="deliveryTime"
                  placeholder="Ex: 45-60 min"
                  value={formData.deliveryTime}
                  onChange={(e) => handleInputChange('deliveryTime', e.target.value)}
                />
              </div>

              {/* Upload do Logotipo */}
              <div className="sm:col-span-2">
                <Label>Logotipo da Empresa</Label>
                <div className="mt-2 space-y-3">
                  {/* Preview do logotipo atual */}
                  {logoPreview && (
                    <div className="flex items-center space-x-3 p-3 bg-muted/30 rounded-lg">
                      <img 
                        src={logoPreview} 
                        alt="Preview do logotipo" 
                        className="w-16 h-16 object-contain rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Logotipo selecionado</p>
                        <p className="text-xs text-muted-foreground">
                          {logoFile ? `${logoFile.name} (${(logoFile.size / 1024).toFixed(1)} KB)` : 'Logotipo atual'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveLogo}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}

                  {/* Área de upload */}
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-muted-foreground/50 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    {!logoPreview ? (
                      <div className="space-y-3">
                        <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">Clique para selecionar um logotipo</p>
                          <p className="text-xs text-muted-foreground">
                            PNG, JPG ou GIF até 2MB
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                        >
                          {isUploadingLogo ? 'Enviando...' : 'Selecionar Imagem'}
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Button
                          onClick={() => handleLogoUpload(logoFile!)}
                          disabled={isUploadingLogo || !logoFile}
                          className="bg-brand-brown hover:bg-brand-brown-dark"
                        >
                          {isUploadingLogo ? 'Enviando...' : 'Enviar Logotipo'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploadingLogo}
                        >
                          Selecionar Outra Imagem
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 2. Informações do Banner */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-brand-brown" />
              <span>2. Informações do Banner</span>
            </CardTitle>
            <CardDescription>
              Configurações da seção hero da página
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <Label htmlFor="welcomeTitle">Bem-vindo ao</Label>
                <Input
                  id="welcomeTitle"
                  placeholder="Ex: Bem-vindo ao"
                  value={formData.welcomeTitle}
                  onChange={(e) => handleInputChange('welcomeTitle', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="companyNameBanner">Nome da empresa</Label>
                <Input
                  id="companyNameBanner"
                  placeholder="Ex: Marrom Lanches"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mesmo valor do título principal (sincronizado automaticamente)
                </p>
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="freeDeliveryBanner">Entrega grátis acima de R$</Label>
                <Input
                  id="freeDeliveryBanner"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Ex: 35.00"
                  value={formData.freeDeliveryMinimum}
                  onChange={(e) => handleInputChange('freeDeliveryMinimum', parseFloat(e.target.value) || 0)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mesmo valor da entrega grátis do título principal (sincronizado automaticamente)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <SettingsIcon className="w-5 h-5 text-brand-brown" />
              <span>3. Footer</span>
            </CardTitle>
            <CardDescription>
              Informações de contato e localização no rodapé
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="companyNameFooter">Nome da empresa</Label>
                <Input
                  id="companyNameFooter"
                  placeholder="Ex: Marrom Lanches"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mesmo valor do título principal (sincronizado automaticamente)
                </p>
              </div>

              <div>
                <Label htmlFor="subtitleFooter">Slogan</Label>
                <Input
                  id="subtitleFooter"
                  placeholder="Ex: O melhor da cidade, direto na sua casa!"
                  value={formData.subtitle}
                  onChange={(e) => handleInputChange('subtitle', e.target.value)}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Mesmo valor do slogan do título principal (sincronizado automaticamente)
                </p>
              </div>

              <div>
                <Label htmlFor="phone">Contato</Label>
                <Input
                  id="phone"
                  placeholder="Ex: (79) 99813-0038"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="whatsapp">WhatsApp (para pedidos)</Label>
                <Input
                  id="whatsapp"
                  placeholder="Ex: 79998130038"
                  value={formData.whatsapp}
                  onChange={(e) => handleInputChange('whatsapp', e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Número para onde são direcionados os pedidos
                </p>
              </div>

              <div>
                <Label htmlFor="address">Localização</Label>
                <Input
                  id="address"
                  placeholder="Ex: Av. Serafim Bonfim s/n"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="businessHours">Horário de funcionamento</Label>
                <Input
                  id="businessHours"
                  placeholder="Ex: Segunda a Domingo: 18h às 01h"
                  value={formData.businessHours}
                  onChange={(e) => handleInputChange('businessHours', e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Preview das Alterações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Eye className="w-5 h-5 text-brand-brown" />
            <span>Preview das Alterações</span>
          </CardTitle>
          <CardDescription>
            Veja como ficará na página principal organizado por etapas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Preview Título Principal */}
            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-brand-brown">
              <h3 className="font-semibold text-brand-brown mb-3">1. Título Principal (Header)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p><strong>Título:</strong> {formData.companyName}</p>
                  <p><strong>Slogan:</strong> {formData.subtitle}</p>
                  {logoPreview && (
                    <div className="mt-2">
                      <p><strong>Logotipo:</strong></p>
                      <img 
                        src={logoPreview} 
                        alt="Logotipo" 
                        className="w-12 h-12 object-contain rounded mt-1"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <p><strong>Entrega grátis:</strong> Acima de R$ {formData.freeDeliveryMinimum.toFixed(2).replace('.', ',')}</p>
                  <p><strong>Tempo:</strong> {formData.deliveryTime}</p>
                </div>
              </div>
            </div>

            {/* Preview Informações do Banner */}
            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-brand-gold">
              <h3 className="font-semibold text-brand-brown mb-3">2. Informações do Banner (Hero)</h3>
              <div className="text-center">
                <h1 className="text-xl font-bold text-brand-brown mb-2">
                  {formData.welcomeTitle} {formData.companyName}
                </h1>
                <div className="inline-block bg-brand-gold text-foreground px-3 py-1 rounded-full text-sm">
                  🍔 Entrega GRÁTIS acima de R$ {formData.freeDeliveryMinimum.toFixed(2).replace('.', ',')}!
                </div>
              </div>
            </div>

            {/* Preview Footer */}
            <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-brand-brown">
              <h3 className="font-semibold text-brand-brown mb-3">3. Footer</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p><strong>Empresa:</strong></p>
                  <p>{formData.companyName}</p>
                  <p className="text-muted-foreground">{formData.subtitle}</p>
                </div>
                <div>
                  <p><strong>Contato:</strong></p>
                  <p>📞 {formData.phone}</p>
                  <p>💬 WhatsApp para pedidos</p>
                </div>
                <div>
                  <p><strong>Localização:</strong></p>
                  <p>📍 {formData.address}</p>
                  <p>⏰ {formData.businessHours}</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasChanges && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <p className="text-amber-800">
              <strong>Você tem alterações não salvas.</strong> Clique em "Salvar Alterações" para aplicá-las ao sistema.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                Descartar
              </Button>
              <Button size="sm" onClick={handleSave} className="bg-brand-brown hover:bg-brand-brown-dark" disabled={isLoading}>
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};