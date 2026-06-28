/* =============================================
   CONFIGURAÇÕES — carregadas do Supabase
   ============================================= */
let WHATSAPP_NUMBER = '5511999999999';
let BRAND_NAME      = 'Pink Aura';
let PRODUCTS        = [];
let SOLD_OUT_MSG    = 'Esta peça está esgotada no momento. 💗 Fale com a gente pelo WhatsApp para saber sobre reposição!';
let LOAD_ERROR      = false;

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

function whatsappAvisemeLink(produto) {
  const msg = `Olá! O produto *${produto.name}* está esgotado na vitrine. Pode me avisar quando tiver reposição? 💗`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

/* =============================================
   Carrinho
   ============================================= */
const CART_KEY = 'pinkAura_cart';
let cart = [];

function loadCart() {
  try { cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); } catch { cart = []; }
  updateCartBadge();
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadge();
}

function cartKey(produtoId, cor, tamanho) {
  return `${produtoId}|${cor || ''}|${tamanho || ''}`;
}

function addToCart(produto, cor, tamanho) {
  if (produto.soldOut) return; // peça esgotada não pode ir ao carrinho
  const key = cartKey(produto.id, cor, tamanho);
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.quantity++;
  } else {
    cart.push({
      key,
      productId: produto.id,
      name: produto.name,
      image: produto.images[0],
      price: produto.price || null,
      priceOriginal: produto.priceOriginal || null,
      color: cor || null,
      size: tamanho || null,
      quantity: 1
    });
  }
  saveCart();
  renderCart();
  openCart();
}

function removeCartItem(key) {
  cart = cart.filter(i => i.key !== key);
  saveCart();
  renderCart();
}

function updateCartQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.quantity = Math.max(1, item.quantity + delta);
  saveCart();
  renderCart();
}

function updateCartBadge() {
  const total = cart.reduce((s, i) => s + i.quantity, 0);
  const badge = document.getElementById('cart-count-badge');
  if (!badge) return;
  badge.textContent = total;
  badge.hidden = total === 0;
}

function renderCart() {
  const wrap      = document.getElementById('cart-items-wrap');
  const empty     = document.getElementById('cart-empty');
  const footer    = document.getElementById('cart-footer');
  const pill      = document.getElementById('cart-count-drawer');
  const resumo    = document.getElementById('cart-resumo');
  const total     = cart.reduce((s, i) => s + i.quantity, 0);

  pill.textContent = total;

  if (cart.length === 0) {
    wrap.innerHTML = '';
    empty.hidden = false;
    footer.hidden = true;
    return;
  }

  empty.hidden = true;
  footer.hidden = false;
  resumo.textContent = `${total} ${total === 1 ? 'item' : 'itens'} no carrinho`;

  wrap.innerHTML = cart.map(item => {
    const det = [item.color, item.size].filter(Boolean).join(' · ');
    const keyEsc = item.key.replace(/'/g, "\\'");
    return `
      <div class="cart-item">
        <img class="cart-item-foto" src="${item.image}" alt="${item.name}" loading="lazy">
        <div class="cart-item-info">
          <p class="cart-item-nome">${item.name}</p>
          ${det ? `<p class="cart-item-detalhes">${det}</p>` : ''}
          ${item.price ? `<p class="cart-item-preco">${item.price}</p>` : ''}
        </div>
        <div class="cart-item-ctrl">
          <div class="cart-qty-wrap">
            <button class="cart-qty-btn" onclick="updateCartQty('${keyEsc}',-1)" aria-label="Diminuir">−</button>
            <span class="cart-qty">${item.quantity}</span>
            <button class="cart-qty-btn" onclick="updateCartQty('${keyEsc}',1)" aria-label="Aumentar">+</button>
          </div>
          <button class="cart-remove" onclick="removeCartItem('${keyEsc}')" aria-label="Remover">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>`;
  }).join('');

  document.getElementById('cart-btn-whatsapp').href = buildWhatsAppOrderUrl();
}

function buildWhatsAppOrderUrl() {
  let msg = `Olá! Tenho interesse nas seguintes peças da ${BRAND_NAME}:\n\n`;
  cart.forEach((item, i) => {
    msg += `${i + 1}. *${item.name}*`;
    if (item.quantity > 1) msg += ` (${item.quantity}x)`;
    msg += '\n';
    if (item.color) msg += `   Cor: ${item.color}\n`;
    if (item.size)  msg += `   Tamanho: ${item.size}\n`;
    if (item.price) msg += `   Preço: ${item.price}\n`;
    msg += '\n';
  });
  const total = cart.reduce((s, i) => s + i.quantity, 0);
  msg += `Total: ${total} ${total === 1 ? 'item' : 'itens'}\n\nPoderia me passar mais informações sobre disponibilidade e entrega?`;
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
}

function openCart() {
  const overlay = document.getElementById('cart-overlay');
  overlay.classList.add('aberto');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  setTimeout(() => document.getElementById('cart-fechar').focus(), 50);
}

function closeCart() {
  const overlay = document.getElementById('cart-overlay');
  overlay.classList.remove('aberto');
  overlay.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

/* =============================================
   Preços com comparação
   ============================================= */
function parsePreco(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}

function calcDesconto(preco, precoOriginal) {
  const atual = parsePreco(preco);
  const orig  = parsePreco(precoOriginal);
  if (!orig || orig <= atual) return 0;
  return Math.round((1 - atual / orig) * 100);
}

function buildPrecoCardHtml(produto) {
  if (!produto.price) return '';
  if (!produto.priceOriginal) {
    return `<p class="card-preco">${produto.price}</p>`;
  }
  const pct = calcDesconto(produto.price, produto.priceOriginal);
  const badge = pct > 0
    ? `<span class="price-badge">−${pct}%</span>` : '';
  return `
    <div class="card-preco-grupo">
      <div class="card-preco-linha">
        <span class="card-preco-atual">${produto.price}</span>
        ${badge}
      </div>
      <span class="card-preco-original">de ${produto.priceOriginal}</span>
    </div>`;
}

function renderModalPreco(produto) {
  const el = document.getElementById('modal-preco');
  if (!produto.price) { el.style.display = 'none'; return; }
  el.style.display = '';
  if (!produto.priceOriginal) {
    el.innerHTML = `<span class="modal-preco-atual">${produto.price}</span>`;
    return;
  }
  const pct = calcDesconto(produto.price, produto.priceOriginal);
  const badge = pct > 0
    ? `<span class="modal-badge-desconto">−${pct}%</span>` : '';
  el.innerHTML = `
    <span class="modal-preco-atual">${produto.price}</span>
    ${badge}
    <span class="modal-preco-original">de ${produto.priceOriginal}</span>`;
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
    let msg;
    if (LOAD_ERROR) {
      msg = 'Não foi possível carregar a vitrine agora. Verifique a conexão e recarregue a página.';
    } else if (PRODUCTS.length === 0) {
      msg = 'Nenhuma peça cadastrada ainda. Volte em breve! 💗';
    } else {
      msg = 'Nenhuma peça encontrada nessa categoria.';
    }
    grade.innerHTML = `
      <div class="sem-resultados" role="status">
        <p>${msg}</p>
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

    const precoHtml = buildPrecoCardHtml(produto);
    const esgotado  = produto.soldOut === true;

    return `
      <article class="card-produto${esgotado ? ' esgotado' : ''}" data-id="${produto.id}"
               onclick="abrirModal('${produto.id}')"
               role="button" tabindex="0"
               aria-label="Ver detalhes: ${produto.name}${esgotado ? ' (esgotado)' : ''}">
        <div class="card-foto-wrapper">
          <img class="card-foto"
               src="${produto.images[0]}"
               alt="${produto.name}"
               loading="lazy">
          <span class="card-categoria">${produto.category}</span>
          ${esgotado ? '<span class="card-esgotado-selo">Esgotado</span>' : ''}
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
  document.getElementById('modal-descricao').textContent = produto.description;
  renderModalPreco(produto);

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
             data-img-index="${c.imageIndex ?? 0}"
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

  // Estado de esgotado: mostra aviso especial e oculta o botão de compra
  const esgotadoBox = document.getElementById('modal-esgotado');
  const addBtn      = document.getElementById('modal-btn-adicionar');
  if (produto.soldOut) {
    document.getElementById('modal-esgotado-msg').textContent = SOLD_OUT_MSG;
    document.getElementById('modal-esgotado-wa').href = whatsappAvisemeLink(produto);
    esgotadoBox.hidden = false;
    addBtn.style.display = 'none';
  } else {
    esgotadoBox.hidden = true;
    addBtn.style.display = '';
  }

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
  const imgIndex = parseInt(el.dataset.imgIndex ?? '0', 10);
  if (produtoAtualModal.images[imgIndex] !== undefined) trocarFoto(imgIndex);
}

function selecionarTamanho(el, tamanho) {
  tamanhoSelecionado = tamanho;
  document.querySelectorAll('.btn-tamanho').forEach(b => b.classList.remove('selecionado'));
  el.classList.add('selecionado');
}

/* =============================================
   Inicialização via Supabase
   ============================================= */
async function initFromSupabase() {
  try {
    const [cfgRes, prodRes] = await Promise.all([
      supabase.from('site_config').select('key, value'),
      supabase.from('products').select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false }),
    ]);
    const { data: cfgRows } = cfgRes;
    const { data: prodRows, error: prodErr } = prodRes;

    if (cfgRows) {
      const cfg = {};
      cfgRows.forEach(r => { cfg[r.key] = r.value; });
      if (cfg.whatsapp)        WHATSAPP_NUMBER = cfg.whatsapp;
      const el = (id) => document.getElementById(id);
      if (cfg.heroTag)         { const e = el('hero-tag');         if (e) e.textContent = cfg.heroTag; }
      if (cfg.heroTitle)       { const e = el('hero-titulo');       if (e) e.textContent = cfg.heroTitle; }
      if (cfg.heroSubtitle)    { const e = el('hero-subtitle');     if (e) e.textContent = cfg.heroSubtitle; }
      if (cfg.catalogTitle)    { const e = el('catalog-title');     if (e) e.textContent = cfg.catalogTitle; }
      if (cfg.catalogSubtitle) { const e = el('catalog-subtitle'); if (e) e.textContent = cfg.catalogSubtitle; }
      if (cfg.footerFrase)     { const e = el('footer-frase');     if (e) e.textContent = cfg.footerFrase; }
      if (cfg.soldOutMessage)  SOLD_OUT_MSG = cfg.soldOutMessage;
    }

    if (prodErr) {
      LOAD_ERROR = true;
      console.error('Erro ao carregar produtos do Supabase:', prodErr);
    } else if (prodRows) {
      PRODUCTS = prodRows.map(r => ({
        id:            r.id,
        name:          r.name,
        category:      r.category,
        price:         r.price          || '',
        priceOriginal: r.price_original || undefined,
        description:   r.description   || '',
        colors:        r.colors         || [],
        sizes:         r.sizes          || [],
        images:        r.images         || [],
        soldOut:       r.sold_out === true,
      }));
    }
  } catch (err) {
    LOAD_ERROR = true;
    console.error('Erro ao carregar dados do Supabase:', err);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  // Carregar dados do Supabase antes de renderizar
  await initFromSupabase();

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

  configurarFiltros();
  renderProdutos('todas');

  // Carrinho — init
  loadCart();
  renderCart();

  document.getElementById('btn-carrinho').addEventListener('click', openCart);
  document.getElementById('cart-fechar').addEventListener('click', closeCart);
  document.getElementById('cart-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) closeCart();
  });

  // Adicionar ao carrinho (modal)
  document.getElementById('modal-btn-adicionar').addEventListener('click', () => {
    if (!produtoAtualModal) return;
    addToCart(produtoAtualModal, corSelecionada, tamanhoSelecionado);
    fecharModal();
  });

  // Fechar modal clicando no overlay
  document.getElementById('modal').addEventListener('click', e => {
    if (e.target === e.currentTarget) fecharModal();
  });

  // Fechar modal ou carrinho com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      fecharModal();
      closeCart();
    }
  });

  // Botão fechar modal
  document.getElementById('modal-fechar').addEventListener('click', fecharModal);

  // Scroll suave do hero para o catálogo
  const btnHero = document.getElementById('btn-ver-colecao');
  if (btnHero) {
    btnHero.addEventListener('click', () => {
      document.getElementById('catalogo').scrollIntoView({ behavior: 'smooth' });
    });
  }
});
