# App de Designações (PWA)

Aplicativo PWA offline-first para gerenciar designações de Limpeza e Saída de Campo.
Desenvolvido com React, Vite, TailwindCSS e Dexie (IndexedDB).

## Funcionalidades

- **Offline-first**: Funciona sem internet.
- **Instalável**: Adicione à tela de início (Android/iOS).
- **Designações de Limpeza**: Organizadas por mês.
- **Saída de Campo**: Lista por ordem cronológica com destaque para eventos especiais.
- **Relatórios**: Geração de imagens PNG para compartilhamento no WhatsApp.
- **Admin**: Protegido por PIN para adicionar/editar designações.
- **Backup**: Exportar e importar dados via JSON.

## Como Rodar Localmente

1. Clone o projeto e entre na pasta:
   ```bash
   cd appdesignacaos
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Rode o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

4. Acesse `http://localhost:5173`.

## Como Gerar Build (Produção)

Para criar a versão otimizada para produção:

```bash
npm run build
```

A pasta `dist` será gerada com os arquivos estáticos prontos para deploy.

## Como Publicar (Vercel/Netlify)

Este projeto é estático (SPA), então pode ser hospedado em qualquer serviço de estáticos.

**Vercel (Recomendado):**
1. Instale a Vercel CLI: `npm i -g vercel`
2. Rode `vercel` na raiz do projeto.
3. Siga as instruções (aceite os padrões).

**Netlify:**
1. Arraste a pasta `dist` para o site do Netlify Drop.

## PWA e Instalação

O app está configurado como PWA.

- **Android (Chrome):** Toque em "Adicionar à Tela de Início" quando aparecer o banner ou no menu do navegador.
- **iOS (Safari):** Toque no botão "Compartilhar" (quadrado com seta) > "Adicionar à Tela de Início".

## Admin e Backup

- **PIN Padrão:** `0000` ou `1914`.
- Vá em "Configurações" para entrar no modo Admin.
- Use o botão "Backup (JSON)" frequentemente para salvar seus dados.
- Em caso de troca de celular, use "Restaurar Backup" no novo aparelho.

## Estrutura do Projeto

- `src/db.ts`: Configuração do banco de dados e dados iniciais (Seed).
- `src/pages`: Telas do aplicativo.
- `src/components/ui.tsx`: Componentes reutilizáveis.
- `vite.config.ts`: Configuração do PWA e plugins.
