// ============================================================
//  PinkAura — Painel Administrativo (Supabase)
// ============================================================

let products    = [];
let editingId   = null;
let colorSeq    = 0;
let imageSeq    = 0;
let currentUser = null;
let currentRole = null;

// ============================================================
//  Auth — telas
// ============================================================

function showLogin() {
  _hide('setup-screen'); _hide('signup-screen');
  const s = document.getElementById('login-screen');
  s.style.display = '';
  document.getElementById('admin-panel').classList.remove('is-active');
  document.getElementById('login-error').classList.remove('is-visible');
  document.getElementById('login-invite-hint').style.display = 'none';
  document.getElementById('login-email').value = '';
  document.getElementById('login-pass').value  = '';
  document.getElementById('login-email').focus();
}

function showSetup() {
  _hide('login-screen'); _hide('signup-screen');
  document.getElementById('setup-screen').style.display = '';
  document.getElementById('setup-error').classList.remove('is-visible');
  document.getElementById('setup-email').focus();
}

function showSignup(prefillEmail) {
  _hide('login-screen'); _hide('setup-screen');
  document.getElementById('signup-screen').style.display = '';
  document.getElementById('signup-error').classList.remove('is-visible');
  if (prefillEmail) document.getElementById('signup-email').value = prefillEmail;
  document.getElementById('signup-pass').focus();
}

function _hide(id) {
  document.getElementById(id).style.display = 'none';
}

async function showAdmin() {
  _hide('login-screen'); _hide('setup-screen'); _hide('signup-screen');
  if (document.getElementById('admin-panel').classList.contains('is-active')) return;

  const { data, error } = await supabase
    .from('admin_roles')
    .select('role')
    .eq('user_id', currentUser.id)
    .single();

  // PGRST116 = nenhuma linha encontrada (esperado para novo usuário)
  // Qualquer outro erro é falha real de rede/RLS
  if (error && error.code !== 'PGRST116') {
    showToast('Erro de conexão com o banco. Tente novamente.', 'erro');
    await doLogout();
    return;
  }

  if (!data) {
    // Nenhuma role ainda — tentar reivindicar owner passando o e-mail do usuário autenticado
    const { data: claimed, error: claimErr } = await supabase.rpc('claim_owner', {
      p_email: currentUser.email
    });
    if (claimErr || !claimed) {
      showToast('Acesso não autorizado. Peça ao dono da loja para te convidar.', 'erro');
      await doLogout();
      return;
    }
    currentRole = 'owner';
  } else {
    currentRole = data.role;
  }

  const isOwner = currentRole === 'owner';
  document.getElementById('tab-btn-acessos').style.display     = isOwner ? '' : 'none';
  document.getElementById('tab-btn-acessos-mob').style.display = isOwner ? '' : 'none';

  // Exibir email do usuário logado na sidebar
  const emailEl = document.getElementById('admin-user-email');
  const roleEl  = document.getElementById('admin-user-role');
  if (emailEl) emailEl.textContent = currentUser.email;
  if (roleEl)  roleEl.textContent  = isOwner ? 'Dono' : 'Administrador';

  document.getElementById('admin-panel').classList.add('is-active');
  await loadProducts();
  switchTab('produtos');
}

// ============================================================
//  Init auth
// ============================================================

async function initAuth() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      currentUser = session.user;
      await showAdmin();
      return;
    }
    const { data: hasOwner, error } = await supabase.rpc('has_owner');
    if (error) throw error;
    if (hasOwner) {
      showLogin();
    } else {
      showSetup();
    }
  } catch (err) {
    // Erro de rede ou SQL não configurado — mostra login (mais seguro que setup)
    console.error('initAuth error:', err);
    showLogin();
  }
}

// ============================================================
//  Login / Signup / Logout
// ============================================================

async function doLogin(email, pass) {
  const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
  if (error) {
    const { data: invited } = await supabase.rpc('is_invited', { check_email: email });
    if (invited) document.getElementById('login-invite-hint').style.display = '';
    return false;
  }
  return true;
}

async function doSetup(email, pass) {
  const { data, error } = await supabase.auth.signUp({ email, password: pass });
  if (error) throw error;
  if (!data.session) {
    throw new Error(`Conta criada! Verifique seu e-mail (${email}) e clique no link de confirmação. Depois volte aqui para fazer login.`);
  }
  // session exists → onAuthStateChange SIGNED_IN → showAdmin()
}

async function doSignup(email, pass) {
  const { data: invited } = await supabase.rpc('is_invited', { check_email: email });
  if (!invited) throw new Error('E-mail não autorizado. Solicite ao dono da loja que envie um convite.');
  const { data, error } = await supabase.auth.signUp({ email, password: pass });
  if (error) throw error;
  if (!data.session) {
    throw new Error(`Conta criada! Verifique seu e-mail (${email}) e clique no link de confirmação. Depois faça login normalmente.`);
  }
}

async function doLogout() {
  await supabase.auth.signOut();
  currentUser = null;
  currentRole = null;
  location.reload();
}

// ============================================================
//  Tabs
// ============================================================

function switchTab(tab) {
  document.querySelectorAll('.tab-btn').forEach(b => {
    if (b.dataset.tab === tab) b.setAttribute('aria-current', 'page');
    else b.removeAttribute('aria-current');
  });
  document.querySelectorAll('.tab-content').forEach(c => {
    c.classList.toggle('is-active', c.id === `tab-${tab}`);
  });
  if (tab === 'produtos') { showList(); renderProductList(); }
  if (tab === 'site')     loadSiteConfigForm();
  if (tab === 'acessos')  loadAcessos();
  if (tab === 'senha') {
    document.getElementById('senha-nova').value      = '';
    document.getElementById('senha-confirmar').value = '';
  }
}

// ============================================================
//  Lista vs. Formulário
// ============================================================

function showList() {
  const listView = document.getElementById('lista-view');
  const formSec  = document.getElementById('product-form-section');
  const fab      = document.getElementById('fab-novo');
  if (listView) listView.style.display = '';
  formSec.classList.remove('is-active');
  if (fab) fab.style.display = '';
}

function showForm() {
  const listView = document.getElementById('lista-view');
  const formSec  = document.getElementById('product-form-section');
  const fab      = document.getElementById('fab-novo');
  if (listView) listView.style.display = 'none';
  formSec.classList.add('is-active');
  if (fab) fab.style.display = 'none';
  window.scrollTo(0, 0);
}

// ============================================================
//  Produtos — CRUD
// ============================================================

async function loadProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) { showToast('Erro ao carregar produtos.', 'erro'); return; }
  products = (data || []).map(dbToProduct);
}

function dbToProduct(row) {
  return {
    id:            row.id,
    name:          row.name,
    category:      row.category,
    price:         row.price          || '',
    priceOriginal: row.price_original || undefined,
    description:   row.description   || '',
    colors:        row.colors         || [],
    sizes:         row.sizes          || [],
    images:        row.images         || [],
    soldOut:       row.sold_out === true,
  };
}

function productToDb(p) {
  return {
    name:           p.name,
    category:       p.category,
    price:          p.price          || null,
    price_original: p.priceOriginal  || null,
    description:    p.description    || null,
    colors:         p.colors,
    sizes:          p.sizes,
    images:         p.images,
    sold_out:       !!p.soldOut,
  };
}

function renderProductList() {
  const container = document.getElementById('lista-produtos');
  if (products.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <img src="images/lily.png" alt="" aria-hidden="true">
        <h3>Nenhum produto ainda</h3>
        <p>Comece adicionando a primeira peça da vitrine.</p>
        <button type="button" class="btn-block" id="empty-add">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" width="20" height="20"><path d="M12 5v14M5 12h14"/></svg>
          Adicionar primeiro produto
        </button>
      </div>`;
    document.getElementById('empty-add').addEventListener('click', newProduct);
    return;
  }
  container.innerHTML = products.map(p => {
    const img = p.images && p.images[0];
    const thumbContent = img
      ? `<img src="${escHtml(img)}" alt="${escHtml(p.name)}" onerror="this.style.display='none'">`
      : `<img src="images/lily.png" alt="" aria-hidden="true" class="lily-ph">`;
    return `
      <article class="product-row">
        <div class="product-thumb">${thumbContent}</div>
        <div class="product-row-info">
          <span class="p-name">${escHtml(p.name)}</span>
          <span class="p-meta">
            <span class="cat-pill">${escHtml(p.category)}</span>
            ${p.soldOut ? '<span class="sold-out-pill">Esgotado</span>' : ''}
            ${p.price ? `<span class="p-price">${escHtml(p.price)}</span>` : ''}
          </span>
        </div>
        <div class="product-row-actions">
          <button class="btn-edit" data-id="${escHtml(p.id)}" aria-label="Editar ${escHtml(p.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
            Editar
          </button>
          <button class="btn-delete" data-id="${escHtml(p.id)}" aria-label="Excluir ${escHtml(p.name)}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="17" height="17"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
            Excluir
          </button>
        </div>
      </article>`;
  }).join('');
  container.querySelectorAll('.btn-edit').forEach(b =>
    b.addEventListener('click', () => editProduct(b.dataset.id))
  );
  container.querySelectorAll('.btn-delete').forEach(b =>
    b.addEventListener('click', () => deleteProduct(b.dataset.id))
  );
}

async function deleteProduct(id) {
  if (!confirm('Excluir este produto? Esta ação não pode ser desfeita.')) return;
  const { error } = await supabase.from('products').delete().eq('id', id);
  if (error) { showToast('Erro ao excluir produto.', 'erro'); return; }
  products = products.filter(p => p.id !== id);
  renderProductList();
  showToast('Produto excluído.', 'aviso');
}

function newProduct() {
  editingId = null;
  document.getElementById('form-title').textContent = 'Novo produto';
  resetForm();
  showForm();
}

function editProduct(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  editingId = id;
  document.getElementById('form-title').textContent = 'Editar produto';
  fillForm(p);
  showForm();
}

function cancelForm() {
  editingId = null;
  showList();
}

// ---- Geração de linhas ----
function colorRow(label, hex, imgIndex) {
  const idx = (imgIndex !== undefined && imgIndex !== null) ? imgIndex + 1 : 1;
  const uid = `cr${++colorSeq}`;
  return `
    <div class="color-row">
      <div class="field-mini color-label">
        <label for="${uid}-n">Nome da cor</label>
        <input type="text" id="${uid}-n" placeholder="Ex.: Magenta" value="${escHtml(label)}">
      </div>
      <div class="field-mini color-img-index">
        <label for="${uid}-i">Foto nº</label>
        <input type="number" id="${uid}-i" min="1" max="10" placeholder="1" value="${idx}">
      </div>
      <div class="color-swatch-wrap">
        <label for="${uid}-c">Cor</label>
        <input type="color" class="color-hex" id="${uid}-c" value="${escHtml(hex)}" aria-label="Selecionar cor">
      </div>
      <button type="button" class="btn-remove-row" onclick="removeRow(this,'color-row')" aria-label="Remover cor">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
      </button>
    </div>`;
}

function imageRow(url) {
  const uid = `ir${++imageSeq}`;
  const hasImg = url && url.length > 0;
  const thumbContent = hasImg
    ? `<img src="${escHtml(url)}" alt="preview" style="width:100%;height:100%;object-fit:cover">`
    : `<img src="images/lily.png" alt="" aria-hidden="true" class="lily-ph">`;
  return `
    <div class="image-row">
      <div class="image-thumb">${thumbContent}</div>
      <input type="url" class="image-url" id="${uid}-u"
             placeholder="https://… ou use Enviar foto"
             value="${escHtml(url)}" aria-label="URL da imagem">
      <div class="image-row-actions">
        <label class="btn-upload" for="${uid}-f">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg>
          Enviar foto
        </label>
        <input type="file" id="${uid}-f" accept="image/*" class="image-file visually-hidden">
        <button type="button" class="btn-remove-row" onclick="removeRow(this,'image-row')" aria-label="Remover imagem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>`;
}

// ---- Reset / preenchimento ----
const STD_SIZES = ['PP','P','M','G','GG','XG','U'];

function resetForm() {
  document.getElementById('prod-name').value            = '';
  document.getElementById('prod-category').value        = '';
  document.getElementById('prod-category-custom').value = '';
  document.getElementById('cat-custom-field').classList.remove('is-active');
  document.getElementById('prod-price').value           = '';
  document.getElementById('prod-price-original').value  = '';
  document.getElementById('prod-description').value     = '';
  document.getElementById('prod-sold-out').checked      = false;
  document.getElementById('colors-list').innerHTML      = colorRow('', '#C9177C');
  document.getElementById('images-list').innerHTML      = imageRow('');
  document.querySelectorAll('.size-checkbox').forEach(cb => cb.checked = false);
  document.getElementById('custom-sizes').value         = '';
}

function fillForm(p) {
  document.getElementById('prod-name').value            = p.name;
  document.getElementById('prod-price').value           = p.price         || '';
  document.getElementById('prod-price-original').value  = p.priceOriginal || '';
  document.getElementById('prod-description').value     = p.description   || '';
  document.getElementById('prod-sold-out').checked      = p.soldOut === true;
  const stdCats = ['Vestidos','Camiseta','Cropped','Body','Moletom','Conjuntos','Saias','Calças','Acessórios'];
  const catSel  = document.getElementById('prod-category');
  if (stdCats.includes(p.category)) {
    catSel.value = p.category;
    document.getElementById('cat-custom-field').classList.remove('is-active');
  } else {
    catSel.value = '__outra';
    document.getElementById('cat-custom-field').classList.add('is-active');
    document.getElementById('prod-category-custom').value = p.category;
  }
  document.getElementById('colors-list').innerHTML =
    (p.colors || []).map(c => colorRow(c.label, c.hex, c.imageIndex)).join('');
  document.querySelectorAll('.size-checkbox').forEach(cb => {
    cb.checked = (p.sizes || []).includes(cb.value);
  });
  const customSizes = (p.sizes || []).filter(s => !STD_SIZES.includes(s));
  document.getElementById('custom-sizes').value = customSizes.join(', ');
  document.getElementById('images-list').innerHTML =
    (p.images || []).map(url => imageRow(url)).join('');
}

function addColor() {
  document.getElementById('colors-list').insertAdjacentHTML('beforeend', colorRow('', '#C9177C'));
}

function addImage() {
  const count = document.querySelectorAll('#images-list .image-row').length;
  if (count >= 10) { showToast('Máximo de 10 imagens por produto.', 'aviso'); return; }
  document.getElementById('images-list').insertAdjacentHTML('beforeend', imageRow(''));
}

function removeRow(btn, cls) {
  const rows = document.querySelectorAll(`.${cls}`);
  if (rows.length <= 1) { showToast('É necessário ao menos 1 item.', 'aviso'); return; }
  btn.closest(`.${cls}`).remove();
}

// ---- Leitura do formulário ----
function getFormData() {
  const catSel   = document.getElementById('prod-category').value;
  const category = catSel === '__outra'
    ? document.getElementById('prod-category-custom').value.trim()
    : catSel;
  const colors = Array.from(document.querySelectorAll('.color-row')).map(row => ({
    label:      (row.querySelector('.color-label input') || row.querySelector('.color-label')).value.trim(),
    hex:        row.querySelector('.color-hex').value,
    imageIndex: Math.max(0, parseInt((row.querySelector('.color-img-index input') || row.querySelector('.color-img-index')).value || '1', 10) - 1)
  })).filter(c => c.label);
  const checked   = Array.from(document.querySelectorAll('.size-checkbox:checked')).map(cb => cb.value);
  const customRaw = document.getElementById('custom-sizes').value;
  const custom    = customRaw ? customRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  const sizes     = [...STD_SIZES.filter(s => checked.includes(s)), ...custom.filter(s => !STD_SIZES.includes(s))];
  const images    = Array.from(document.querySelectorAll('.image-url')).map(i => i.value.trim()).filter(Boolean);
  return {
    name:          document.getElementById('prod-name').value.trim(),
    category,
    price:         document.getElementById('prod-price').value.trim(),
    priceOriginal: document.getElementById('prod-price-original').value.trim() || undefined,
    description:   document.getElementById('prod-description').value.trim(),
    soldOut:       document.getElementById('prod-sold-out').checked,
    colors, sizes, images,
  };
}

async function saveProduct() {
  const data = getFormData();
  if (!data.name)               { showToast('Nome é obrigatório.', 'erro'); return; }
  if (!data.category)           { showToast('Categoria é obrigatória.', 'erro'); return; }
  if (data.colors.length === 0) { showToast('Adicione pelo menos uma cor.', 'erro'); return; }
  if (data.sizes.length === 0)  { showToast('Selecione pelo menos um tamanho.', 'erro'); return; }
  if (data.images.length === 0) { showToast('Adicione pelo menos uma imagem.', 'erro'); return; }

  const btn = document.getElementById('btn-salvar-produto');
  btn.disabled = true;
  btn.textContent = 'Salvando…';
  try {
    if (editingId) {
      const { error } = await supabase.from('products').update(productToDb(data)).eq('id', editingId);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('products').insert(productToDb(data));
      if (error) throw error;
    }
    const msg = editingId ? 'Produto atualizado!' : 'Produto adicionado!';
    editingId = null;
    await loadProducts();
    cancelForm();
    renderProductList();
    showToast(msg, 'sucesso');
  } catch (err) {
    showToast('Erro ao salvar: ' + err.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar produto';
  }
}

// ============================================================
//  Upload — Supabase Storage
// ============================================================

function compressToBlob(file) {
  return new Promise((resolve, reject) => {
    const img    = new Image();
    const objUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objUrl);
      const MAX_W = 900, MAX_H = 1200;
      let w = img.naturalWidth, h = img.naturalHeight;
      if (w > MAX_W || h > MAX_H) {
        const r = Math.min(MAX_W / w, MAX_H / h);
        w = Math.round(w * r); h = Math.round(h * r);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('Falha ao comprimir imagem'));
      }, 'image/jpeg', 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(objUrl); reject(new Error('Erro ao carregar imagem')); };
    img.src = objUrl;
  });
}

async function uploadImageToStorage(file) {
  const blob = await compressToBlob(file);
  const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const { error } = await supabase.storage.from('product-images').upload(path, blob, {
    contentType: 'image/jpeg', upsert: false
  });
  if (error) throw error;
  const { data } = supabase.storage.from('product-images').getPublicUrl(path);
  return data.publicUrl;
}

// ============================================================
//  Helper preço com desconto
// ============================================================

function parsePrecoAdmin(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/[R$\s.]/g, '').replace(',', '.')) || 0;
}

function buildPrevPreco(data, modo) {
  if (!data.price) return '';
  if (!data.priceOriginal) {
    const cls = modo === 'card' ? 'prev-card-price' : 'prev-detail-price';
    return `<p class="${cls}">${escHtml(data.price)}</p>`;
  }
  const atual = parsePrecoAdmin(data.price);
  const orig  = parsePrecoAdmin(data.priceOriginal);
  const pct   = (orig > atual && orig > 0) ? Math.round((1 - atual / orig) * 100) : 0;
  const badge = pct > 0
    ? `<span style="display:inline-flex;align-items:center;background:#F0FDF4;color:#166534;border:1px solid #BBF7D0;font-size:10px;font-weight:700;padding:2px 7px;border-radius:999px">−${pct}%</span>`
    : '';
  if (modo === 'card') {
    return `
      <div style="margin:4px 0">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="font-weight:800;color:#C9177C;font-size:16px">${escHtml(data.price)}</span>${badge}
        </div>
        <span style="font-size:11px;color:#B08AA0;text-decoration:line-through">de ${escHtml(data.priceOriginal)}</span>
      </div>`;
  }
  return `
    <div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin:6px 0">
      <span style="font-weight:800;color:#C9177C;font-size:22px">${escHtml(data.price)}</span>${badge}
      <span style="font-size:13px;color:#B08AA0;text-decoration:line-through;align-self:flex-end;padding-bottom:2px">de ${escHtml(data.priceOriginal)}</span>
    </div>`;
}

// ============================================================
//  Preview do produto
// ============================================================

function previewProduct() {
  const data = getFormData();
  if (!data.name) { showToast('Preencha ao menos o nome para visualizar.', 'aviso'); return; }
  const mainImg = data.images[0] || '';
  const swatchesHtml = data.colors.slice(0, 5).map(c =>
    `<span style="width:14px;height:14px;border-radius:50%;background:${c.hex};display:inline-block;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)" title="${escHtml(c.label)}"></span>`
  ).join('');
  const detailColorsHtml = data.colors.map(c =>
    `<span style="width:28px;height:28px;border-radius:50%;background:${c.hex};display:inline-block;box-shadow:inset 0 0 0 1px rgba(0,0,0,.1)" title="${escHtml(c.label)}"></span>`
  ).join('');
  const detailSizesHtml = data.sizes.map(s => `<span class="prev-size-pill">${escHtml(s)}</span>`).join('');
  const sizePillsCard = data.sizes.slice(0,5).map(s =>
    `<span style="font-size:.68rem;font-weight:600;color:#8A6577;background:#F7EEF3;padding:2px 7px;border-radius:6px">${escHtml(s)}</span>`
  ).join('');
  document.getElementById('preview-body').innerHTML = `
    <div class="preview-split">
      <div>
        <p class="preview-section-label">Card na vitrine</p>
        <div class="prev-card${data.soldOut ? ' is-sold-out' : ''}">
          <div class="prev-card-img-wrap">
            ${mainImg ? `<img class="prev-card-img" src="${escHtml(mainImg)}" alt="${escHtml(data.name)}">` : ''}
            <span class="prev-badge">${escHtml(data.category || 'Categoria')}</span>
            ${data.soldOut ? '<span class="prev-sold-out">Esgotado</span>' : ''}
          </div>
          <div class="prev-card-info">
            <h3 class="prev-card-name">${escHtml(data.name)}</h3>
            ${buildPrevPreco(data, 'card')}
            <div class="prev-swatches">${swatchesHtml}</div>
            <div class="prev-sizes">${sizePillsCard}</div>
          </div>
        </div>
      </div>
      <div>
        <p class="preview-section-label">Detalhe (modal)</p>
        <div class="prev-detail">
          <p class="prev-detail-cat">${escHtml(data.category || '')}</p>
          <h2 class="prev-detail-name">${escHtml(data.name)}</h2>
          ${buildPrevPreco(data, 'detail')}
          ${data.description ? `<p class="prev-detail-desc">${escHtml(data.description)}</p>` : ''}
          ${data.colors.length ? `<p class="prev-section-title">Cores</p><div class="prev-detail-colors">${detailColorsHtml}</div>` : ''}
          ${data.sizes.length ? `<p class="prev-section-title">Tamanhos</p><div class="prev-detail-sizes">${detailSizesHtml}</div>` : ''}
          ${data.soldOut
            ? `<div class="prev-sold-out-banner">Produto esgotado — botão de compra desativado na loja</div>`
            : `<div class="prev-wa-btn">
            <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.122 1.532 5.854L.057 23.886c-.063.252.179.487.43.418l6.188-1.625A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.028-1.381l-.36-.214-3.725.977.994-3.634-.235-.373A9.818 9.818 0 1112 21.818z"/></svg>
            Quero esse! Falar no WhatsApp
          </div>`}
        </div>
      </div>
    </div>`;
  document.getElementById('preview-overlay').classList.add('is-visible');
  document.body.style.overflow = 'hidden';
}

function fecharPreview() {
  document.getElementById('preview-overlay').classList.remove('is-visible');
  document.body.style.overflow = '';
}

// ============================================================
//  Configurações do Site
// ============================================================

async function loadSiteConfigForm() {
  const { data } = await supabase.from('site_config').select('key, value');
  const cfg = {};
  (data || []).forEach(row => { cfg[row.key] = row.value; });
  document.getElementById('cfg-whatsapp').value         = cfg.whatsapp        || '5511999999999';
  document.getElementById('cfg-hero-tag').value         = cfg.heroTag         || 'Nova Coleção';
  document.getElementById('cfg-hero-title').value       = cfg.heroTitle       || 'Moda feminina com muito estilo';
  document.getElementById('cfg-hero-subtitle').value    = cfg.heroSubtitle    || 'Cultive sua energia';
  document.getElementById('cfg-catalog-title').value    = cfg.catalogTitle    || 'Nossa Vitrine';
  document.getElementById('cfg-catalog-subtitle').value = cfg.catalogSubtitle || 'Clique em uma peça para ver detalhes';
  document.getElementById('cfg-footer-frase').value     = cfg.footerFrase     || 'Moda feminina com alma. Fale conosco pelo WhatsApp.';
  document.getElementById('cfg-sold-out-msg').value     = cfg.soldOutMessage  || 'Esta peça está esgotada no momento. 💗 Fale com a gente pelo WhatsApp para saber sobre reposição!';
}

async function saveSiteConfig() {
  const updates = [
    { key: 'whatsapp',        value: document.getElementById('cfg-whatsapp').value.trim().replace(/\D/g, '') },
    { key: 'heroTag',         value: document.getElementById('cfg-hero-tag').value.trim() },
    { key: 'heroTitle',       value: document.getElementById('cfg-hero-title').value.trim() },
    { key: 'heroSubtitle',    value: document.getElementById('cfg-hero-subtitle').value.trim() },
    { key: 'catalogTitle',    value: document.getElementById('cfg-catalog-title').value.trim() },
    { key: 'catalogSubtitle', value: document.getElementById('cfg-catalog-subtitle').value.trim() },
    { key: 'footerFrase',     value: document.getElementById('cfg-footer-frase').value.trim() },
    { key: 'soldOutMessage',  value: document.getElementById('cfg-sold-out-msg').value.trim() },
  ];
  try {
    for (const u of updates) {
      const { error } = await supabase.from('site_config').upsert({ key: u.key, value: u.value }, { onConflict: 'key' });
      if (error) throw error;
    }
    showToast('Configurações salvas! Atualize a loja para ver as mudanças.', 'sucesso');
  } catch (err) {
    showToast('Erro ao salvar: ' + err.message, 'erro');
  }
}

// ============================================================
//  Acessos (somente owner)
// ============================================================

async function loadAcessos() {
  const [{ data: admins, error: e1 }, { data: invites, error: e2 }] = await Promise.all([
    supabase.from('admin_roles').select('*').order('created_at'),
    supabase.from('admin_invites').select('*').order('created_at'),
  ]);
  if (e1 || e2) { showToast('Erro ao carregar acessos.', 'erro'); return; }
  renderAcessos(admins || [], invites || []);
}

function renderAcessos(admins, invites) {
  const container = document.getElementById('acessos-lista');
  const adminRows = admins.map(a => {
    const isMe    = a.user_id === currentUser.id;
    const badge   = a.role === 'owner'
      ? '<span class="role-badge owner">Dono</span>'
      : '<span class="role-badge admin">Admin</span>';
    const revokeBtn = (!isMe && a.role !== 'owner')
      ? `<button class="btn-revoke" data-uid="${escHtml(a.user_id)}" aria-label="Revogar acesso">Revogar</button>`
      : '';
    return `
      <div class="acesso-row">
        <div class="acesso-info">
          <span class="acesso-email">${escHtml(a.email)}</span>
          ${badge}
          ${isMe ? '<span class="acesso-me">(você)</span>' : ''}
        </div>
        ${revokeBtn}
      </div>`;
  }).join('');

  const pendingHtml = invites.length > 0 ? `
    <div class="section-divider" style="margin-top:16px"><span>Convites pendentes</span></div>
    ${invites.map(inv => `
      <div class="acesso-row acesso-pending">
        <div class="acesso-info">
          <span class="acesso-email">${escHtml(inv.email)}</span>
          <span class="role-badge pending">Pendente</span>
        </div>
        <button class="btn-revoke" data-invite-id="${escHtml(inv.id)}" aria-label="Cancelar convite">Cancelar</button>
      </div>`).join('')}` : '';

  container.innerHTML = `
    <div class="section-divider"><span>Administradores ativos</span></div>
    ${adminRows || '<p class="help-text" style="padding:12px 0">Nenhum administrador ainda.</p>'}
    ${pendingHtml}`;

  container.querySelectorAll('[data-uid]').forEach(btn =>
    btn.addEventListener('click', () => revokeAdmin(btn.dataset.uid))
  );
  container.querySelectorAll('[data-invite-id]').forEach(btn =>
    btn.addEventListener('click', () => cancelInvite(btn.dataset.inviteId))
  );
}

async function inviteAdmin(email) {
  const { error } = await supabase.from('admin_invites').insert({
    email: email.toLowerCase(),
    invited_by_id: currentUser.id
  });
  if (error) {
    if (error.code === '23505') throw new Error('Este e-mail já tem convite pendente.');
    throw error;
  }
}

async function revokeAdmin(userId) {
  if (!confirm('Revogar o acesso deste administrador?')) return;
  const { error } = await supabase.from('admin_roles').delete().eq('user_id', userId);
  if (error) { showToast('Erro ao revogar acesso.', 'erro'); return; }
  await loadAcessos();
  showToast('Acesso revogado.', 'aviso');
}

async function cancelInvite(inviteId) {
  const { error } = await supabase.from('admin_invites').delete().eq('id', inviteId);
  if (error) { showToast('Erro ao cancelar convite.', 'erro'); return; }
  await loadAcessos();
  showToast('Convite cancelado.', 'aviso');
}

// ============================================================
//  Alterar Senha
// ============================================================

async function changePassword() {
  const nova      = document.getElementById('senha-nova').value;
  const confirmar = document.getElementById('senha-confirmar').value;
  if (nova.length < 6)    { showToast('Nova senha: mínimo 6 caracteres.', 'erro'); return; }
  if (nova !== confirmar) { showToast('As senhas não conferem.', 'erro'); return; }
  const { error } = await supabase.auth.updateUser({ password: nova });
  if (error) { showToast('Erro: ' + error.message, 'erro'); return; }
  document.getElementById('senha-nova').value      = '';
  document.getElementById('senha-confirmar').value = '';
  showToast('Senha alterada com sucesso!', 'sucesso');
}

// ============================================================
//  Toast
// ============================================================

const TOAST_ICONS = {
  sucesso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>',
  erro:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  aviso:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>'
};

function showToast(msg, type) {
  const t = type || 'sucesso';
  const toast = document.getElementById('toast');
  toast.className = `t-${t} is-visible`;
  document.getElementById('toast-msg').textContent = msg;
  const iconEl = toast.querySelector('.toast-icon');
  if (iconEl) iconEl.innerHTML = TOAST_ICONS[t] || TOAST_ICONS.sucesso;
  const bar = toast.querySelector('.toast-bar');
  if (bar) { bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = ''; }
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('is-visible'), 3500);
}

// ============================================================
//  Escape HTML
// ============================================================

function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
//  Inicialização
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // Init auth (determina qual tela mostrar)
  initAuth();

  // Auth state listener
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      currentUser = session.user;
      await showAdmin();
    } else if (event === 'SIGNED_OUT') {
      currentUser = null;
      currentRole = null;
    }
  });

  // Login
  document.getElementById('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email    = document.getElementById('login-email').value.trim();
    const pass     = document.getElementById('login-pass').value;
    const loginBtn = e.target.querySelector('button[type="submit"]');
    const origText = loginBtn.textContent;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Entrando…';
    document.getElementById('login-error').classList.remove('is-visible');
    const ok = await doLogin(email, pass);
    loginBtn.disabled = false;
    loginBtn.textContent = origText;
    if (!ok) {
      document.getElementById('login-error').classList.add('is-visible');
      document.getElementById('login-pass').focus();
    }
  });

  // "Criar senha" link no login
  document.getElementById('btn-ir-signup').addEventListener('click', () => {
    const email = document.getElementById('login-email').value.trim();
    showSignup(email);
  });

  // Setup (primeiro dono)
  document.getElementById('setup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('setup-email').value.trim();
    const pass  = document.getElementById('setup-pass').value;
    const conf  = document.getElementById('setup-confirmar').value;
    const errEl = document.getElementById('setup-error');
    const errTx = document.getElementById('setup-error-text');
    errEl.classList.remove('is-visible');
    if (pass.length < 6)  { errTx.textContent = 'Use ao menos 6 caracteres.'; errEl.classList.add('is-visible'); return; }
    if (pass !== conf)    { errTx.textContent = 'As senhas não conferem.'; errEl.classList.add('is-visible'); return; }
    try {
      await doSetup(email, pass);
    } catch (err) {
      errTx.textContent = err.message;
      errEl.classList.add('is-visible');
    }
  });

  // Signup (admin convidado)
  document.getElementById('signup-form').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const pass  = document.getElementById('signup-pass').value;
    const conf  = document.getElementById('signup-confirmar').value;
    const errEl = document.getElementById('signup-error');
    const errTx = document.getElementById('signup-error-text');
    errEl.classList.remove('is-visible');
    if (pass.length < 6)  { errTx.textContent = 'Use ao menos 6 caracteres.'; errEl.classList.add('is-visible'); return; }
    if (pass !== conf)    { errTx.textContent = 'As senhas não conferem.'; errEl.classList.add('is-visible'); return; }
    try {
      await doSignup(email, pass);
    } catch (err) {
      errTx.textContent = err.message;
      errEl.classList.add('is-visible');
    }
  });

  // "Já tem conta?" no setup → ir para login
  document.getElementById('btn-setup-para-login').addEventListener('click', showLogin);

  // Voltar ao login
  document.getElementById('btn-voltar-login').addEventListener('click', showLogin);

  // Tabs
  document.querySelectorAll('.tab-btn').forEach(btn =>
    btn.addEventListener('click', () => { if (btn.dataset.tab) switchTab(btn.dataset.tab); })
  );

  // Header scroll shadow
  window.addEventListener('scroll', () => {
    const h = document.querySelector('.admin-header');
    if (h) h.classList.toggle('is-scrolled', window.scrollY > 6);
  }, { passive: true });

  // Logout / Ver loja
  document.getElementById('btn-logout').addEventListener('click', doLogout);
  document.getElementById('btn-ver-loja').addEventListener('click', () => window.open('index.html', '_blank'));
  const ld = document.getElementById('btn-logout-desk');
  const vd = document.getElementById('btn-ver-loja-desk');
  if (ld) ld.addEventListener('click', doLogout);
  if (vd) vd.addEventListener('click', () => window.open('index.html', '_blank'));

  // Produto
  document.getElementById('btn-novo-produto').addEventListener('click', newProduct);
  document.getElementById('btn-salvar-produto').addEventListener('click', saveProduct);
  document.getElementById('btn-cancelar-produto').addEventListener('click', cancelForm);
  document.getElementById('btn-add-color').addEventListener('click', addColor);
  document.getElementById('btn-add-image').addEventListener('click', addImage);
  document.getElementById('btn-preview-produto').addEventListener('click', previewProduct);

  // FAB
  const fab = document.getElementById('fab-novo');
  if (fab) fab.addEventListener('click', newProduct);

  // Categoria personalizada
  document.getElementById('prod-category').addEventListener('change', function () {
    document.getElementById('cat-custom-field').classList.toggle('is-active', this.value === '__outra');
  });

  // Upload de imagem → Supabase Storage
  document.getElementById('form-produto').addEventListener('change', async e => {
    if (!e.target.classList.contains('image-file')) return;
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('Imagem muito grande. Máximo 10MB.', 'aviso'); return; }
    showToast('Enviando imagem…', 'sucesso');
    const row      = e.target.closest('.image-row');
    const urlInput = row.querySelector('.image-url');
    const thumbDiv = row.querySelector('.image-thumb');
    try {
      const publicUrl = await uploadImageToStorage(file);
      urlInput.value  = publicUrl;
      thumbDiv.innerHTML = `<img src="${publicUrl}" alt="preview" style="width:100%;height:100%;object-fit:cover">`;
      showToast('Imagem enviada!', 'sucesso');
    } catch (err) {
      showToast('Erro ao enviar: ' + err.message, 'erro');
    }
  });

  // Atualiza thumbnail ao digitar URL
  document.getElementById('form-produto').addEventListener('input', e => {
    if (!e.target.classList.contains('image-url')) return;
    const row = e.target.closest('.image-row');
    if (!row) return;
    const thumbDiv = row.querySelector('.image-thumb');
    const val = e.target.value.trim();
    thumbDiv.innerHTML = val
      ? `<img src="${escHtml(val)}" alt="preview" style="width:100%;height:100%;object-fit:cover">`
      : `<img src="images/lily.png" alt="" aria-hidden="true" class="lily-ph">`;
  });

  // Config site
  document.getElementById('form-site').addEventListener('submit', e => {
    e.preventDefault();
    saveSiteConfig();
  });

  // Senha
  document.getElementById('form-senha').addEventListener('submit', e => {
    e.preventDefault();
    changePassword();
  });

  // Convidar admin
  document.getElementById('form-convidar').addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('convite-email').value.trim();
    if (!email) { showToast('Informe um e-mail.', 'aviso'); return; }
    try {
      await inviteAdmin(email);
      document.getElementById('convite-email').value = '';
      await loadAcessos();
      showToast('Convite registrado! Peça à pessoa para acessar o painel e criar a senha.', 'sucesso');
    } catch (err) {
      showToast('Erro: ' + err.message, 'erro');
    }
  });

  // Preview — fechar
  document.getElementById('btn-fechar-preview').addEventListener('click', fecharPreview);
  document.getElementById('preview-overlay').addEventListener('click', e => {
    if (e.target === e.currentTarget) fecharPreview();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') fecharPreview();
  });
});
