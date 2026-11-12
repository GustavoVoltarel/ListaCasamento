'use strict';
(function () {
  const app = window.WeddingApp;
  const el = id => document.getElementById(id);
  const list = el('rsvpList');
  const message = el('listMessage');
  const loginError = el('loginError');
  let db = null;
  let confirmations = [];
  const timeFormat = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  });

  function formatWhen(value) {
    return value ? timeFormat.format(new Date(value)) : '—';
  }
  function numPeople(row) {
    return 1 + (Array.isArray(row.additional_guests) ? row.additional_guests.length : 0);
  }
  function guests(row) {
    return [row.primary_guest, ...(row.additional_guests || [])];
  }
  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function filename(ext) {
    const localDate = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    return `confirmacoes-lara-gustavo-${localDate}.${ext}`;
  }
  // O arquivo exportado mostra uma pessoa por linha, inclusive acompanhantes.
  // A data é extraída no horário de Brasília, sem horário ou outras colunas.
  const dateFormat = new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
  function formatDate(value) {
    return value ? dateFormat.format(new Date(value)) : '';
  }
  function rowsForExport() {
    return confirmations.flatMap(group => guests(group).map(name => ({
      name,
      date: formatDate(group.confirmed_at)
    })));
  }

  function csvSafe(value) {
    let cell = String(value ?? '');
    // Evita interpretar nomes iniciados por =, +, - ou @ como fórmulas no Excel.
    if (/^[\s]*[=+@\-\t\r]/.test(cell)) cell = "'" + cell;
    return '"' + cell.replace(/"/g, '""') + '"';
  }
  function exportCSV() {
    const columns = ['Nome', 'Data da confirmação'];
    const lines = [columns, ...rowsForExport().map(row => [row.name, row.date])]
      .map(row => row.map(csvSafe).join(';'));
    downloadBlob(new Blob(['\ufeff', lines.join('\r\n')], {type: 'text/csv;charset=utf-8'}), filename('csv'));
  }
  async function exportXLSX() {
    if (!window.ExcelJS) {
      app.setMessage(message, 'Não foi possível carregar o gerador do Excel. Use o botão CSV, que também abre no Excel.', true);
      return;
    }
    const button = el('exportXlsxButton');
    button.disabled = true;
    button.textContent = 'Gerando Excel...';
    try {
      const wb = new window.ExcelJS.Workbook();
      wb.creator = 'Lara e Gustavo';
      wb.created = new Date();
      const ws = wb.addWorksheet('Convidados');
      ws.columns = [
        {header: 'Nome', key: 'name', width: 45},
        {header: 'Data da confirmação', key: 'date', width: 24}
      ];
      rowsForExport().forEach(row => ws.addRow({
        name: row.name,
        date: row.date
      }));
      ws.views = [{state: 'frozen', ySplit: 1}];
      ws.autoFilter = `A1:B${Math.max(2, ws.rowCount)}`;
      ws.getRow(1).height = 26;
      ws.getRow(1).eachCell(cell => {
        cell.font = {bold: true, color: {argb: 'FFFFFFFF'}, size: 11};
        cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FF607465'}};
        cell.alignment = {vertical: 'middle'};
      });
      ws.eachRow((row, n) => {
        if (n > 1) {
          row.height = 21;
          row.eachCell(cell => {
            cell.alignment = {vertical: 'middle', wrapText: true};
            if (n % 2 === 0) {
              cell.fill = {type: 'pattern', pattern: 'solid', fgColor: {argb: 'FFF8F4EE'}};
            }
          });
        }
      });
      const bytes = await wb.xlsx.writeBuffer();
      downloadBlob(new Blob([bytes], {type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}), filename('xlsx'));
      app.setMessage(message, 'Planilha Excel gerada com sucesso.');
    } catch (error) {
      console.error('Erro ao exportar XLSX', error);
      app.setMessage(message, 'Erro ao gerar Excel. Use a exportação CSV como alternativa.', true);
    } finally {
      button.disabled = false;
      button.textContent = 'Baixar Excel (.xlsx)';
    }
  }

  function showLogin(error = '') {
    el('adminContent').hidden = true;
    el('loginPanel').hidden = false;
    app.setMessage(loginError,error,!!error);
  }
  function render() {
    const term = el('rsvpSearch').value.trim().toLocaleLowerCase('pt-BR');
    const filtered = confirmations.filter(row => guests(row)
      .some(name => name.toLocaleLowerCase('pt-BR').includes(term)));
    list.replaceChildren();
    el('totalGroups').textContent = confirmations.length;
    el('totalPeople').textContent = confirmations.reduce((s,g)=>s+numPeople(g),0);
    el('lastRefresh').textContent = `${filtered.length} ${filtered.length === 1 ? 'grupo' : 'grupos'}`;
    if (!filtered.length) {
      const p = document.createElement('p');
      p.className = 'rsvp-empty';
      p.textContent = term ? 'Nenhum nome corresponde à busca.' : 'Ainda não recebemos confirmações.';
      list.append(p);
      return;
    }
    for (const group of filtered) {
      const article = document.createElement('article');
      article.className = 'rsvp-entry';
      const div = document.createElement('div');
      const title = document.createElement('h3');
      title.textContent = group.primary_guest;
      const count = document.createElement('span');
      count.className = 'entry-count';
      count.textContent = `${numPeople(group)} ${numPeople(group) === 1 ? 'pessoa' : 'pessoas'}`;
      div.append(title,count);
      if ((group.additional_guests || []).length) {
        const detail = document.createElement('p');
        detail.textContent = 'Acompanhantes: ' + group.additional_guests.join(', ');
        div.append(detail);
      }
      const date = document.createElement('p');
      date.className = 'entry-date';
      date.textContent = formatWhen(group.confirmed_at);
      article.append(div,date);
      list.append(article);
    }
  }
  async function load() {
    app.setMessage(message,'');
    try {
      const result = [];
      const pageSize = 500;
      for (let start = 0; start < 10000; start += pageSize) {
        const {data,error} = await db.from('rsvp_confirmations')
          .select('id,primary_guest,additional_guests,confirmed_at')
          .order('confirmed_at',{ascending:false})
          .range(start,start + pageSize - 1);
        if (error) throw error;
        result.push(...(data||[]));
        if (!data || data.length < pageSize) break;
      }
      confirmations = result;
      render();
    } catch (error) {
      console.error(error);
      app.setMessage(message, 'Erro ao carregar as confirmações. Verifique se executou supabase-rsvp.sql e se sua conta está autorizada.', true);
      list.replaceChildren();
    }
  }
  async function authorize() {
    const {data, error} = await db.auth.getUser();
    if (error || !data.user) { showLogin(); return; }
    const {data: permission,error:permissionError} = await db.from('gift_admins')
      .select('user_id').eq('user_id',data.user.id).maybeSingle();
    if (permissionError || !permission) {
      await db.auth.signOut();
      showLogin('Sua conta não está autorizada a consultar os convidados.');
      return;
    }
    el('loginPanel').hidden = true;
    el('adminContent').hidden = false;
    el('currentEmail').textContent = data.user.email || 'usuário autorizado';
    await load();
  }
  el('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    const button = el('loginButton');
    button.disabled = true;
    app.setMessage(loginError,'');
    try {
      const {error} = await db.auth.signInWithPassword({
        email:el('loginEmail').value.trim(),password:el('loginPassword').value
      });
      if (error) throw error;
      await authorize();
    } catch (err) { app.setMessage(loginError,'Falha no login: '+err.message,true); }
    finally { button.disabled = false; }
  });
  el('logoutButton').addEventListener('click',async () => {
    await db.auth.signOut();
    showLogin();
  });
  el('refreshButton').addEventListener('click',load);
  el('rsvpSearch').addEventListener('input',render);
  el('exportXlsxButton').addEventListener('click',exportXLSX);
  el('exportCsvButton').addEventListener('click',exportCSV);
  async function init() {
    if (!app.supabaseConfigured()) { el('setupPanel').hidden = false; return; }
    try { db = app.createDb(); await authorize(); }
    catch (error) {
      el('setupPanel').hidden = false;
      app.setMessage(el('setupPanel').querySelector('p'),'Erro ao conectar: '+error.message,true);
    }
  }
  init();
})();
