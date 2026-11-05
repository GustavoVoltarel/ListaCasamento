'use strict';
(function () {
  const app = window.WeddingApp;
  const el = (id) => document.getElementById(id);
  const loginPanel = el('loginPanel');
  const loginError = el('loginError');
  const setupPanel = el('setupPanel');
  const adminContent = el('adminContent');
  const giftForm = el('giftForm');
  const giftMessage = el('giftMessage');
  const imageInput = el('giftImage');
  const previewWrap = el('imagePreviewWrap');
  const preview = el('imagePreview');
  let db = null;
  let gifts = [];
  let editingGift = null;
  let imagePreviewUrl = null;

  const validImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const maxFileSize = 5 * 1024 * 1024;

  function displayLogin(message) {
    adminContent.hidden = true;
    loginPanel.hidden = false;
    app.setMessage(loginError, message, !!message);
  }

  function validateImage(file) {
    if (!file) return;
    if (!validImageTypes.has(file.type)) throw new Error('Envie uma imagem JPG, PNG ou WebP.');
    if (file.size > maxFileSize) throw new Error('A imagem deve ter no máximo 5 MB.');
  }

  function setPreview(url) {
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
    imagePreviewUrl = null;
    if (!url) {
      previewWrap.hidden = true;
      preview.removeAttribute('src');
      return;
    }
    preview.src = url;
    previewWrap.hidden = false;
  }

  imageInput.addEventListener('change', () => {
    try {
      const file = imageInput.files[0];
      validateImage(file);
      if (file) {
        if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);
        imagePreviewUrl = URL.createObjectURL(file);
        preview.src = imagePreviewUrl;
        previewWrap.hidden = false;
      } else if (editingGift) {
        setPreview(app.imageUrl(db, editingGift));
      } else setPreview(null);
      app.setMessage(giftMessage, '');
    } catch (error) {
      imageInput.value = '';
      if (editingGift) setPreview(app.imageUrl(db, editingGift));
      else setPreview(null);
      app.setMessage(giftMessage, error.message, true);
    }
  });

  function resetForm() {
    editingGift = null;
    giftForm.reset();
    el('giftActive').checked = true;
    imageInput.required = true;
    el('imageRequiredLabel').textContent = '*';
    el('formTitle').textContent = 'Adicionar novo presente';
    el('saveGiftButton').textContent = 'Salvar presente';
    el('cancelEdit').hidden = true;
    setPreview(null);
    app.setMessage(giftMessage, '');
  }
  el('cancelEdit').addEventListener('click', resetForm);

  function editGift(gift) {
    editingGift = gift;
    el('giftName').value = gift.name;
    el('giftAmount').value = Number(gift.amount).toFixed(2);
    el('giftDescription').value = gift.description || '';
    el('giftActive').checked = gift.is_active;
    imageInput.value = '';
    imageInput.required = false;
    el('imageRequiredLabel').textContent = '(opcional ao editar)';
    el('formTitle').textContent = 'Editar presente';
    el('saveGiftButton').textContent = 'Salvar alterações';
    el('cancelEdit').hidden = false;
    setPreview(app.imageUrl(db, gift));
    app.setMessage(giftMessage, '');
    giftForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function removeGift(gift) {
    if (!confirm('Excluir definitivamente o presente "' + gift.name + '"?')) return;
    try {
      const { error } = await db.from('gifts').delete().eq('id', gift.id);
      if (error) throw error;
      if (gift.image_path) {
        const { error: fileError } = await db.storage.from('gift-images').remove([gift.image_path]);
        if (fileError) console.warn('Imagem órfã no storage:', fileError);
      }
      if (editingGift && editingGift.id === gift.id) resetForm();
      await loadGifts();
    } catch (error) {
      alert('Não foi possível excluir o presente: ' + error.message);
    }
  }

  function drawGiftList() {
    const list = el('managedList');
    list.replaceChildren();
    el('adminCount').textContent = gifts.length + (gifts.length === 1 ? ' presente' : ' presentes');
    if (!gifts.length) {
      const p = document.createElement('p');
      p.className = 'managed-empty';
      p.textContent = 'Nenhum presente cadastrado. Comece pelo formulário acima.';
      list.appendChild(p);
      return;
    }

    for (const gift of gifts) {
      const row = document.createElement('article');
      row.className = 'managed-gift';
      const img = document.createElement('img');
      img.className = 'managed-thumb';
      img.src = app.imageUrl(db, gift);
      img.alt = '';
      img.loading = 'lazy';
      img.addEventListener('error', () => { img.onerror = null; img.src = './assets/presente.svg'; }, { once: true });
      const detail = document.createElement('div');
      detail.className = 'managed-detail';
      const name = document.createElement('h3');
      name.textContent = gift.name;
      const price = document.createElement('p');
      price.textContent = app.formatMoney(gift.amount);
      const status = document.createElement('span');
      status.className = 'managed-status' + (gift.is_active ? '' : ' inactive');
      status.textContent = gift.is_active ? '● Visível' : '○ Oculto';
      detail.append(name, price, status);
      const actions = document.createElement('div');
      actions.className = 'managed-actions';
      const edit = document.createElement('button');
      edit.type = 'button'; edit.className = 'button button-outline'; edit.textContent = 'Editar';
      edit.addEventListener('click', () => editGift(gift));
      const del = document.createElement('button');
      del.type = 'button'; del.className = 'button button-subtle'; del.textContent = 'Excluir';
      del.addEventListener('click', () => removeGift(gift));
      actions.append(edit, del);
      row.append(img, detail, actions);
      list.appendChild(row);
    }
  }

  async function loadGifts() {
    const { data, error } = await db.from('gifts').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    gifts = data || [];
    drawGiftList();
  }

  async function uploadImage(file) {
    if (!file) return null;
    validateImage(file);
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type];
    const path = 'catalog/' + crypto.randomUUID() + '.' + ext;
    const { error } = await db.storage.from('gift-images').upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw error;
    return path;
  }

  giftForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const submit = el('saveGiftButton');
    const file = imageInput.files[0] || null;
    let newImagePath = null;
    let savedInDatabase = false;
    try {
      if (!editingGift && !file) throw new Error('Escolha uma imagem para o presente.');
      validateImage(file);
      const amount = Number(el('giftAmount').value);
      const name = el('giftName').value.trim();
      if (!name) throw new Error('Informe o nome do presente.');
      if (!Number.isFinite(amount) || amount <= 0 || amount > 99999999.99) throw new Error('Informe um valor válido.');
      const payload = {
        name,
        amount: Math.round(amount * 100) / 100,
        description: el('giftDescription').value.trim() || null,
        is_active: el('giftActive').checked
      };
      submit.disabled = true;
      submit.textContent = 'Salvando...';
      app.setMessage(giftMessage, '');
      if (file) {
        newImagePath = await uploadImage(file);
        payload.image_path = newImagePath;
      }
      const previousImage = editingGift && editingGift.image_path;
      let query = editingGift
        ? db.from('gifts').update(payload).eq('id', editingGift.id)
        : db.from('gifts').insert(payload);
      const { error } = await query;
      if (error) throw error;
      savedInDatabase = true;
      if (newImagePath && previousImage) {
        const { error: oldImageError } = await db.storage.from('gift-images').remove([previousImage]);
        if (oldImageError) console.warn('Não foi possível apagar a imagem antiga:', oldImageError);
      }
      resetForm();
      await loadGifts();
      app.setMessage(giftMessage, 'Presente salvo com sucesso! Ele já estará disponível na lista pública se estiver visível.');
    } catch (error) {
      console.error(error);
      if (newImagePath && !savedInDatabase) await db.storage.from('gift-images').remove([newImagePath]);
      app.setMessage(giftMessage, 'Erro ao salvar: ' + error.message, true);
    } finally {
      submit.disabled = false;
      submit.textContent = editingGift ? 'Salvar alterações' : 'Salvar presente';
    }
  });

  async function authorizeUser() {
    const { data: userData, error: userError } = await db.auth.getUser();
    if (userError || !userData.user) {
      displayLogin('');
      return;
    }
    const user = userData.user;
    const { data, error } = await db.from('gift_admins')
      .select('user_id').eq('user_id', user.id).maybeSingle();
    if (error || !data) {
      await db.auth.signOut();
      displayLogin(error ? 'Erro ao verificar permissão: ' + error.message : 'Esta conta não está autorizada a gerenciar presentes.');
      return;
    }
    loginPanel.hidden = true;
    adminContent.hidden = false;
    el('currentEmail').textContent = user.email || 'usuário autorizado';
    try { await loadGifts(); }
    catch (err) { app.setMessage(giftMessage, 'Não foi possível carregar os presentes: ' + err.message, true); }
  }

  el('loginForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const button = el('loginButton');
    button.disabled = true;
    app.setMessage(loginError, '');
    try {
      const { error } = await db.auth.signInWithPassword({
        email: el('loginEmail').value.trim(), password: el('loginPassword').value
      });
      if (error) throw error;
      await authorizeUser();
    } catch (error) {
      app.setMessage(loginError, 'Não foi possível entrar: ' + error.message, true);
    } finally { button.disabled = false; }
  });

  el('logoutButton').addEventListener('click', async () => {
    await db.auth.signOut();
    resetForm();
    displayLogin('');
  });

  async function init() {
    if (!app.supabaseConfigured()) { setupPanel.hidden = false; return; }
    try { db = app.createDb(); await authorizeUser(); }
    catch (error) { setupPanel.hidden = false; setupPanel.querySelector('p').textContent = 'Falha ao conectar com o Supabase: ' + error.message; }
  }
  init();
})();
