'use strict';
(function () {
  const app = window.WeddingApp;
  const form = document.getElementById('rsvpForm');
  const extraList = document.getElementById('additionalGuests');
  const addButton = document.getElementById('addGuestButton');
  const submit = document.getElementById('submitRsvp');
  const feedback = document.getElementById('rsvpFeedback');
  const countLabel = document.getElementById('guestCountLabel');
  const closedNotice = document.getElementById('rsvpClosed');
  const maxAdditional = 10;
  let db = null;
  let nextIndex = 0;
  let finished = false;
  let closed = false;

  // Prazo inclusivo: 20/02/2027 é o último dia válido, em Brasília.
  // A hora do celular afeta somente a interface. O Supabase aplica o bloqueio real.
  function deadlineReached() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date());
    const value = Object.fromEntries(parts.map(part => [part.type, part.value]));
    const dateBR = `${value.year}-${value.month}-${value.day}`;
    return dateBR >= '2027-02-21';
  }

  function updateDeadlineState() {
    if (!closed && deadlineReached()) {
      closed = true;
      form.hidden = true;
      closedNotice.hidden = false;
      submit.disabled = true;
      addButton.disabled = true;
      document.getElementById('rsvpFormTitle').textContent = 'Confirmações encerradas';
      document.querySelector('.rsvp-explainer').hidden = true;
    }
    return closed;
  }

  function setFeedback(message, error = false) {
    feedback.textContent = message;
    feedback.classList.toggle('error-text', error);
    feedback.classList.toggle('success-text', !error);
  }

  function totalGuests() {
    return 1 + extraList.querySelectorAll('input[data-guest]').length;
  }

  function updateControls() {
    const n = totalGuests();
    countLabel.textContent = `${n} ${n === 1 ? 'pessoa' : 'pessoas'} nesta confirmação.`;
    addButton.disabled = n >= maxAdditional + 1 || finished || closed;
  }

  function addGuest() {
    if (updateDeadlineState() || totalGuests() >= maxAdditional + 1) return;
    const index = ++nextIndex;
    const wrapper = document.createElement('div');
    wrapper.className = 'rsvp-guest';
    const field = document.createElement('div');
    field.className = 'field';
    const label = document.createElement('label');
    label.className = 'field-label';
    label.htmlFor = `extraGuest${index}`;
    label.textContent = `Convidado adicional ${index} *`;
    const input = document.createElement('input');
    input.id = label.htmlFor;
    input.type = 'text';
    input.placeholder = 'Nome e sobrenome';
    input.required = true;
    input.minLength = 2;
    input.maxLength = 120;
    input.dataset.guest = 'true';
    field.append(label, input);
    const remove = document.createElement('button');
    remove.className = 'button button-subtle';
    remove.type = 'button';
    remove.textContent = 'Remover';
    remove.setAttribute('aria-label', `Remover convidado adicional ${index}`);
    remove.addEventListener('click', () => {
      wrapper.remove();
      updateControls();
      setFeedback('');
    });
    wrapper.append(field, remove);
    extraList.appendChild(wrapper);
    updateControls();
    input.focus();
  }

  addButton.addEventListener('click', addGuest);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (updateDeadlineState() || finished || !db) return;
    const name = document.getElementById('primaryGuest').value.trim().replace(/\s+/g, ' ');
    const extras = [...extraList.querySelectorAll('input[data-guest]')]
      .map(el => el.value.trim().replace(/\s+/g, ' '));
    const names = [name, ...extras];
    if (names.some(n => n.length < 2 || n.length > 120)) {
      setFeedback('Preencha o nome completo de todas as pessoas antes de confirmar.', true);
      return;
    }
    const normalized = names.map(n => n.toLocaleLowerCase('pt-BR'));
    if (new Set(normalized).size !== normalized.length) {
      setFeedback('Há nomes repetidos nesta confirmação. Verifique os convidados.', true);
      return;
    }
    // Campo invisível para reduzir envios por robôs simples.
    if (document.getElementById('websiteAddress').value.trim()) return;

    submit.disabled = true;
    addButton.disabled = true;
    submit.textContent = 'Confirmando...';
    setFeedback('');
    try {
      // Data/hora é preenchida no banco, não no navegador.
      const { error } = await db.from('rsvp_confirmations').insert({
        primary_guest: name,
        additional_guests: extras
      });
      if (error) throw error;
      finished = true;
      form.querySelectorAll('input').forEach(input => { input.disabled = true; });
      addButton.hidden = true;
      submit.hidden = true;
      const n = names.length;
      setFeedback(`Presença confirmada com sucesso para ${n} ${n === 1 ? 'pessoa' : 'pessoas'}! Agradecemos o carinho e esperamos vocês em 13 de março de 2027.`);
    } catch (error) {
      console.error('Erro ao confirmar:', error);
      if (updateDeadlineState() || /prazo de confirma[cç][aã]o encerrado/i.test(error.message || '')) {
        closed = true;
        form.hidden = true;
        closedNotice.hidden = false;
        document.getElementById('rsvpFormTitle').textContent = 'Confirmações encerradas';
        document.querySelector('.rsvp-explainer').hidden = true;
      } else {
        setFeedback('Não foi possível salvar sua confirmação. Verifique a conexão e tente novamente. Se o erro persistir, confira se o SQL de confirmação foi executado.', true);
        submit.disabled = false;
        addButton.disabled = false;
      }
    } finally {
      submit.textContent = 'Confirmar presença';
      updateControls();
    }
  });

  try {
    if (!app.supabaseConfigured()) {
      document.getElementById('rsvpSetup').hidden = false;
      submit.disabled = true;
    } else {
      db = app.createDb();
    }
  } catch (error) {
    document.getElementById('rsvpSetup').hidden = false;
    submit.disabled = true;
    console.error(error);
  }
  updateDeadlineState();
  updateControls();
  // Atualiza até mesmo quando alguém deixa a aba aberta durante a virada do dia.
  const deadlineTimer = window.setInterval(() => {
    if (updateDeadlineState()) window.clearInterval(deadlineTimer);
  }, 60_000);
  window.addEventListener('focus', updateDeadlineState);
  document.addEventListener('visibilitychange', updateDeadlineState);
})();
