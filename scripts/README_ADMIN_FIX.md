# 🔐 Solução para Problema de Autenticação Admin

## 🚨 **Problema Identificado**

O painel administrativo está travando no estado de carregamento porque:
1. **Usuário não existe** no banco Supabase, ou
2. **Usuário não tem papel de admin** configurado, ou
3. **Políticas RLS** não estão funcionando corretamente

## 🛠️ **Soluções (Execute na Ordem)**

### **Solução 1: Verificar e Configurar Usuário Admin**

1. **Acesse o Supabase Dashboard**
   - Vá para [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Selecione seu projeto

2. **Execute o script de diagnóstico**
   - Vá para **SQL Editor**
   - Cole e execute o conteúdo de `scripts/fix-admin-user.sql`
   - Este script irá:
     - Verificar se o usuário existe
     - Configurar o papel de admin
     - Verificar políticas RLS

3. **Verifique o resultado**
   - Se retornar usuários, o problema é o papel
   - Se não retornar nada, o usuário não existe

### **Solução 2: Criar Usuário Admin (Se necessário)**

Se o usuário não existir, você tem **2 opções**:

#### **Opção A: Via Interface do Supabase (Recomendado)**
1. Vá para **Authentication > Users**
2. Clique em **"Add User"**
3. Preencha:
   - **Email**: `marromlanches@gmail.com`
   - **Password**: `sua_senha_aqui`
4. Clique em **"Create User"**
5. **Anote o UUID** do usuário criado

#### **Opção B: Via SQL (Avançado)**
1. No SQL Editor, execute:
```sql
-- Substitua 'sua_senha_aqui' pela senha desejada
INSERT INTO auth.users (
  id, email, encrypted_password, email_confirmed_at, 
  created_at, updated_at
) VALUES (
  gen_random_uuid(), 'marromlanches@gmail.com', 
  crypt('sua_senha_aqui', gen_salt('bf')), now(), now(), now()
);
```

### **Solução 3: Configurar Papel de Admin**

Após criar/verificar o usuário, execute:

```sql
-- Configurar papel de admin
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role 
FROM auth.users 
WHERE email = 'marromlanches@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verificar se foi configurado
SELECT 
  u.email,
  ur.role,
  ur.created_at
FROM auth.users u
JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'admin';
```

### **Solução 4: Verificar Políticas RLS**

Execute para verificar se as políticas estão corretas:

```sql
-- Verificar políticas das tabelas principais
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies 
WHERE tablename IN ('user_roles', 'categories', 'products')
ORDER BY tablename, policyname;
```

## 🔍 **Diagnóstico Passo a Passo**

### **Passo 1: Verificar Console do Navegador**
1. Abra o painel admin
2. Tente fazer login
3. Pressione **F12** → **Console**
4. Procure por erros relacionados a:
   - `401 Unauthorized`
   - `403 Forbidden`
   - `RLS policy violation`

### **Passo 2: Verificar Network Tab**
1. **F12** → **Network**
2. Tente fazer login
3. Procure pela requisição que falha
4. Verifique o **Status Code** e **Response**

### **Passo 3: Verificar Dados no Supabase**
1. **SQL Editor** → Execute:
```sql
-- Verificar usuários
SELECT id, email, created_at FROM auth.users;

-- Verificar papéis
SELECT * FROM public.user_roles;

-- Verificar se as tabelas existem
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('categories', 'products', 'user_roles');
```

## 🚀 **Teste Após Correção**

1. **Reinicie a aplicação** (`npm run dev`)
2. **Acesse o painel admin**
3. **Faça login** com:
   - Email: `marromlanches@gmail.com`
   - Senha: `sua_senha_aqui`
4. **Verifique se redireciona** para o dashboard

## 🆘 **Se Ainda Não Funcionar**

### **Problema: Erro 401/403**
- Verifique se o usuário tem papel de admin
- Execute novamente o script de configuração

### **Problema: Erro de RLS**
- Verifique se as políticas foram criadas
- Execute a migração novamente

### **Problema: Usuário não encontrado**
- Crie o usuário via interface do Supabase
- Configure o papel de admin

## 📋 **Checklist Final**

- [ ] Usuário existe no Supabase
- [ ] Usuário tem papel de admin
- [ ] Políticas RLS estão ativas
- [ ] Função `has_role` existe
- [ ] Login funciona sem erros
- [ ] Redirecionamento para dashboard funciona

## 🎯 **Próximos Passos**

Após resolver a autenticação:
1. **Teste o painel admin** completamente
2. **Configure categorias e produtos** se necessário
3. **Teste todas as funcionalidades** administrativas

---

**💡 Dica**: Se ainda tiver problemas, compartilhe os erros do console do navegador para diagnóstico mais preciso.

