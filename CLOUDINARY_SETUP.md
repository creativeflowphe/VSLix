# Guia de Configuração do Cloudinary

Este guia explica como configurar o Cloudinary para upload de vídeos no VSLix.

## 1. Criar Conta no Cloudinary

1. Acesse https://cloudinary.com
2. Clique em "Sign Up" (ou "Get Started for Free")
3. Preencha os dados:
   - Email
   - Senha
   - Nome da empresa/projeto
4. Confirme o email

## 2. Obter Credenciais

Após criar a conta, você será direcionado ao Dashboard:

1. Na página inicial, você verá um box chamado **"Product Environment Credentials"**
2. Anote as seguintes informações:
   - **Cloud Name**: Ex: `dg8abc123`
   - **API Key**: Ex: `123456789012345`
   - **API Secret**: Ex: `abcdefg_1234567890` (clique em "Reveal" para ver)

## 3. Configurar no Projeto

### Desenvolvimento Local

Edite o arquivo `.env` na raiz do projeto:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=seu_cloud_name_aqui
CLOUDINARY_API_KEY=sua_api_key_aqui
CLOUDINARY_API_SECRET=seu_api_secret_aqui
```

### Deploy no Vercel

1. Acesse seu projeto no Vercel
2. Vá em **Settings** > **Environment Variables**
3. Adicione as três variáveis:
   - `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`
4. Faça um novo deploy (ou aguarde o deploy automático)

## 4. Configurações Recomendadas no Cloudinary

### Limite de Upload

Por padrão, o Cloudinary aceita uploads até 100MB no plano gratuito. Para arquivos maiores:

1. Acesse **Settings** > **Upload**
2. Configure **Upload Presets** se necessário
3. Verifique os limites do seu plano

### Pasta de Organização

O sistema cria automaticamente uma pasta `vslix-videos` para organizar os vídeos. Você pode visualizar em:

1. **Media Library** no menu lateral
2. Filtre por pasta `vslix-videos`

### Otimizações Automáticas

O Cloudinary aplica otimizações automáticas:
- Compressão de vídeo
- Streaming adaptativo
- CDN global
- Proteção de conteúdo

## 5. Testar a Configuração

1. Inicie o projeto: `npm run dev`
2. Faça login no admin: `/admin/login`
3. Clique em "Adicionar Vídeo"
4. Faça upload de um vídeo MP4 de teste (pequeno para testar rapidamente)
5. Aguarde o upload completar
6. Verifique se o vídeo aparece na lista

## 6. Verificar Upload no Cloudinary

1. Acesse o Cloudinary Dashboard
2. Clique em **Media Library**
3. Navegue até a pasta `vslix-videos`
4. Você deve ver o vídeo que fez upload

## 7. Solução de Problemas

### Erro: "Configuração do Cloudinary não encontrada"

- Verifique se as variáveis de ambiente estão corretas no arquivo `.env`
- Reinicie o servidor de desenvolvimento após alterar o `.env`
- No Vercel, verifique se as variáveis estão configuradas corretamente

### Erro: "Invalid API Key"

- Verifique se a API Key está correta (sem espaços extras)
- Confirme que o API Secret está correto (clique em "Reveal" no dashboard)
- Gere novas credenciais se necessário em **Settings** > **Access Keys**

### Upload muito lento

- Verifique sua conexão de internet
- Considere reduzir o tamanho do arquivo (máx. 500MB)
- O Cloudinary processa o vídeo após o upload, isso pode levar alguns minutos

### Erro: "Upload preset not found"

O sistema não usa presets customizados, então este erro não deve ocorrer. Se ocorrer:
- Verifique se você modificou o código de upload
- Use o código original do arquivo `app/api/upload/route.ts`

## 8. Limites do Plano Gratuito

O plano gratuito do Cloudinary oferece:
- 25 GB de armazenamento
- 25 GB de bandwidth mensal
- 1000 transformações mensais
- Uploads até 100MB por arquivo (configurável)

Para mais recursos, consulte os planos pagos em: https://cloudinary.com/pricing

## 9. Segurança

### Proteger Credenciais

- NUNCA commite o arquivo `.env` no Git (já está no `.gitignore`)
- Use variáveis de ambiente no Vercel para produção
- Rotacione as chaves periodicamente em **Settings** > **Access Keys**

### Upload Restrictions

O sistema já implementa validações:
- Apenas arquivos MP4
- Limite de 500MB por arquivo
- Assinatura SHA-1 para uploads seguros

## 10. Recursos Adicionais

- [Documentação Oficial](https://cloudinary.com/documentation)
- [Upload API](https://cloudinary.com/documentation/upload_videos)
- [Video Transformations](https://cloudinary.com/documentation/video_manipulation_and_delivery)
- [Suporte](https://support.cloudinary.com/)

---

**Pronto!** Seu sistema de upload de vídeos está configurado e funcionando em produção.
