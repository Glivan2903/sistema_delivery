# Configuração do Ambiente - Marrom Delivery Connect

## Configuração do Supabase

### 1. Variáveis de Ambiente
Crie um arquivo `.env.local` na raiz do projeto com as seguintes variáveis:

```bash
VITE_SUPABASE_URL=https://mdlqgmcdtkcqrukyzkpf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kbHFnbWNkdGtjcXJ1a3l6a3BmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ2NDcwNzAsImV4cCI6MjA3MDIyMzA3MH0.zqCBpjy_whsd0iPanOb46-cvHPmxZNvDl0YYmw3gX_o
```

### 2. Configuração do Supabase Client
O arquivo `src/integrations/supabase/client.ts` já está configurado com as credenciais corretas.

## Configuração do Usuário Administrador

### Passo 1: Criar Usuário
1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto "Marrom Lanches"
3. Vá para **Authentication** > **Users**
4. Clique em **Add User**
5. Preencha:
   - **Email**: seu-email@exemplo.com
   - **Password**: uma senha segura
   - **Confirm Password**: confirme a senha
6. Clique em **Create User**

### Passo 2: Atribuir Papel de Admin
1. No Supabase Dashboard, vá para **SQL Editor**
2. Execute o script `scripts/setup-admin-user.sql`
3. Substitua `SEU_EMAIL_AQUI` pelo email que você criou

### Passo 3: Verificar Configuração
Execute a consulta de verificação para confirmar que o usuário foi configurado como admin.

## Testando a Configuração

### 1. Iniciar o Projeto
```bash
npm run dev
```

### 2. Acessar o Painel Administrativo
1. Abra o projeto no navegador
2. Clique no botão de configurações (⚙️) ou acesse diretamente
3. Use as credenciais que você criou no Supabase

### 3. Testar Criação de Categoria
1. No painel, vá para "Categorias"
2. Clique em "Nova Categoria"
3. Preencha os campos e clique em "Adicionar"
4. A categoria deve ser criada sem erros

## Troubleshooting

### Erro 401 Unauthorized
- Verifique se o usuário foi criado corretamente
- Confirme se o papel de admin foi atribuído
- Verifique se as políticas RLS estão ativas

### Erro de Conexão
- Verifique se as URLs do Supabase estão corretas
- Confirme se o projeto está ativo
- Verifique se não há bloqueios de firewall

### Dados não Carregam
- Verifique o console do navegador para erros
- Confirme se as tabelas existem no banco
- Verifique se as políticas RLS permitem leitura

## Estrutura do Banco

### Tabelas Principais
- `categories`: Categorias de produtos
- `products`: Produtos do cardápio
- `user_roles`: Papéis dos usuários
- `orders`: Pedidos dos clientes

### Políticas RLS
- **Leitura pública**: Categorias e produtos ativos
- **Escrita administrativa**: Apenas usuários com papel admin
- **Pedidos**: Criação pública, leitura administrativa

## Segurança

- Todas as operações administrativas requerem autenticação
- As políticas RLS protegem os dados
- Os dados do cardápio permanecem públicos
- Apenas usuários autorizados podem modificar dados

