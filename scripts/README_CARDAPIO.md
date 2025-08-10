# 🍔 Configuração do Cardápio Real - Marrom Lanches

## 📋 Resumo das Alterações

✅ **Arquivo SQL criado**: `scripts/populate-real-menu.sql` - Contém todos os produtos do cardápio real
✅ **Dados mocados removidos**: `src/data/products.ts` - Agora vazio (dados vêm do banco)
✅ **Página principal atualizada**: `src/pages/Index.tsx` - Busca dados do Supabase
✅ **Componente de debug**: `src/components/DebugData.tsx` - Para verificar dados carregados

## 🚀 Como Configurar

### **Passo 1: Executar Script SQL no Supabase**

1. Acesse [Supabase Dashboard](https://supabase.com/dashboard)
2. Vá para **SQL Editor**
3. Cole e execute o conteúdo de `scripts/populate-real-menu.sql`
4. Verifique se não há erros

### **Passo 2: Verificar Dados Inseridos**

Após executar o script, você deve ver:
- **8 categorias** criadas
- **52 produtos** inseridos
- Todos com preços corretos do cardápio

### **Passo 3: Testar a Aplicação**

1. Reinicie sua aplicação (`npm run dev`)
2. Acesse `http://localhost:8082/`
3. Você verá uma caixa amarela de debug mostrando os dados carregados
4. Verifique se as categorias e produtos aparecem corretamente

## 📊 Estrutura dos Dados

### **Categorias Criadas:**
1. 🌶️ Sanduíches com Toscana (7 produtos)
2. 🐔 Sanduíches com Frango (6 produtos)
3. 🍔 Sanduíches com Hambúrguer (12 produtos)
4. 🥓 Sanduíches com Bacon (4 produtos)
5. ❤️ Sanduíches com Coração de Galinha (6 produtos)
6. 🥩 Sanduíches com Filé (6 produtos)
7. 🌭 Cachorro-quente (5 produtos)
8. 🥤 Bebidas (6 produtos)

### **Produtos Incluídos:**
- **Toscana**: X-CALABREZA (R$ 14,00) até CALABREZA ESPECIAL (R$ 20,00)
- **Frango**: X-FRANGO (R$ 13,50) até FRANGO ESPECIAL (R$ 17,00)
- **Hambúrguer**: HAMBÚRGUER (R$ 10,00) até ALAZANHADO (R$ 18,00)
- **Bacon**: X-BACON (R$ 16,00) até BACON ESPECIAL (R$ 19,00)
- **Coração**: X-CORAÇÃO (R$ 15,50) até CORAÇÃO ESPECIAL (R$ 23,00)
- **Filé**: X-FILÉ (R$ 16,00) até ESPECIAL DA CASA (R$ 32,00)
- **Cachorro-quente**: SIMPLES (R$ 10,00) até PIZZA BROTINHO (R$ 6,50)
- **Bebidas**: REFRIGERANTE LATA (R$ 6,00) até BOMBA BAIANA (R$ 8,00)

## 🔧 Solução de Problemas

### **Se os produtos não aparecerem:**

1. **Verifique o console do navegador** para erros
2. **Confirme que o script SQL foi executado** sem erros
3. **Verifique se as tabelas existem** no Supabase
4. **Confirme as políticas RLS** estão permitindo leitura pública

### **Se houver erro 401:**
- Execute primeiro o script de configuração de usuário admin
- Verifique se as políticas RLS estão corretas

### **Para verificar dados no Supabase:**
```sql
-- Ver categorias
SELECT * FROM public.categories WHERE active = true ORDER BY sort_order;

-- Ver produtos
SELECT p.*, c.name as categoria 
FROM public.products p 
JOIN public.categories c ON p.category_id = c.id 
WHERE p.available = true 
ORDER BY c.sort_order, p.name;
```

## 🧹 Limpeza Final

**Depois que tudo estiver funcionando:**

1. Remova o componente `DebugData` da página principal
2. Delete o arquivo `src/components/DebugData.tsx`
3. Teste todas as funcionalidades (filtros, busca, carrinho)

## 📱 Funcionalidades Disponíveis

✅ **Filtro por categoria** - Funciona com dados do banco
✅ **Busca por nome/descrição** - Funciona com dados do banco  
✅ **Carrinho de compras** - Funciona com dados do banco
✅ **Painel administrativo** - Para gerenciar produtos/categorias
✅ **Responsivo** - Funciona em mobile e desktop

## 🎯 Próximos Passos

1. **Testar filtros** por categoria
2. **Testar busca** por nome de produto
3. **Testar carrinho** adicionando produtos
4. **Configurar imagens** para os produtos (opcional)
5. **Personalizar descrições** se necessário

---

**🎉 Após seguir estes passos, seu cardápio estará funcionando com dados reais do banco!**

