/* =============================================
   CONFIGURAÇÕES — gerenciadas pelo painel admin
   ============================================= */
const _cfg = JSON.parse(localStorage.getItem('pinkAura_config') || '{}');
const WHATSAPP_NUMBER = _cfg.whatsapp  || "5511999999999";
const BRAND_NAME      = _cfg.brandName || "Sua Marca";

// Sobrescreve produtos com os salvos no painel admin
(function () {
  const saved = localStorage.getItem('pinkAura_products');
  if (saved) {
    try {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr) && arr.length > 0) {
        PRODUCTS.splice(0, PRODUCTS.length, ...arr);
      }
    } catch {}
  }
})();

/* =============================================
   Estado interno
   ============================================= */
let fotoAtualModal = 0;
let produtoAtualModal = null;
let corSelecionada = null;
let tamanhoSelecionado = null;

/* =============================================
   Ícone SVG do WhatsApp (reutilizado)
   ============================================= */
const iconWA = `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.057 23.886c-.063.252.179.487.43.418l6.188-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.381l-.36-.214-3.725.977.994-3.634-.235-.373A9.818 9.818 0 1112 21.818z"/>
</svg>`;

/* =============================================
   WhatsApp URL
   ============================================= */
function buildWhatsAppLink(produto) {
  let msg = `Olá! Vi na vitrine e tenho interesse no produto: *${produto.name}*`;
  if (tamanhoSelecionado) msg += ` — Tamanho: *${tamanhoSelecionado}*`;
  if (corSelecionada)     msg += ` — Cor: *${corSelecionada}*`;
  msg += `. Poderia me passar mais informações?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function whatsappLinkSimples(nomeProduto) {
  const msg = `Olá! Vi na vitrine e tenho interesse no produto: *${nomeProduto}*. Poderia me passar mais informações?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/* =============================================
   Renderizar produtos
   ============================================= */
function renderProdutos(filtro = 'todas') {
  const grade = document.getElementById('grade-produtos');
  const lista = filtro === 'todas'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === filtro);

  if (lista.length === 0) {
    grade.innerHTML = `
      <div class="sem-resultados" role="status">
        <p>Nenhuma peça encontrada nessa categoria.</p>
      </div>`;
    return;
  }

  grade.innerHTML = lista.map(produto => {
    const coresHtml = produto.colors.slice(0, 4).map(c =>
      `<span class="swatch-mini" style="background:${c.hex}" aria-label="${c.label}" title="${c.label}"></span>`
    ).join('');
    const extras = produto.colors.length > 4
      ? `<span class="swatch-mais">+${produto.colors.length - 4}</span>` : '';

    const tamanhosHtml = produto.sizes.map(s =>
      `<span class="pill-tamanho-mini">${s}</span>`
    ).join('');

    const precoHtml = produto.price
      ? `<p class="card-preco">${produto.price}</p>` : '';

    return `
      <article class="card-produto" data-id="${produto.id}"
               onclick="abrirModal('${produto.id}')"
               role="button" tabindex="0"
               aria-label="Ver detalhes: ${produto.name}">
        <div class="card-foto-wrapper">
          <img class="card-foto"
               src="${produto.images[0]}"
               alt="${produto.name}"
               loading="lazy">
          <span class="card-categoria">${produto.category}</span>
          <a href="${whatsappLinkSimples(produto.name)}"
             class="card-btn-whatsapp"
             target="_blank"
             rel="noopener noreferrer"
             onclick="event.stopPropagation()"
             aria-label="Comprar ${produto.name} via WhatsApp">
            ${iconWA}
          </a>
        </div>
        <div class="card-info">
          <h3 class="card-nome">${produto.name}</h3>
          ${precoHtml}
          <div class="card-cores">${coresHtml}${extras}</div>
          <div class="card-tamanhos">${tamanhosHtml}</div>
        </div>
      </article>`;
  }).join('');

  // Permitir abrir card com Enter/Space
  grade.querySelectorAll('.card-produto').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        abrirModal(card.dataset.id);
      }
    });
  });
}

/* =============================================
   Filtros
   ============================================= */
function configurarFiltros() {
  const categorias = ['todas', ...new Set(PRODUCTS.map(p => p.category))];
  const container = document.getElementById('filtros');

  container.innerHTML = categorias.map(cat => {
    const label = cat === 'todas' ? 'Todas' : cat;
    return `<button class="btn-filtro${cat === 'todas' ? ' ativo' : ''}"
                     data-cat="${cat}"
                     aria-pressed="${cat === 'todas'}">${label}</button>`;
  }).join('');

  container.addEventListener('click', e => {
    const btn = e.target.closest('.btn-filtro');
    if (!btn) return;

    container.querySelectorAll('.btn-filtro').forEach(b => {
      b.classList.remove('ativo');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('ativo');
    btn.setAttribute('aria-pressed', 'true');
    renderProdutos(btn.dataset.cat);
  });
}

/* =============================================
   Modal
   ============================================= */
function abrirModal(id) {
  const produto = PRODUCTS.find(p => p.id === id);
  if (!produto) return;

  produtoAtualModal = produto;
  corSelecionada = null;
  tamanhoSelecionado = null;
  fotoAtualModal = 0;

  // Preencher info
  document.getElementById('modal-categoria').textContent = produto.category;
  document.getElementById('modal-nome').textContent      = produto.name;
  document.getElementById('modal-preco').textContent     = produto.price || '';
  document.getElementById('modal-descricao').textContent = produto.description;
  document.getElementById('modal-preco').style.display   = produto.price ? '' : 'none';

  // Galeria
  const fotoPrincipal = document.getElementById('modal-foto-principal');
  fotoPrincipal.src = produto.images[0];
  fotoPrincipal.alt = produto.name;

  const thumbsContainer = document.getElementById('modal-thumbs');
  thumbsContainer.innerHTML = produto.images.map((src, i) =>
    `<img class="modal-thumb${i === 0 ? ' ativa' : ''}"
          src="${src}"
          alt="${produto.name} — foto ${i + 1}"
          data-index="${i}"
          onclick="trocarFoto(${i})">`
  ).join('');

  // Cores
  const coresContainer = document.getElementById('modal-cores');
  coresContainer.innerHTML = produto.colors.map((c, i) =>
    `<button class="swatch-modal"
             style="background:${c.hex}"
             data-cor="${c.label}"
             data-index="${i}"
             aria-label="Cor ${c.label}"
             title="${c.label}"
             onclick="selecionarCor(this, '${c.label}')"></button>`
  ).join('');

  // Tamanhos
  const tamanhosContainer = document.getElementById('modal-tamanhos');
  tamanhosContainer.innerHTML = produto.sizes.map(s =>
    `<button class="btn-tamanho"
             data-tamanho="${s}"
             onclick="selecionarTamanho(this, '${s}')">${s}</button>`
  ).join('');

  // Link WhatsApp
  atualizarBotaoWhatsApp();

  // Exibir modal
  const overlay = document.getElementById('modal');
  overlay.classList.add('aberto');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';

  // Foco no fechar
  setTimeout(() => document.getElementById('modal-fechar').focus(), 50);
}

function fecharModal() {
  const overlay = document.getElementById('modal');
  overlay.classList.remove('aberto');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  produtoAtualModal = null;
}

function trocarFoto(index) {
  fotoAtualModal = index;
  const foto = document.getElementById('modal-foto-principal');
  foto.src = produtoAtualModal.images[index];
  foto.alt = `${produtoAtualModal.name} — foto ${index + 1}`;

  document.querySelectorAll('.modal-thumb').forEach((t, i) => {
    t.classList.toggle('ativa', i === index);
  });
}

function selecionarCor(el, cor) {
  corSelecionada = cor;
  document.querySelectorAll('.swatch-modal').forEach(s => s.classList.remove('selecionado'));
  el.classList.add('selecionado');
  atualizarBotaoWhatsApp();
}

function selecionarTamanho(el, tamanho) {
  tamanhoSelecionado = tamanho;
  document.querySelectorAll('.btn-tamanho').forEach(b => b.classList.remove('selecionado'));
  el.classList.add('selecionado');
  atualizarBotaoWhatsApp();
}

function atualizarBotaoWhatsApp() {
  if (!produtoAtualModal) return;
  const btn = document.getElementById('modal-btn-whatsapp');
  btn.href = buildWhatsAppLink(produtoAtualModal);
}

/* =============================================
   Inicialização
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {
  // Preencher nome da marca onde aparece
  document.querySelectorAll('[data-brand]').forEach(el => {
    el.textContent = BRAND_NAME;
  });

  // Link global de contato WhatsApp (header e footer)
  const msgContato = `Olá! Gostaria de saber mais sobre os produtos da ${BRAND_NAME}.`;
  const urlContato = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msgContato)}`;
  document.querySelectorAll('[data-whatsapp-contato]').forEach(el => {
    el.href = urlContato;
  });

  // Aplicar config do painel admin ao site
  if (_cfg.heroTag)         { const el = document.getElementById('hero-tag');         if (el) el.textContent = _cfg.heroTag; }
  if (_cfg.heroTitle)       { const el = document.getElementById('hero-titulo');       if (el) el.textContent = _cfg.heroTitle; }
  if (_cfg.heroSubtitle)    { const el = document.getElementById('hero-subtitle');     if (el) el.textContent = _cfg.heroSubtitle; }
  if (_cfg.catalogTitle)    { const el = document.getElementById('catalog-title');     if (el) el.textContent = _cfg.catalogTitle; }
  if (_cfg.catalogSubtitle) { const el = document.getElementById('catalog-subtitle'); if (el) el.textContent = _cfg.catalogSubtitle; }
  if (_cfg.footerFrase)     { const el = document.getElementById('footer-frase');     if (el) el.textContent = _cfg.footerFrase; }

  configurarFiltros();
  renderProdutos('todas');

  // Fechar modal clicando no overlay
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) fecharModal();
  });

  // Fechar com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharModal();
  });

  // Botão fechar
  document.getElementById('modal-fechar').addEventListener('click', fecharModal);

  // Scroll suave do hero para o catálogo
  const btnHero = document.getElementById('btn-ver-colecao');
  if (btnHero) {
    btnHero.addEventListener('click', () => {
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
    });
  }
});
