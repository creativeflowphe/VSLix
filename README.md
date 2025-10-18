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
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima_do_supabase
```

4. Execute as migrações do banco de dados:
   - As migrações estão em `supabase/migrations/`
   - Execute-as no seu projeto Supabase

5. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

6. Acesse a aplicação em `http://localhost:3000`

## Deploy

### Vercel

1. Faça push do código para o GitHub
2. Conecte o repositório na Vercel
3. Configure as variáveis de ambiente
4. Deploy automático

### Supabase

1. Crie um projeto no Supabase
2. Execute as migrações do diretório `supabase/migrations/`
3. Configure as variáveis de ambiente no projeto

### Cloudinary

1. Crie uma conta no Cloudinary
2. Configure o upload de vídeos
3. Use as URLs geradas no sistema

## Uso

### Login Administrativo

Acesse `/admin/login` e use as credenciais:
- Email: `admin@exemplo.com`
- Senha: `123456`

Ou crie suas próprias credenciais - o sistema criará automaticamente o usuário no primeiro login.

### Adicionar Vídeos

1. No dashboard, clique no botão "+" ou acesse "Adicionar Vídeo" no menu lateral
2. O modal de upload será aberto com as seguintes opções:
   - Nome do vídeo
   - Upload de arquivo MP4 (máx. 500MB) via drag-and-drop ou clique
   - Toggle de autoplay
   - Toggle de barra fake com seletor de cor (padrão: #8b5cf6)
3. Configure as opções conforme necessário
4. Clique em "Salvar Vídeo"

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

Acesse `/admin/config` para gerenciar as configurações globais:

1. **Cloudinary Setup**
   - Configure as variáveis de ambiente (CLOUDINARY_CLOUD_NAME, API_KEY, API_SECRET)
   - Teste o upload diretamente da interface com drag-and-drop de arquivo MP4
   - Valida a integração e retorna a URL do vídeo uploadado

2. **Features Globais**
   - Toggle de Anti-Download (proteção contra download de vídeos)
   - Toggle de A/B Testing global
   - Seletor de cor padrão para barra de progresso (hex picker visual)
   - Salva as configurações no Supabase

3. **Env Vars Guide**
   - Lista todas as variáveis de ambiente necessárias
   - Botão "Copy to Vercel" copia JSON formatado para clipboard
   - Instruções de como importar no Vercel

4. **Supabase Status**
   - Monitoramento em tempo real da conexão
   - Estatísticas de vídeos e views
   - Botão para revalidar conexão

**Como Testar:**
1. Configure as variáveis no arquivo `.env`
2. Acesse `/admin/config`
3. Faça upload de teste no Cloudinary
4. Configure as features globais
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
