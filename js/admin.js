/* =============================================
   PinkAura — Painel Administrativo
   Login inicial: admin / pinkAura@2024
   ============================================= */

const ADMIN_DEFAULTS = { user: 'admin', pass: 'pinkAura@2024' };
const SESSION_KEY    = 'pinkAura_session';
const CONFIG_KEY     = 'pinkAura_config';
const PRODUCTS_KEY   = 'pinkAura_products';
const CREDS_KEY      = 'pinkAura_creds';

let products   = [];
let editingId  = null;
let colorCount = 1;
let imageCount = 1;

/* =============================================
   Autenticação
   ============================================= */
function getCredentials() {
  const stored = localStorage.getItem(CREDS_KEY);
  return stored ? JSON.parse(stored) : { ...ADMIN_DEFAULTS };
}

function isLoggedIn() {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return false;
  try {
    const { expires } = JSON.parse(raw);
    return Date.now() < expires;
  } catch { return false; }
}

function login(user, pass) {
  const creds = getCredentials();
  if (user === creds.user && pass === creds.pass) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({
      expires: Date.now() + 24 * 60 * 60 * 1000
    }));
    return true;
  }
  return false;
}

function logout() {
  localStorage.removeItem(SESSION_KEY);
  location.reload();
}

/* =============================================
   Telas — transição suave
   ============================================= */
function showLogin() {
  document.getElementById('login-screen').classList.remove('exit');
  document.getElementById('admin-panel').classList.remove('visible');
  document.getElementById('login-error').hidden = true;
  document.getElementById('login-user').value   = '';
  document.getElementById('login-pass').value   = '';
  document.getElementById('login-user').focus();
}

function showAdmin() {
  const loginScreen = document.getElementById('login-screen');

  loadProducts();
  switchTab('produtos');

  // Login faz animação de saída enquanto o painel já está atrás
  loginScreen.classList.add('exit');
  setTimeout(() => { loginScreen.hidden = true; }, 360);
}

/* =============================================
   Tabs
   ============================================= */
function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b =>
    b.classList.toggle('ativo', b.dataset.tab === tab)
  );
  document.querySelectorAll('.tab-content').forEach(c => {
    c.hidden = (c.id !== `tab-${tab}`);
  });
  if (tab === 'produtos') renderProductList();
  if (tab === 'site')     loadSiteConfig();
  if (tab === 'senha') {
    document.getElementById('senha-atual').value     = '';
    document.getElementById('senha-nova').value      = '';
    document.getElementById('senha-confirmar').value = '';
  }
}

/* =============================================
   Produtos — CRUD
   ============================================= */
function loadProducts() {
  const saved = localStorage.getItem(PRODUCTS_KEY);
  if (saved) {
    try { products = JSON.parse(saved); return; } catch {}
  }
  if (typeof PRODUCTS !== 'undefined') {
    products = JSON.parse(JSON.stringify(PRODUCTS));
  } else {
    products = [];
  }
}

function saveProducts() {
  localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
}

function renderProductList() {
  const container = document.getElementById('lista-produtos');
  if (products.length === 0) {
    container.innerHTML = '<p class="empty-msg">Nenhum produto cadastrado. Clique em "+ Novo Produto" para começar.</p>';
    return;
  }
  container.innerHTML = products.map(p => `
    <div class="product-row">
      <img src="${escHtml(p.images[0])}" alt="${escHtml(p.name)}" class="product-thumb"
           onerror="this.style.background='#fce4ec';this.removeAttribute('src')">
      <div class="product-row-info">
        <strong>${escHtml(p.name)}</strong>
        <span>${escHtml(p.category)}${p.price ? ' — ' + escHtml(p.price) : ''}</span>
      </div>
      <div class="product-row-actions">
        <button class="btn-edit"   onclick="editProduct('${escHtml(p.id)}')">Editar</button>
        <button class="btn-delete" onclick="deleteProduct('${escHtml(p.id)}')">Excluir</button>
      </div>
    </div>
  `).join('');
}

function deleteProduct(id) {
  if (!confirm('Excluir este produto? Esta ação não pode ser desfeita.')) return;
  products = products.filter(p => p.id !== id);
  saveProducts();
  renderProductList();
  showToast('Produto excluído!');
}

function newProduct() {
  editingId = null;
  document.getElementById('form-title').textContent = 'Novo Produto';
  resetForm();
  document.getElementById('product-form-section').hidden = false;
  document.getElementById('form-produto').scrollIntoView({ behavior: 'smooth' });
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('form-title').textContent = 'Editar Produto';
  fillForm(p);
  document.getElementById('product-form-section').hidden = false;
  document.getElementById('form-produto').scrollIntoView({ behavior: 'smooth' });
}

function cancelForm() {
  document.getElementById('product-form-section').hidden = true;
  editingId = null;
}

/* ---- Helpers de linha ---- */
function colorRow(label, hex) {
  return `
    <div class="color-row">
      <input type="text"  class="color-label" placeholder="Nome da cor (ex: Rosa)" value="${escHtml(label)}">
      <input type="color" class="color-hex"   value="${escHtml(hex)}">
      <button type="button" class="btn-remove-row" onclick="removeRow(this,'color-row')" aria-label="Remover cor">×</button>
    </div>`;
}

function imageRow(url) {
  const hasImg = url && url.length > 0;
  return `
    <div class="image-row">
      <img class="image-thumb" src="${escHtml(url)}" ${hasImg ? '' : 'hidden'} alt="preview">
      <input type="text" class="image-url" placeholder="Cole uma URL ou use o botão Upload" value="${escHtml(url)}">
      <label class="btn-upload" title="Enviar imagem do computador">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Upload
        <input type="file" class="image-file" accept="image/*">
      </label>
      <button type="button" class="btn-remove-row" onclick="removeRow(this,'image-row')" aria-label="Remover imagem">×</button>
    </div>`;
}

/* ---- Reset / preenchimento ---- */
const STD_SIZES = ['PP','P','M','G','GG','XG','U'];

function resetForm() {
  document.getElementById('prod-name').value            = '';
  document.getElementById('prod-category').value        = '';
  document.getElementById('prod-category-custom').value = '';
  document.getElementById('cat-custom-field').hidden    = true;
  document.getElementById('prod-price').value           = '';
  document.getElementById('prod-description').value     = '';
  document.getElementById('colors-list').innerHTML      = colorRow('', '#c2185b');
  document.getElementById('images-list').innerHTML      = imageRow('');
  document.querySelectorAll('.size-checkbox').forEach(cb => cb.checked = false);
  document.getElementById('custom-sizes').value         = '';
  colorCount = 1;
  imageCount = 1;
}

function fillForm(p) {
  document.getElementById('prod-name').value        = p.name;
  document.getElementById('prod-price').value       = p.price || '';
  document.getElementById('prod-description').value = p.description || '';

  const stdCats = ['Vestidos','Blusas','Calças','Saias','Conjuntos','Acessórios'];
  const catSel  = document.getElementById('prod-category');
  if (stdCats.includes(p.category)) {
    catSel.value = p.category;
    document.getElementById('cat-custom-field').hidden = true;
  } else {
    catSel.value = 'Outra';
    document.getElementById('cat-custom-field').hidden = false;
    document.getElementById('prod-category-custom').value = p.category;
  }

  document.getElementById('colors-list').innerHTML =
    (p.colors || []).map(c => colorRow(c.label, c.hex)).join('');
  colorCount = (p.colors || []).length;

  document.querySelectorAll('.size-checkbox').forEach(cb => {
    cb.checked = (p.sizes || []).includes(cb.value);
  });
  const customSizes = (p.sizes || []).filter(s => !STD_SIZES.includes(s));
  document.getElementById('custom-sizes').value = customSizes.join(', ');

  document.getElementById('images-list').innerHTML =
    (p.images || []).map(url => imageRow(url)).join('');
  imageCount = (p.images || []).length;
}

function addColor() {
  colorCount++;
  document.getElementById('colors-list').insertAdjacentHTML('beforeend', colorRow('', '#c2185b'));
}

function addImage() {
  if (imageCount >= 5) { showToast('Máximo de 5 imagens por produto.', 'warn'); return; }
  imageCount++;
  document.getElementById('images-list').insertAdjacentHTML('beforeend', imageRow(''));
}

function removeRow(btn, cls) {
  const rows = document.querySelectorAll(`.${cls}`);
  if (rows.length <= 1) { showToast('É necessário ao menos 1 item.', 'warn'); return; }
  btn.closest(`.${cls}`).remove();
}

/* ---- Leitura do form ---- */
function getFormData() {
  const catSel   = document.getElementById('prod-category').value;
  const category = catSel === 'Outra'
    ? document.getElementById('prod-category-custom').value.trim()
    : catSel;

  const colors = Array.from(document.querySelectorAll('.color-row')).map(row => ({
    label: row.querySelector('.color-label').value.trim(),
    hex:   row.querySelector('.color-hex').value
  })).filter(c => c.label);

  const checked = Array.from(document.querySelectorAll('.size-checkbox:checked')).map(cb => cb.value);
  const customRaw = document.getElementById('custom-sizes').value;
  const custom    = customRaw ? customRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const sizes     = [...STD_SIZES.filter(s => checked.includes(s)), ...custom.filter(s => !STD_SIZES.includes(s))];

  const images = Array.from(document.querySelectorAll('.image-url')).map(i => i.value.trim()).filter(Boolean);

  return {
    name:        document.getElementById('prod-name').value.trim(),
    category,
    price:       document.getElementById('prod-price').value.trim(),
    description: document.getElementById('prod-description').value.trim(),
    colors, sizes, images,
  };
}

function saveProduct() {
  const data = getFormData();
  if (!data.name)               { showToast('Nome é obrigatório.', 'error'); return; }
  if (!data.category)           { showToast('Categoria é obrigatória.', 'error'); return; }
  if (data.colors.length === 0) { showToast('Adicione pelo menos uma cor.', 'error'); return; }
  if (data.sizes.length === 0)  { showToast('Selecione pelo menos um tamanho.', 'error'); return; }
  if (data.images.length === 0) { showToast('Adicione pelo menos uma imagem.', 'error'); return; }

  if (editingId) {
    const idx = products.findIndex(p => p.id === editingId);
    if (idx !== -1) products[idx] = { id: editingId, ...data };
  } else {
    products.push({ id: Date.now().toString(), ...data });
  }

  saveProducts();
  cancelForm();
  renderProductList();
  showToast(editingId ? 'Produto atualizado!' : 'Produto adicionado!');
  editingId = null;
}

/* =============================================
   Upload de imagem — comprime via canvas
   ============================================= */
function compressImage(file, callback) {
  const img    = new Image();
  const objUrl = URL.createObjectURL(file);
  img.onload = () => {
    URL.revokeObjectURL(objUrl);
    const MAX_W = 900, MAX_H = 1200;
    let w = img.naturalWidth, h = img.naturalHeight;
    if (w > MAX_W || h > MAX_H) {
      const r = Math.min(MAX_W / w, MAX_H / h);
      w = Math.round(w * r);
      h = Math.round(h * r);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    callback(canvas.toDataURL('image/jpeg', 0.82));
  };
  img.onerror = () => {
    URL.revokeObjectURL(objUrl);
    showToast('Erro ao carregar imagem.', 'error');
  };
  img.src = objUrl;
}

/* =============================================
   Preview do produto
   ============================================= */
function previewProduct() {
  const data = getFormData();
  if (!data.name) { showToast('Preencha ao menos o nome para visualizar.', 'warn'); return; }

  const mainImg = data.images[0] || 'https://placehold.co/600x800/fce4ec/c2185b?text=Sem+imagem';

  const swatchesHtml = data.colors.slice(0, 5).map(c =>
    `<span style="width:14px;height:14px;border-radius:50%;background:${c.hex};display:inline-block;border:1.5px solid rgba(0,0,0,.1)" title="${escHtml(c.label)}"></span>`
  ).join('');

  const sizePillsCard = data.sizes.map(s =>
    `<span style="font-size:.68rem;font-weight:600;color:#666;background:#f4f4f4;padding:2px 7px;border-radius:4px">${escHtml(s)}</span>`
  ).join('');

  const detailColorsHtml = data.colors.map(c =>
    `<span style="width:28px;height:28px;border-radius:50%;background:${c.hex};display:inline-block;border:2px solid rgba(0,0,0,.1)" title="${escHtml(c.label)}"></span>`
  ).join('');

  const detailSizesHtml = data.sizes.map(s =>
    `<span class="prev-size-pill">${escHtml(s)}</span>`
  ).join('');

  const waIcon = `<svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20" style="flex-shrink:0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.057 23.886c-.063.252.179.487.43.418l6.188-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.381l-.36-.214-3.725.977.994-3.634-.235-.373A9.818 9.818 0 1112 21.818z"/></svg>`;

  document.getElementById('preview-content').innerHTML = `
    <div class="preview-split">
      <div>
        <p class="preview-section-label">Card na vitrine</p>
        <div class="prev-card">
          <div class="prev-card-img-wrap">
            <img class="prev-card-img" src="${escHtml(mainImg)}" alt="${escHtml(data.name)}">
            <span class="prev-badge">${escHtml(data.category || 'Categoria')}</span>
          </div>
          <div class="prev-card-info">
            <h3 class="prev-card-name">${escHtml(data.name)}</h3>
            ${data.price ? `<p class="prev-card-price">${escHtml(data.price)}</p>` : ''}
            <div class="prev-swatches">${swatchesHtml}</div>
            <div class="prev-sizes">${sizePillsCard}</div>
          </div>
        </div>
      </div>

      <div>
        <p class="preview-section-label">Detalhe do produto (modal)</p>
        <div class="prev-detail">
          <p class="prev-detail-cat">${escHtml(data.category || '')}</p>
          <h2 class="prev-detail-name">${escHtml(data.name)}</h2>
          ${data.price ? `<p class="prev-detail-price">${escHtml(data.price)}</p>` : ''}
          ${data.description ? `<p class="prev-detail-desc">${escHtml(data.description)}</p>` : ''}
          ${data.colors.length ? `
            <p class="prev-section-title">Cores disponíveis</p>
            <div class="prev-detail-colors">${detailColorsHtml}</div>
          ` : ''}
          ${data.sizes.length ? `
            <p class="prev-section-title">Tamanhos disponíveis</p>
            <div class="prev-detail-sizes">${detailSizesHtml}</div>
          ` : ''}
          <div class="prev-wa-btn">${waIcon} Quero esse! Falar no WhatsApp</div>
        </div>
      </div>
    </div>`;

  document.getElementById('preview-overlay').hidden = false;
  document.body.style.overflow = 'hidden';
}

function fecharPreview() {
  document.getElementById('preview-overlay').hidden = true;
  document.body.style.overflow = '';
}

/* =============================================
   Configurações do Site
   ============================================= */
function loadSiteConfig() {
  const cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
  document.getElementById('cfg-whatsapp').value         = cfg.whatsapp       || '5511999999999';
  document.getElementById('cfg-hero-tag').value         = cfg.heroTag        || 'Nova Coleção';
  document.getElementById('cfg-hero-title').value       = cfg.heroTitle      || 'Moda feminina com muito estilo';
  document.getElementById('cfg-hero-subtitle').value    = cfg.heroSubtitle   || 'Explore nossa vitrine, escolha a peça que você amar e fale com a gente pelo WhatsApp para realizar o seu pedido.';
  document.getElementById('cfg-catalog-title').value    = cfg.catalogTitle   || 'Nossa Vitrine';
  document.getElementById('cfg-catalog-subtitle').value = cfg.catalogSubtitle|| 'Clique em uma peça para ver todos os detalhes, cores e tamanhos';
  document.getElementById('cfg-footer-frase').value     = cfg.footerFrase    || 'Moda feminina com estilo e qualidade. Fale conosco pelo WhatsApp para realizar seu pedido.';
}

function saveSiteConfig() {
  const existing = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
  const cfg = {
    ...existing,
    whatsapp:        document.getElementById('cfg-whatsapp').value.trim().replace(/\D/g, ''),
    heroTag:         document.getElementById('cfg-hero-tag').value.trim(),
    heroTitle:       document.getElementById('cfg-hero-title').value.trim(),
    heroSubtitle:    document.getElementById('cfg-hero-subtitle').value.trim(),
    catalogTitle:    document.getElementById('cfg-catalog-title').value.trim(),
    catalogSubtitle: document.getElementById('cfg-catalog-subtitle').value.trim(),
    footerFrase:     document.getElementById('cfg-footer-frase').value.trim(),
  };
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
  showToast('Configurações salvas! Atualize a loja para ver as mudanças.');
}

/* =============================================
   Alterar Senha
   ============================================= */
function changePassword() {
  const current   = document.getElementById('senha-atual').value;
  const nova      = document.getElementById('senha-nova').value;
  const confirmar = document.getElementById('senha-confirmar').value;
  const creds     = getCredentials();

  if (current !== creds.pass)  { showToast('Senha atual incorreta.', 'error'); return; }
  if (nova.length < 6)         { showToast('Nova senha: mínimo 6 caracteres.', 'error'); return; }
  if (nova !== confirmar)      { showToast('As senhas não conferem.', 'error'); return; }

  localStorage.setItem(CREDS_KEY, JSON.stringify({ user: creds.user, pass: nova }));
  document.getElementById('senha-atual').value     = '';
  document.getElementById('senha-nova').value      = '';
  document.getElementById('senha-confirmar').value = '';
  showToast('Senha alterada com sucesso!');
}

/* =============================================
   Toast
   ============================================= */
function showToast(msg, type = 'success') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = `toast toast-${type} show`;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3500);
}

/* =============================================
   Escape HTML
   ============================================= */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* =============================================
   Inicialização
   ============================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* Verifica sessão */
  if (isLoggedIn()) {
    document.getElementById('login-screen').hidden = true;
    loadProducts();
    switchTab('produtos');
  } else {
    showLogin();
  }

  /* Login */
  document.getElementById('login-form').addEventListener('submit', e => {
    e.preventDefault();
    const user = document.getElementById('login-user').value.trim();
    const pass = document.getElementById('login-pass').value;
    if (login(user, pass)) {
      showAdmin();
    } else {
      document.getElementById('login-error').hidden = false;
    }
  });

  /* Tabs */
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => switchTab(btn.dataset.tab))
  );

  /* Logout / Ver loja */
  document.getElementById('btn-logout').addEventListener('click', logout);
  document.getElementById('btn-ver-loja').addEventListener('click', () =>
    window.open('index.html', '_blank')
  );

  /* Produto */
  document.getElementById('btn-novo-produto').addEventListener('click', newProduct);
  document.getElementById('btn-salvar-produto').addEventListener('click', saveProduct);
  document.getElementById('btn-cancelar-produto').addEventListener('click', cancelForm);
  document.getElementById('btn-add-color').addEventListener('click', addColor);
  document.getElementById('btn-add-image').addEventListener('click', addImage);
  document.getElementById('btn-preview-produto').addEventListener('click', previewProduct);

  /* Categoria personalizada */
  document.getElementById('prod-category').addEventListener('change', function () {
    document.getElementById('cat-custom-field').hidden = (this.value !== 'Outra');
  });

  /* Upload de imagem — event delegation */
  document.getElementById('form-produto').addEventListener('change', e => {
    if (!e.target.classList.contains('image-file')) return;
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Imagem muito grande. Máximo 5MB.', 'warn');
      return;
    }
    showToast('Carregando imagem...', 'success');
    const row      = e.target.closest('.image-row');
    const urlInput = row.querySelector('.image-url');
    const thumb    = row.querySelector('.image-thumb');
    compressImage(file, dataUrl => {
      urlInput.value = dataUrl;
      thumb.src      = dataUrl;
      thumb.hidden   = false;
      showToast('Imagem carregada!');
    });
  });

  /* Atualiza thumbnail ao digitar URL */
  document.getElementById('form-produto').addEventListener('input', e => {
    if (!e.target.classList.contains('image-url')) return;
    const row   = e.target.closest('.image-row');
    if (!row) return;
    const thumb = row.querySelector('.image-thumb');
    const val   = e.target.value.trim();
    if (val) { thumb.src = val; thumb.hidden = false; }
    else     { thumb.hidden = true; }
  });

  /* Config site */
  document.getElementById('form-site').addEventListener('submit', e => {
    e.preventDefault();
    saveSiteConfig();
  });

  /* Senha */
  document.getElementById('form-senha').addEventListener('submit', e => {
    e.preventDefault();
    changePassword();
  });

  /* Preview — fechar */
  document.getElementById('btn-fechar-preview').addEventListener('click', fecharPreview);
  document.getElementById('preview-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) fecharPreview();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharPreview();
  });
});
