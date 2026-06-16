# Pink Aura — Vitrine (site público)

Vitrine de moda feminina Pink Aura. Versão atual, já com a **transição em onda**
entre o hero (banner) e o catálogo.

## Arquivos
- `Pink Aura.dc.html` — a página completa (header, hero, catálogo, modal, footer + lógica).
- `support.js` — runtime necessário para a página rodar. **Mantenha ao lado do .html.**
- `assets/` — lírio (logo) + favicons (16/32/180/512px).

## Como abrir
Abra `Pink Aura.dc.html` num servidor estático (ou direto no navegador). Por usar
fontes do Google e o `support.js`, o ideal é servir a pasta, por ex.:
```
npx serve pink_aura_site
```

## Sobre o formato
Este HTML é um "Design Component": markup com lógica embutida (filtros de categoria,
modal de produto, botões de WhatsApp com mensagem pré-preenchida). Para um codebase de
produção (React/Vue/HTML puro), use-o como **referência de design de alta fidelidade**
— recrie os componentes nos padrões do seu projeto.

### Configurável (props no topo do componente)
- `whatsappNumber` — número da loja (placeholder `5511999999999`, **troque pelo real**).
- `collectionTag` — texto da tag do hero ("Nova Coleção").
- `showWatermark` — liga/desliga o watermark "PINK aura" do fundo.

## Tokens da marca
magenta #C9177C · vinho #6B0A3C · rosa #EF8BBF · blush #F5C6DD · creme #F5EFA0 ·
lavanda #D4B8E0 · periwinkle #B8CDE8 · taupe #C4B5A8 · bg #FDF0F5 · whatsapp #25D366
Fontes: Cormorant Garamond (títulos) · Dancing Script (logo/detalhes) · Nunito (UI).

## Observações
- As fotos dos produtos são **placeholders editoriais** (lírio + gradiente da editoria).
  Substitua por fotos reais 3/4.
- O favicon já está vinculado no `<head>`.
