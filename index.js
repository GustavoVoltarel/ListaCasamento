'use strict';
(function () {
  const app = window.WeddingApp;
  const grid = document.getElementById('giftsGrid');
  const counter = document.getElementById('giftCount');
  const notice = document.getElementById('notice');
  const empty = document.getElementById('emptyState');
  const dialog = document.getElementById('pixDialog');
  const qrTarget = document.getElementById('pixQr');
  const codeInput = document.getElementById('pixCopyCode');
  const feedback = document.getElementById('pixFeedback');
  let db = null;

  const demoGifts = [
    { id: 'exemplo1', name: 'Uma ajudinha para a lua de mel', description: 'Para uma aventura inesquecível a dois!', amount: 250, demo_image: './assets/viagem.svg' },
    { id: 'exemplo2', name: 'Terapia para os noivos depois do casamento', description: 'Porque organizar casamento dá trabalho, né?', amount: 200, demo_image: './assets/terapia.svg' },
    { id: 'exemplo3', name: 'Um jantar bem romântico para o casal', description: 'Para brindar o começo de uma nova história.', amount: 350, demo_image: './assets/jantar.svg' }
  ];

  function createGiftCard(gift) {
    const article = document.createElement('article');
    article.className = 'gift-card';

    const imageWrap = document.createElement('div');
    imageWrap.className = 'gift-image';
    const img = document.createElement('img');
    img.src = app.imageUrl(db, gift);
    img.alt = 'Imagem do presente: ' + gift.name;
    img.loading = 'lazy';
    img.addEventListener('error', () => { img.onerror = null; img.src = './assets/presente.svg'; }, { once: true });
    imageWrap.appendChild(img);

    const body = document.createElement('div');
    body.className = 'gift-card-body';
    const title = document.createElement('h3');
    title.textContent = gift.name;
    const description = document.createElement('p');
    description.className = 'gift-description';
    description.textContent = gift.description || '';
    const price = document.createElement('div');
    price.className = 'gift-price';
    price.textContent = app.formatMoney(gift.amount);

    const button = document.createElement('button');
    button.className = 'button button-primary';
    button.type = 'button';
    button.innerHTML = '<span aria-hidden="true">▦</span> Pagar com Pix';
    button.addEventListener('click', () => openPix(gift));

    body.append(title, description, price, button);
    article.append(imageWrap, body);
    return article;
  }

  function render(gifts) {
    grid.replaceChildren();
    for (const gift of gifts) grid.appendChild(createGiftCard(gift));
    counter.textContent = gifts.length + (gifts.length === 1 ? ' presente' : ' presentes');
    empty.hidden = gifts.length !== 0;
  }

  function showNotice(message) {
    notice.textContent = message;
    notice.hidden = !message;
  }

  function openPix(gift) {
    if (!app.pixConfigured()) {
      alert('O Pix ainda não foi configurado. Preencha PIX_KEY, PIX_RECEIVER_NAME e PIX_RECEIVER_CITY em config.js.');
      return;
    }
    try {
      const code = app.pixCode(gift.amount, gift.id);
      document.getElementById('pixGiftName').textContent = gift.name;
      document.getElementById('pixAmount').textContent = app.formatMoney(gift.amount);
      codeInput.value = code;
      feedback.textContent = '';
      qrTarget.replaceChildren();
      if (typeof window.QRCode === 'undefined') {
        throw new Error('O gerador de QR Code não foi carregado. Verifique a conexão com a internet.');
      }
      new window.QRCode(qrTarget, {
        text: code, width: 190, height: 190,
        colorDark: '#372d32', colorLight: '#ffffff',
        correctLevel: window.QRCode.CorrectLevel.M
      });
      dialog.showModal();
    } catch (error) {
      alert('Não foi possível gerar o Pix: ' + error.message);
    }
  }

  document.getElementById('closePix').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (event) => { if (event.target === dialog) dialog.close(); });
  document.getElementById('copyPixBtn').addEventListener('click', async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(codeInput.value);
      } else {
        codeInput.focus(); codeInput.select();
        if (!document.execCommand('copy')) throw new Error('Selecione e copie o texto manualmente.');
      }
      feedback.textContent = 'Código copiado! Agora cole no aplicativo do banco.';
    } catch (_) {
      feedback.textContent = 'Não foi possível copiar automaticamente. Selecione o código acima e copie manualmente.';
    }
  });

  async function init() {
    if (app.config.COUPLE_NAMES) {
      document.getElementById('coupleNames').textContent = app.config.COUPLE_NAMES;
      const headerNames = document.getElementById('headerCoupleNames');
      if (headerNames) headerNames.textContent = app.config.COUPLE_NAMES;
      document.title = app.config.COUPLE_NAMES + ' | Lista de Presentes';
    }
    if (app.config.WELCOME_MESSAGE) {
      document.getElementById('welcomeMessage').textContent = app.config.WELCOME_MESSAGE;
    }

    if (!app.supabaseConfigured()) {
      showNotice('Modo de demonstração: estes são presentes de exemplo. Configure o Supabase e a chave Pix para publicar sua lista real.');
      render(demoGifts);
      return;
    }
    try {
      db = app.createDb();
      const { data, error } = await db.from('gifts')
        .select('id,name,description,amount,image_path,created_at')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      render(data || []);
      if (!app.pixConfigured()) showNotice('Os presentes estão disponíveis, mas o Pix ainda precisa ser configurado em config.js.');
    } catch (error) {
      console.error('Erro ao carregar os presentes:', error);
      showNotice('Não foi possível carregar a lista agora. Verifique a configuração e tente atualizar a página.');
      counter.textContent = 'Indisponível';
      empty.hidden = false;
      empty.querySelector('h3').textContent = 'Não foi possível carregar os presentes';
      empty.querySelector('p').textContent = 'Tente novamente em alguns instantes.';
    }
  }

  init();
})();
