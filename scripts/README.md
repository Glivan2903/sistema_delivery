# Scripts de Configuração do Supabase

## Problema de Autenticação 401 Unauthorized

Se você está recebendo o erro `401 Unauthorized` ao tentar criar categorias no painel administrativo, isso significa que o sistema de autenticação não está configurado corretamente.

## Solução: Configurar Usuário Administrador

### Passo 1: Criar Usuário no Supabase
1. Acesse o [Dashboard do Supabase](https://supabase.com/dashboard)
2. Selecione seu projeto
3. Vá para **Authentication** > **Users**
4. Clique em **Add User** ou use um usuário existente
5. Anote o **UUID** do usuário criado

### Passo 2: Executar Script SQL
1. No Supabase Dashboard, vá para **SQL Editor**
2. Execute o script `setup-admin-user.sql`
3. Substitua `SEU_EMAIL_AQUI` pelo email do usuário
4. Ou use `UUID_DO_USUARIO` se você já tem o UUID

### Passo 3: Verificar Configuração
Execute a consulta de verificação no final do script para confirmar que o usuário foi configurado como admin.

## Como Funciona a Autenticação

O sistema agora usa:
- **Supabase Auth** para autenticação segura
- **Row Level Security (RLS)** para controle de acesso
- **Papéis de usuário** (admin, manager, staff) para permissões

## Estrutura de Permissões

- **Usuários não autenticados**: Podem apenas visualizar produtos e categorias públicas
- **Usuários autenticados sem papel**: Acesso limitado
- **Usuários com papel 'admin'**: Acesso total ao painel administrativo

## Troubleshooting

### Erro "Você não tem permissão de administrador"
- Verifique se o usuário foi criado corretamente na tabela `user_roles`
- Confirme se o papel está definido como 'admin'

### Erro "Falha na autenticação"
- Verifique se o email e senha estão corretos
- Confirme se o usuário existe no Supabase Auth

### Erro "401 Unauthorized"
- Verifique se o usuário está autenticado
- Confirme se as políticas RLS estão configuradas corretamente
- Verifique se o usuário tem o papel de administrador

## Segurança

- As políticas RLS garantem que apenas usuários autorizados possam modificar dados
- Todas as operações administrativas requerem autenticação
- Os dados do cardápio permanecem públicos para visualização
