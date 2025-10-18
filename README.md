# Video Analytics Platform

Uma plataforma completa de análise de vídeos com dashboard administrativo, tracking de visualizações e métricas detalhadas de engajamento.

## Funcionalidades

- Dashboard administrativo com autenticação
- Upload e gerenciamento de vídeos via Cloudinary
- Sistema de tracking de visualizações em tempo real
- Análise de métricas de engajamento (marcos de 5%, 25%, 50%, 75%, 90%, 100%)
- Exportação de dados em CSV
- Gráficos interativos de análise
- Proteção anti-download
- Sistema de progresso fake customizável
- Reprodução automática configurável

## Tecnologias

- **Next.js 13** - Framework React com App Router
- **TypeScript** - Tipagem estática
- **Supabase** - Banco de dados PostgreSQL e autenticação
- **Cloudinary** - Armazenamento e streaming de vídeos
- **Tailwind CSS** - Estilização
- **Shadcn/ui** - Componentes de UI
- **Recharts** - Gráficos e visualizações
- **Framer Motion** - Animações
- **SWR** - Cache e fetch de dados

## Estrutura do Banco de Dados

### Tabela `videos`
- `id` - UUID único do vídeo
- `name` - Nome/título do vídeo
- `video_url` - URL do Cloudinary
- `autoplay` - Reprodução automática (padrão: true)
- `fake_progress` - Barra de progresso fake (padrão: false)
- `progress_color` - Cor da barra de progresso (padrão: #10b981)
- `anti_download` - Proteção anti-download (padrão: true)
- `muted` - Iniciar sem som (padrão: true)
- `created_at` - Data de criação

### Tabela `views`
- `id` - UUID único da visualização
- `video_id` - Referência ao vídeo
- `ip_hash` - Hash do IP (privacidade)
- `session_id` - ID da sessão
- `timestamp` - Data/hora da visualização
- `watch_time` - Tempo total assistido
- `progress_percent` - Porcentagem de conclusão
- `milestone_5/25/50/75/90/100` - Marcos de progresso

## Instalação

1. Clone o repositório:
```bash
git clone <seu-repositorio>
cd <nome-do-projeto>
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente no arquivo `.env`:
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu_cloud_name
CLOUDINARY_API_KEY=sua_api_key
CLOUDINARY_API_SECRET=seu_api_secret

# NextAuth Configuration (opcional)
NEXTAUTH_SECRET=sua_secret_key_aqui
NEXTAUTH_URL=http://localhost:3000
```

**Variáveis Obrigatórias:**
- `NEXT_PUBLIC_SUPABASE_URL` - URL do seu projeto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` - Nome da nuvem Cloudinary
- `CLOUDINARY_API_KEY` - Chave da API Cloudinary
- `CLOUDINARY_API_SECRET` - Secret da API Cloudinary

**Para obter as credenciais do Cloudinary:**
- Acesse https://cloudinary.com e crie uma conta gratuita
- No dashboard, copie o Cloud Name, API Key e API Secret
- Cole as informações no arquivo `.env`

**Para obter as credenciais do Supabase:**
- Acesse https://supabase.com e crie um projeto
- Vá em Settings > API
- Copie a URL e a anon/public key
- Cole as informações no arquivo `.env`

4. Execute as migrações do banco de dados no Supabase:

**Opção A: Via Supabase Dashboard (Recomendado)**
   - Acesse seu projeto no Supabase Dashboard
   - Navegue para SQL Editor
   - Copie o conteúdo do arquivo `supabase/migrations/20251018_init_complete_schema.sql`
   - Cole no SQL Editor e execute

**Opção B: Via Supabase CLI**
```bash
# Instale a CLI do Supabase (se ainda não tiver)
npm install -g supabase

# Faça login
supabase login

# Link com seu projeto
supabase link --project-ref seu-project-ref

# Execute as migrações
supabase db push
```

**Estrutura das Tabelas Criadas:**
- `videos` - Armazena metadados dos vídeos
- `views` - Rastreia visualizações e métricas de engajamento
- `configs` - Configurações globais da plataforma

5. Teste o build de produção:
```bash
npm run build
```

6. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

7. Acesse a aplicação em `http://localhost:3000`

## Deploy

### Vercel

1. Faça push do código para o GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente no Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
   - `NEXTAUTH_SECRET` (opcional)
   - `NEXTAUTH_URL` (sua URL do Vercel)
4. Deploy automático

**Dica:** Use a página "Config API" do admin (`/admin/api-config`) para copiar todas as variáveis em formato JSON e importar diretamente no Vercel.

### Supabase

1. Crie um projeto no Supabase
2. Execute as migrações do diretório `supabase/migrations/`
3. Configure Row Level Security (RLS) nas tabelas
4. Copie as credenciais para o arquivo `.env`

### Cloudinary

1. Acesse https://cloudinary.com e crie uma conta gratuita
2. No dashboard, navegue até Settings > Security
3. Copie o Cloud Name, API Key e API Secret
4. Configure no arquivo `.env` ou nas variáveis do Vercel
5. O sistema criará automaticamente uma pasta `vslix-videos` para organizar os uploads

## Uso

### Login Administrativo

Acesse `/admin/login` e use as credenciais:
- Email: `admin@exemplo.com`
- Senha: `123456`

Ou crie suas próprias credenciais - o sistema criará automaticamente o usuário no primeiro login.

### Adicionar Vídeos

1. No dashboard, clique no botão "+" ou acesse "Adicionar Vídeo" no menu lateral
2. O modal de upload será aberto com as seguintes opções:
   - **Nome do vídeo**: Digite um nome descritivo
   - **Upload de arquivo**: Arraste um arquivo MP4 ou clique para selecionar (máx. 500MB)
   - **Autoplay**: Ativa/desativa reprodução automática
   - **Barra Fake**: Mostra uma barra de progresso personalizada
   - **Cor da Barra**: Escolha a cor da barra fake (padrão: #8b5cf6)
3. Aguarde o upload ser concluído (progresso exibido em toast)
4. O vídeo será automaticamente:
   - Enviado para o Cloudinary
   - Salvo no banco de dados Supabase
   - Adicionado à lista de vídeos

**Processo de Upload:**
- Fase 1: Upload do arquivo para o Cloudinary (pode levar alguns minutos dependendo do tamanho)
- Fase 2: Salvamento dos metadados no Supabase
- Fase 3: Recarregamento da lista de vídeos

**Nota**: O modal é acessível via múltiplos pontos:
- Botão "+" no header da tabela de vídeos
- Botão flutuante circular no canto inferior direito
- Item "Adicionar Vídeo" no menu lateral

### Tracking de Visualizações

O sistema rastreia automaticamente:
- Total de visualizações
- Tempo médio assistido
- Taxa de conclusão
- Marcos de progresso
- Dados de sessão

### Exportar Dados

No dashboard de um vídeo específico, clique em "Exportar CSV" para baixar todos os dados de visualização.

### Configurações da Plataforma

A plataforma possui duas áreas de configuração no menu administrativo:

#### 1. Config API (`/admin/api-config`)
Gerencia APIs e conexões externas:

- **Cloudinary Setup**
  - Teste o upload diretamente da interface com drag-and-drop de arquivo MP4
  - Valida a integração e retorna a URL do vídeo uploadado
  - Lista variáveis necessárias: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

- **Env Vars Guide**
  - Lista todas as variáveis de ambiente necessárias
  - Botão "Copy to Vercel" copia JSON formatado para clipboard
  - Instruções de como importar no Vercel

- **Supabase Status**
  - Monitoramento em tempo real da conexão
  - Estatísticas de vídeos e views
  - Botão para revalidar conexão

#### 2. Configuração (`/admin/settings`)
Gerencia opções padrão dos vídeos:

- **Anti-Download** - Proteção contra download de vídeos
- **A/B Testing Global** - Ativa testes A/B em todos os vídeos
- **Cor Padrão da Barra de Progresso** - Seletor de cor (hex picker visual)
- Todas as configurações são salvas no banco Supabase

**Como Testar:**
1. Configure as variáveis no arquivo `.env`
2. Acesse `/admin/api-config` para testar as conexões
3. Faça upload de teste no Cloudinary
4. Acesse `/admin/settings` para configurar opções de vídeo
5. Copie o JSON para deploy no Vercel

## Scripts

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run start` - Inicia o servidor de produção
- `npm run lint` - Executa o linter

## Segurança

- Row Level Security (RLS) habilitado em todas as tabelas
- Autenticação via Supabase
- Proteção de rotas administrativas
- Hash de IPs para privacidade
- Cookies seguros para sessões

## Suporte

Para problemas ou dúvidas, abra uma issue no repositório.

## Licença

MIT
