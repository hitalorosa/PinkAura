/* =============================================
   PinkAura — Painel Administrativo
   Login inicial: admin / pinkAura@2024
   ============================================= */

const ADMIN_DEFAULTS = { user: 'admin', pass: 'pinkAura@2024' };
const SESSION_KEY    = 'pinkAura_session';
const CONFIG_KEY     = 'pinkAura_config';
const PRODUCTS_KEY   = 'pinkAura_products';
const CREDS_KEY      = 'pinkAura_creds';

let products    = [];
let editingId   = null;
let colorCount  = 1;
let imageCount  = 1;

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
  showLogin();
}

/* =============================================
   Telas
   ============================================= */
function showLogin() {
  document.getElementById('login-screen').hidden  = false;
  document.getElementById('admin-panel').hidden   = true;
  document.getElementById('login-error').hidden   = true;
  document.getElementById('login-user').value     = '';
  document.getElementById('login-pass').value     = '';
  document.getElementById('login-user').focus();
}

function showAdmin() {
  document.getElementById('login-screen').hidden = true;
  document.getElementById('admin-panel').hidden  = false;
  loadProducts();
  switchTab('produtos');
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
    document.getElementById('senha-atual').value    = '';
    document.getElementById('senha-nova').value     = '';
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
  products = JSON.parse(JSON.stringify(PRODUCTS));
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

/* ---- Form helpers ---- */
function colorRow(label, hex) {
  return `
    <div class="color-row">
      <input type="text"  class="color-label" placeholder="Nome da cor (ex: Rosa)" value="${escHtml(label)}">
      <input type="color" class="color-hex"   value="${escHtml(hex)}">
      <button type="button" class="btn-remove-row" onclick="removeRow(this,'color-row')" aria-label="Remover cor">×</button>
    </div>`;
}

function imageRow(url) {
  return `
    <div class="image-row">
      <input type="url" class="image-url" placeholder="https://..." value="${escHtml(url)}">
      <button type="button" class="btn-remove-row" onclick="removeRow(this,'image-row')" aria-label="Remover imagem">×</button>
    </div>`;
}

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

  const std = ['Vestidos','Blusas','Calças','Saias','Conjuntos','Acessórios'];
  const catSel = document.getElementById('prod-category');
  if (std.includes(p.category)) {
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

  const stdSizes = ['PP','P','M','G','GG','XG'];
  document.querySelectorAll('.size-checkbox').forEach(cb => {
    cb.checked = (p.sizes || []).includes(cb.value);
  });
  const customSizes = (p.sizes || []).filter(s => !stdSizes.includes(s));
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
  if (rows.length <= 1) { showToast('Precisa ter pelo menos 1 item.', 'warn'); return; }
  btn.closest(`.${cls}`).remove();
}

function getFormData() {
  const catSel = document.getElementById('prod-category').value;
  const category = catSel === 'Outra'
    ? document.getElementById('prod-category-custom').value.trim()
    : catSel;

  const colors = Array.from(document.querySelectorAll('.color-row')).map(row => ({
    label: row.querySelector('.color-label').value.trim(),
    hex:   row.querySelector('.color-hex').value
  })).filter(c => c.label);

  const stdSizes = ['PP','P','M','G','GG','XG'];
  const checked  = Array.from(document.querySelectorAll('.size-checkbox:checked')).map(cb => cb.value);
  const customRaw = document.getElementById('custom-sizes').value;
  const custom = customRaw ? customRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const sizes  = [...stdSizes.filter(s => checked.includes(s)), ...custom.filter(s => !stdSizes.includes(s))];

  const images = Array.from(document.querySelectorAll('.image-url')).map(i => i.value.trim()).filter(Boolean);

  return {
    name:        document.getElementById('prod-name').value.trim(),
    category,
    price:       document.getElementById('prod-price').value.trim(),
    description: document.getElementById('prod-description').value.trim(),
    colors,
    sizes,
    images,
  };
}

function saveProduct() {
  const data = getFormData();
  if (!data.name)              { showToast('Nome é obrigatório.', 'error'); return; }
  if (!data.category)          { showToast('Categoria é obrigatória.', 'error'); return; }
  if (data.colors.length === 0){ showToast('Adicione pelo menos uma cor.', 'error'); return; }
  if (data.sizes.length === 0) { showToast('Selecione pelo menos um tamanho.', 'error'); return; }
  if (data.images.length === 0){ showToast('Adicione pelo menos uma URL de imagem.', 'error'); return; }

  if (editingId) {
    const idx = products.findIndex(p => p.id === editingId);
    if (idx !== -1) products[idx] = { id: editingId, ...data };
  } else {
    products.push({ id: Date.now().toString(), ...data });
  }

  saveProducts();
  cancelForm();
  renderProductList();
  showToast(editingId ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
  editingId = null;
}

/* =============================================
   Configurações do Site
   ============================================= */
function loadSiteConfig() {
  const cfg = JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}');
  document.getElementById('cfg-brand').value           = cfg.brandName     || 'Sua Marca';
  document.getElementById('cfg-whatsapp').value        = cfg.whatsapp      || '5511999999999';
  document.getElementById('cfg-hero-tag').value        = cfg.heroTag       || 'Nova Coleção';
  document.getElementById('cfg-hero-title').value      = cfg.heroTitle     || 'Moda feminina com muito estilo';
  document.getElementById('cfg-hero-subtitle').value   = cfg.heroSubtitle  || 'Explore nossa vitrine, escolha a peça que você amar e fale com a gente pelo WhatsApp para realizar o seu pedido.';
  document.getElementById('cfg-catalog-title').value   = cfg.catalogTitle  || 'Nossa Vitrine';
  document.getElementById('cfg-catalog-subtitle').value= cfg.catalogSubtitle || 'Clique em uma peça para ver todos os detalhes, cores e tamanhos';
  document.getElementById('cfg-footer-frase').value    = cfg.footerFrase   || 'Moda feminina com estilo e qualidade. Fale conosco pelo WhatsApp para realizar seu pedido.';
}

function saveSiteConfig() {
  const cfg = {
    brandName:       document.getElementById('cfg-brand').value.trim(),
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
  document.getElementById('senha-atual').value    = '';
  document.getElementById('senha-nova').value     = '';
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
   Utilitário — escape HTML
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

  /* Login */
  if (isLoggedIn()) {
    showAdmin();
  } else {
    showLogin();
  }

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

  /* Categoria personalizada */
  document.getElementById('prod-category').addEventListener('change', function () {
    document.getElementById('cat-custom-field').hidden = (this.value !== 'Outra');
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
});
