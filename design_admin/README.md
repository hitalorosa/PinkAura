# Pink Aura — Painel Administrativo

Redesign mobile-first e acessível (WCAG 2.1 AA) do admin da vitrine Pink Aura.

## Arquivos
- `admin.html` — estrutura (já com favicon no `<head>`).
- `css/admin.css` — todo o visual (mobile-first, tokens da marca).
- `js/admin.js` — **DEMONSTRAÇÃO** (só para visualizar funcionando).
- `assets/` — lírio (logo) + favicons (16/32/180/512px).

## Como usar
Abra `admin.html` num navegador. Login de demonstração:
- **usuário:** `admin`
- **senha:** `pinkaura`

## ⚠️ Integração no seu projeto
- Os **IDs e classes** do HTML batem com o contrato do seu `admin.js` real.
  Mantenha o **seu** `admin.js` — o incluído aqui é apenas demo (troque as
  credenciais e ligue a persistência real se for usá-lo como base).
- O **favicon** já está vinculado no `<head>` (`assets/favicon-*.png`).
  Em produção, mova os PNGs para a pasta pública e ajuste os caminhos se necessário.

## Tokens da marca
magenta #C9177C · vinho #6B0A3C · sidebar #2D0B1A · blush #F5C6DD · bg #FDF0F5 · whatsapp #25D366
Fontes: Cormorant Garamond (headings) · Dancing Script (logo/detalhes) · Nunito (UI).

## Acessibilidade
Contraste AA, foco visível magenta, labels associados, `role="alert"`/`aria-live`,
`aria-current` na navegação, touch targets ≥44px, inputs 16px (sem zoom iOS),
`prefers-reduced-motion`.
