/* ============================================================
   Pink Aura — admin.js (DEMONSTRAÇÃO)
   --------------------------------------------------------------
   Este arquivo existe para o painel funcionar no preview.
   Os IDs/classes batem com a especificação — se você já tem o
   SEU admin.js, basta mantê-lo no lugar deste.
   Credenciais demo:  usuário "admin"  /  senha "pinkaura"
   ============================================================ */
(function () {
  'use strict';

  /* ---------- dados demo ---------- */
  var ED = {
    magenta:    'linear-gradient(150deg,#FDEFF5,#F5C6DD 55%,#EF8BBF)',
    periwinkle: 'linear-gradient(150deg,#EEF4FC,#CCDBEF 55%,#B8CDE8)',
    lavanda:    'linear-gradient(150deg,#F5EEF9,#E0CBEA 55%,#D4B8E0)',
    creme:      'linear-gradient(150deg,#FCFAE4,#F6F0A6 60%,#ECE38A)'
  };
  var products = [
    { id: 1, name: 'Vestido Midi Aurora', category: 'Vestidos', price: 189.9, ed: 'magenta' },
    { id: 2, name: 'Blusa Cropped Energia', category: 'Blusas', price: 89.9, ed: 'periwinkle' },
    { id: 3, name: 'Saia Plissada Lírio', category: 'Saias', price: 129.9, ed: 'lavanda' },
    { id: 4, name: 'Conjunto Brilho', category: 'Conjuntos', price: 219.9, ed: 'creme' }
  ];
  var editingId = null;
  var LILY = 'assets/lily.png';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var brl = function (n) { return 'R$ ' + Number(n || 0).toFixed(2).replace('.', ','); };

  /* ============================================================
     LOGIN
     ============================================================ */
  var loginForm = $('#login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var u = $('#login-user').value.trim();
      var p = $('#login-pass').value;
      var err = $('#login-error');
      if (u === 'admin' && p === 'pinkaura') {
        err.classList.remove('is-visible');
        var screen = $('#login-screen');
        screen.classList.add('is-leaving');
        setTimeout(function () {
          screen.style.display = 'none';
          $('#admin-panel').classList.add('is-active');
          renderProducts();
        }, 450);
      } else {
        $('#login-error-text').textContent = 'Usuário ou senha incorretos.';
        err.classList.add('is-visible');
        $('#login-pass').focus();
      }
    });
  }

  $('#btn-logout') && $('#btn-logout').addEventListener('click', function () {
    var screen = $('#login-screen');
    $('#admin-panel').classList.remove('is-active');
    screen.style.display = 'flex';
    screen.classList.remove('is-leaving');
    $('#login-pass').value = '';
  });

  $('#btn-ver-loja') && $('#btn-ver-loja').addEventListener('click', function () {
    toast('Abrindo a loja…', 'aviso');
  });

  /* ============================================================
     HEADER scroll shadow
     ============================================================ */
  var main = $('.admin-main');
  if (main) {
    window.addEventListener('scroll', function () {
      var h = $('.admin-header');
      if (h) h.classList.toggle('is-scrolled', window.scrollY > 6);
    }, { passive: true });
  }

  /* ============================================================
     NAVEGAÇÃO ENTRE ABAS
     ============================================================ */
  function activateTab(tab) {
    $$('.tab-btn').forEach(function (b) {
      var on = b.getAttribute('data-tab') === tab;
      if (on) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    $$('.tab-content').forEach(function (sec) {
      sec.classList.toggle('is-active', sec.id === 'tab-' + tab);
    });
    if (tab === 'produtos') showList();
    window.scrollTo(0, 0);
  }
  $$('.tab-btn').forEach(function (b) {
    b.addEventListener('click', function () { activateTab(b.getAttribute('data-tab')); });
  });

  /* ============================================================
     LISTA DE PRODUTOS
     ============================================================ */
  function showList() {
    $('#lista-view').style.display = 'block';
    $('#product-form-section').classList.remove('is-active');
    var fab = $('#fab-novo'); if (fab) fab.style.display = '';
  }
  function showForm() {
    $('#lista-view').style.display = 'none';
    $('#product-form-section').classList.add('is-active');
    var fab = $('#fab-novo'); if (fab) fab.style.display = 'none';
    window.scrollTo(0, 0);
  }

  function renderProducts() {
    var list = $('#lista-produtos');
    if (!list) return;
    if (!products.length) {
      list.innerHTML =
        '<div class="empty-state">' +
          '<img src="' + LILY + '" alt="" aria-hidden="true">' +
          '<h3>Nenhum produto ainda</h3>' +
          '<p>Comece adicionando a primeira peça da vitrine.</p>' +
          '<button type="button" class="btn-block" id="empty-add">' +
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 5v14M5 12h14"/></svg>' +
            'Adicionar primeiro produto</button>' +
        '</div>';
      $('#empty-add').addEventListener('click', openNew);
      return;
    }
    list.innerHTML = products.map(function (p) {
      return '' +
      '<article class="product-row">' +
        '<div class="product-thumb" style="background-image:' + ED[p.ed] + '"><img src="' + LILY + '" alt="" aria-hidden="true"></div>' +
        '<div class="product-row-info">' +
          '<span class="p-name">' + esc(p.name) + '</span>' +
          '<span class="p-meta"><span class="cat-pill">' + esc(p.category) + '</span><span class="p-price">' + brl(p.price) + '</span></span>' +
        '</div>' +
        '<div class="product-row-actions">' +
          '<button type="button" class="btn-edit" data-id="' + p.id + '" aria-label="Editar ' + esc(p.name) + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>Editar</button>' +
          '<button type="button" class="btn-delete" data-id="' + p.id + '" aria-label="Excluir ' + esc(p.name) + '">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>Excluir</button>' +
        '</div>' +
      '</article>';
    }).join('');
    $$('.btn-edit', list).forEach(function (b) {
      b.addEventListener('click', function () { openEdit(+b.getAttribute('data-id')); });
    });
    $$('.btn-delete', list).forEach(function (b) {
      b.addEventListener('click', function () {
        var id = +b.getAttribute('data-id');
        products = products.filter(function (p) { return p.id !== id; });
        renderProducts();
        toast('Produto excluído.', 'aviso');
      });
    });
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ============================================================
     FORMULÁRIO DE PRODUTO
     ============================================================ */
  function openNew() {
    editingId = null;
    $('#form-title').textContent = 'Novo produto';
    $('#form-produto').reset();
    $('#cat-custom-field').classList.remove('is-active');
    resetRows();
    showForm();
  }
  function openEdit(id) {
    var p = products.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    editingId = id;
    $('#form-title').textContent = 'Editar produto';
    $('#prod-name').value = p.name;
    $('#prod-category').value = ['Vestidos', 'Blusas', 'Saias', 'Calças', 'Conjuntos'].indexOf(p.category) >= 0 ? p.category : '__outra';
    onCategoryChange();
    if ($('#prod-category').value === '__outra') $('#prod-category-custom').value = p.category;
    $('#prod-price').value = p.price;
    resetRows();
    showForm();
  }

  $('#btn-novo-produto') && $('#btn-novo-produto').addEventListener('click', openNew);
  $('#fab-novo') && $('#fab-novo').addEventListener('click', openNew);
  $('#btn-cancelar-produto') && $('#btn-cancelar-produto').addEventListener('click', showList);

  /* categoria "Outra" */
  function onCategoryChange() {
    $('#cat-custom-field').classList.toggle('is-active', $('#prod-category').value === '__outra');
  }
  $('#prod-category') && $('#prod-category').addEventListener('change', onCategoryChange);

  /* ---- cores dinâmicas ---- */
  var colorSeq = 0;
  function addColorRow(name, hex, imgIdx) {
    colorSeq++;
    var id = 'c' + colorSeq;
    var row = document.createElement('div');
    row.className = 'color-row';
    row.innerHTML =
      '<div class="field-mini color-label"><label for="' + id + '-n">Nome da cor</label>' +
        '<input type="text" id="' + id + '-n" placeholder="Ex.: Magenta" value="' + (name || '') + '"></div>' +
      '<div class="field-mini color-img-index"><label for="' + id + '-i">Foto nº</label>' +
        '<input type="number" id="' + id + '-i" min="1" max="10" placeholder="1" value="' + (imgIdx || '') + '"></div>' +
      '<div class="color-swatch-wrap"><label for="' + id + '-c">Cor</label>' +
        '<input type="color" class="color-hex" id="' + id + '-c" value="' + (hex || '#C9177C') + '" aria-label="Selecionar cor"></div>' +
      '<button type="button" class="btn-remove-row" aria-label="Remover cor">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>';
    row.querySelector('.btn-remove-row').addEventListener('click', function () { row.remove(); });
    $('#colors-list').appendChild(row);
  }
  $('#btn-add-color') && $('#btn-add-color').addEventListener('click', function () { addColorRow(); });

  /* ---- imagens dinâmicas ---- */
  var imgSeq = 0;
  function addImageRow(url) {
    if ($$('#images-list .image-row').length >= 10) { toast('Máximo de 10 imagens.', 'aviso'); return; }
    imgSeq++;
    var id = 'img' + imgSeq;
    var row = document.createElement('div');
    row.className = 'image-row';
    row.innerHTML =
      '<div class="image-thumb"><img src="' + LILY + '" alt="" aria-hidden="true"></div>' +
      '<input type="url" class="image-url" id="' + id + '-u" placeholder="https://… ou use Enviar foto" value="' + (url || '') + '" aria-label="URL da imagem">' +
      '<div class="image-row-actions">' +
        '<label class="btn-upload" for="' + id + '-f">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2Z"/><circle cx="12" cy="13" r="4"/></svg>' +
          'Enviar foto</label>' +
        '<input type="file" id="' + id + '-f" accept="image/*" class="visually-hidden">' +
        '<button type="button" class="btn-remove-row" aria-label="Remover imagem">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button>' +
      '</div>';
    var thumbImg = row.querySelector('.image-thumb img');
    var urlInput = row.querySelector('.image-url');
    urlInput.addEventListener('input', function () { if (urlInput.value) { thumbImg.src = urlInput.value; thumbImg.style.width = '100%'; thumbImg.style.opacity = '1'; } });
    row.querySelector('input[type=file]').addEventListener('change', function (e) {
      var f = e.target.files && e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { thumbImg.src = rd.result; thumbImg.style.width = '100%'; thumbImg.style.opacity = '1'; };
      rd.readAsDataURL(f);
    });
    row.querySelector('.btn-remove-row').addEventListener('click', function () { row.remove(); });
    $('#images-list').appendChild(row);
  }
  $('#btn-add-image') && $('#btn-add-image').addEventListener('click', function () { addImageRow(); });

  function resetRows() {
    $('#colors-list').innerHTML = '';
    $('#images-list').innerHTML = '';
    $$('.size-checkbox').forEach(function (c) { c.checked = false; });
    $('#custom-sizes').value = '';
    addColorRow('Magenta', '#C9177C', 1);
    addImageRow('');
  }

  /* ---- salvar ---- */
  $('#btn-salvar-produto') && $('#btn-salvar-produto').addEventListener('click', function () {
    var name = $('#prod-name').value.trim();
    if (!name) { toast('Informe o nome da peça.', 'erro'); $('#prod-name').focus(); return; }
    var cat = $('#prod-category').value === '__outra' ? ($('#prod-category-custom').value.trim() || 'Outra') : $('#prod-category').value;
    var price = parseFloat($('#prod-price').value) || 0;
    var ed = ['magenta', 'periwinkle', 'lavanda', 'creme'][products.length % 4];
    if (editingId) {
      products = products.map(function (p) { return p.id === editingId ? { id: p.id, name: name, category: cat, price: price, ed: p.ed } : p; });
      toast('Produto atualizado!', 'sucesso');
    } else {
      products.push({ id: Date.now(), name: name, category: cat, price: price, ed: ed });
      toast('Produto salvo!', 'sucesso');
    }
    renderProducts();
    showList();
  });

  /* ============================================================
     PREVIEW OVERLAY
     ============================================================ */
  $('#btn-preview-produto') && $('#btn-preview-produto').addEventListener('click', function () {
    var name = $('#prod-name').value.trim() || 'Sem nome';
    var cat = $('#prod-category').value === '__outra' ? ($('#prod-category-custom').value.trim() || 'Outra') : $('#prod-category').value;
    var price = parseFloat($('#prod-price').value) || 0;
    var desc = $('#prod-description').value.trim() || 'Sem descrição.';
    var content = $('#preview-content');
    var existing = content.querySelector('.preview-body');
    if (existing) existing.remove();
    var body = document.createElement('div');
    body.className = 'preview-body';
    body.style.cssText = 'display:grid;grid-template-columns:1fr;gap:16px';
    body.innerHTML =
      '<div style="background:#fff;border-radius:18px;overflow:hidden;border:1.5px solid #F5E6EE;max-width:280px">' +
        '<div style="aspect-ratio:3/4;background:linear-gradient(150deg,#FDEFF5,#F5C6DD 55%,#EF8BBF);display:flex;align-items:center;justify-content:center"><img src="' + LILY + '" alt="" style="width:55%;opacity:.45"></div>' +
        '<div style="padding:14px 16px"><div style="font-family:Cormorant Garamond,serif;font-weight:600;font-size:20px;color:#6B0A3C">' + esc(name) + '</div>' +
        '<div style="font-weight:800;color:#C9177C;margin-top:4px">' + brl(price) + '</div></div>' +
      '</div>' +
      '<div style="background:#fff;border-radius:18px;padding:20px;border:1.5px solid #F5E6EE">' +
        '<span style="display:inline-block;background:#C9177C;color:#fff;font-size:10.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:5px 12px;border-radius:999px">' + esc(cat) + '</span>' +
        '<h3 style="font-family:Cormorant Garamond,serif;font-size:26px;color:#6B0A3C;margin:12px 0 4px">' + esc(name) + '</h3>' +
        '<div style="font-weight:800;color:#C9177C;font-size:20px">' + brl(price) + '</div>' +
        '<p style="color:#8A6577;font-size:14px;margin:12px 0 0">' + esc(desc) + '</p>' +
      '</div>';
    content.appendChild(body);
    $('#preview-overlay').classList.add('is-visible');
  });
  $('#btn-fechar-preview') && $('#btn-fechar-preview').addEventListener('click', function () {
    $('#preview-overlay').classList.remove('is-visible');
  });
  $('#preview-overlay') && $('#preview-overlay').addEventListener('click', function (e) {
    if (e.target === this) this.classList.remove('is-visible');
  });

  /* ============================================================
     CONFIG / SENHA
     ============================================================ */
  $('#form-site') && $('#form-site').addEventListener('submit', function (e) {
    e.preventDefault();
    toast('Configurações salvas!', 'sucesso');
  });
  $('#form-senha') && $('#form-senha').addEventListener('submit', function (e) {
    e.preventDefault();
    var nova = $('#senha-nova').value, conf = $('#senha-confirmar').value;
    if (nova.length < 6) { toast('A nova senha precisa de ao menos 6 caracteres.', 'erro'); return; }
    if (nova !== conf) { toast('As senhas não coincidem.', 'erro'); return; }
    toast('Senha alterada com sucesso!', 'sucesso');
    $('#form-senha').reset();
  });

  /* ============================================================
     TOAST
     ============================================================ */
  var toastTimer;
  var ICONS = {
    sucesso: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M20 6 9 17l-5-5"/></svg>',
    erro:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M18 6 6 18M6 6l12 12"/></svg>',
    aviso:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 9v4m0 4h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"/></svg>'
  };
  function toast(msg, type) {
    type = type || 'sucesso';
    var t = $('#toast');
    if (!t) return;
    t.className = 't-' + type + ' is-visible';
    $('#toast-msg').textContent = msg;
    t.querySelector('.toast-icon').innerHTML = ICONS[type] || ICONS.sucesso;
    var bar = t.querySelector('.toast-bar');
    bar.style.animation = 'none'; void bar.offsetWidth; bar.style.animation = '';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-visible'); }, 3000);
  }
  window.pinkAuraToast = toast;

  /* foco inicial no login */
  if ($('#login-user')) $('#login-user').focus();
})();
