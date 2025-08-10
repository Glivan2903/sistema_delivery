import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface AdminLoginProps {
  onLogin: () => void;
  onClose: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const AdminLogin = ({ onLogin, onClose, isLoading, setIsLoading }: AdminLoginProps) => {
  const [credentials, setCredentials] = useState({ email: 'marromlanches@gmail.com', password: '' });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.email || !credentials.password) {
      toast({
        title: "Erro no login",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive"
      });
      return;
    }

    console.log('🔐 Iniciando processo de login...');
    setIsLoading(true);
    
    try {
      console.log('📧 Tentando autenticar com Supabase...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        console.error('❌ Erro na autenticação Supabase:', error);
        throw error;
      }

      console.log('✅ Autenticação Supabase bem-sucedida:', data.user?.id);

      if (data.user) {
        console.log('✅ Usuário autenticado com sucesso, chamando onLogin...');
        toast({
          title: "Login realizado com sucesso!",
          description: "Bem-vindo ao painel administrativo."
        });
        // Chamar onLogin imediatamente - o loading será limpo pelo AdminPanel
        onLogin();
      }
    } catch (error: any) {
      console.error('💥 Erro completo no login:', error);
      toast({
        title: "Erro no login",
        description: error.message || "Falha na autenticação. Verifique suas credenciais e console para mais detalhes.",
        variant: "destructive"
      });
      // Limpar loading apenas em caso de erro
      setIsLoading(false);
    } finally {
      // Garantir que o loading seja sempre limpo
      console.log('🏁 Finalizando processo de login...');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-brand-brown rounded-full flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <CardTitle className="text-2xl text-brand-brown">Acesso Administrativo</CardTitle>
          <CardDescription>
            Digite suas credenciais para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={credentials.email}
                  onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={credentials.password}
                  onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={isLoading}>
                Cancelar
              </Button>
              <Button type="submit" className="flex-1 bg-brand-brown hover:bg-brand-brown-dark" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Use o email e senha da sua conta Supabase</p>
            <p>para acessar o painel administrativo</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};