# Guia de Configuração - Video Platform

## ✅ O que foi corrigido

### 1. Banco de Dados Criado
- Tabela `videos` criada no Supabase com todas as colunas necessárias
- RLS (Row Level Security) configurado corretamente
- Políticas de segurança implementadas

### 2. Erros de Upload Corrigidos
- Erro "Erro ao fazer upload para o Cloudinary" - CORRIGIDO
- Erro "Unexpected token 'R'" ao adicionar vídeo - CORRIGIDO
- Melhor tratamento de erros nas APIs

### 3. Env Vars Guide Editável
- Agora você pode editar os campos diretamente na página
- Os valores são salvos localmente para copiar
- Não mostra mais valores de exemplo estáticos

## 📋 Variáveis de Ambiente Necessárias

### Para o Vercel (Produção)

Adicione estas variáveis em: **Vercel Dashboard > Settings > Environment Variables**

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon_aqui
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret
NEXTAUTH_URL=https://seu-app.vercel.app
NEXTAUTH_SECRET=seu_secret_gerado
```

### ⚠️ IMPORTANTE: NEXTAUTH_URL

**SIM**, você precisa adicionar `NEXTAUTH_URL` na Vercel com a URL de produção do seu site.

- ❌ NÃO USE: `http://localhost:3000`
- ✅ USE: `https://seu-app.vercel.app`

## 🚀 Como Usar o Sistema

### 1. Configurar Variáveis via Interface

1. Acesse: `/admin/api-config`
2. Preencha os campos no box "Env Vars Guide" com suas variáveis REAIS
3. Clique em "Copy to Vercel (JSON)"
4. No Vercel: Settings → Environment Variables → Import from JSON
5. Cole e salve

### 2. Testar Upload

Na página `/admin/api-config`:
- Arraste um arquivo MP4 ou clique para selecionar
- Clique em "Test Upload"
- Se funcionar, o Cloudinary está configurado corretamente

### 3. Adicionar Vídeos

1. Vá para `/admin/dashboard`
2. Clique em "Adicionar Vídeo"
3. Preencha o nome e selecione o arquivo MP4
4. Configure autoplay e barra fake se desejar
5. Clique em "Salvar Vídeo"

## 🔐 Login Admin

- Email: `admin@exemplo.com`
- Senha: `123456`

**⚠️ IMPORTANTE:** Altere estas credenciais em produção editando o arquivo `lib/auth.ts`

## 📊 Status do Sistema

O box "Supabase Status" mostra:
- ✅ Conexão com banco de dados
- 📈 Total de vídeos cadastrados
- 👁️ Views de hoje

## 🛠️ Resolução de Problemas

### Erro "Configuração do Cloudinary não encontrada"
- Verifique se as variáveis `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` e `CLOUDINARY_API_SECRET` estão configuradas na Vercel

### Erro "Request Entity Too Large"
- Seu arquivo é maior que 500MB
- Reduza o tamanho do arquivo ou configure limites maiores no Cloudinary

### Banco de dados retorna erro
- Verifique se `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão corretos
- Clique em "Revalidar Conexão" na página Config API

## 📝 Estrutura do Banco de Dados

### Tabela: videos

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | uuid | ID único do vídeo |
| name | text | Nome do vídeo |
| url | text | URL do Cloudinary |
| autoplay | boolean | Reprodução automática |
| show_fake_bar | boolean | Mostrar barra fake |
| bar_color | text | Cor da barra (#hex) |
| duration | numeric | Duração em segundos |
| format | text | Formato (mp4) |
| width | integer | Largura em pixels |
| height | integer | Altura em pixels |
| size_bytes | bigint | Tamanho em bytes |
| views | integer | Número de visualizações |
| status | text | Status (active/inactive) |
| created_at | timestamptz | Data de criação |
| updated_at | timestamptz | Data de atualização |

## ✨ Próximos Passos

1. ✅ Adicione suas variáveis de ambiente reais na Vercel
2. ✅ Teste o upload de vídeos
3. ✅ Configure credenciais de admin personalizadas
4. ✅ Faça deploy e teste em produção
