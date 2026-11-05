'use strict';
(function () {
  const config = window.WEDDING_CONFIG || {};
  const moneyFormatter = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function supabaseConfigured() {
    const url = String(config.SUPABASE_URL || '').trim();
    const key = String(config.SUPABASE_PUBLIC_KEY || '').trim();
    return /^https:\/\//i.test(url) && !url.includes('SEU-PROJETO') && key.length > 15 && !key.includes('SUA_CHAVE');
  }

  function createDb() {
    if (!supabaseConfigured()) return null;
    if (!window.supabase || typeof window.supabase.createClient !== 'function') {
      throw new Error('A biblioteca do Supabase não carregou. Verifique sua conexão com a internet.');
    }
    return window.supabase.createClient(config.SUPABASE_URL.trim(), config.SUPABASE_PUBLIC_KEY.trim());
  }

  function imageUrl(db, gift) {
    if (gift.demo_image) return gift.demo_image;
    if (!gift.image_path) return './assets/presente.svg';
    return db.storage.from('gift-images').getPublicUrl(gift.image_path).data.publicUrl;
  }

  function formatMoney(number) {
    return moneyFormatter.format(Number(number));
  }

  function pixConfigured() {
    const key = String(config.PIX_KEY || '').trim();
    const name = String(config.PIX_RECEIVER_NAME || '').trim();
    const city = String(config.PIX_RECEIVER_CITY || '').trim();
    return !!key && !key.includes('SUA_CHAVE') && !!name && !!city && !name.includes('NOME DOS NOIVOS');
  }

  function onlyPixText(text, max) {
    return String(text || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toUpperCase().replace(/[^A-Z0-9 .\-]/g, ' ')
      .replace(/\s+/g, ' ').trim().slice(0, max);
  }

  function emv(id, value) {
    const string = String(value);
    if (string.length > 99) throw new Error('O campo Pix excede o tamanho permitido.');
    return id + String(string.length).padStart(2, '0') + string;
  }

  // Padrão BR Code / EMV: CRC-16/CCITT-FALSE (poly 0x1021, inicial 0xFFFF).
  function crc16(payload) {
    let crc = 0xFFFF;
    for (let i = 0; i < payload.length; i++) {
      crc ^= payload.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
        crc &= 0xFFFF;
      }
    }
    return crc.toString(16).toUpperCase().padStart(4, '0');
  }

  function pixCode(amount, giftId) {
    if (!pixConfigured()) throw new Error('Os dados da conta Pix ainda não foram configurados.');
    const number = Number(amount);
    if (!Number.isFinite(number) || number <= 0 || number > 99999999.99) {
      throw new Error('Valor do Pix inválido.');
    }
    const key = String(config.PIX_KEY).trim();
    const merchant = onlyPixText(config.PIX_RECEIVER_NAME, 25);
    const city = onlyPixText(config.PIX_RECEIVER_CITY, 15);
    if (!key || !merchant || !city) throw new Error('Dados Pix incompletos.');

    // Identifica o presente e a geração do QR; não confirma pagamentos.
    const giftFragment = String(giftId || '').replace(/[^a-zA-Z0-9]/g, '').slice(0, 11).toUpperCase();
    const nonce = Math.random().toString(36).slice(2, 8).toUpperCase();
    const txid = ('PRES' + giftFragment + nonce).slice(0, 25);

    const merchantAccount = emv('00', 'br.gov.bcb.pix') + emv('01', key);
    const body =
      emv('00', '01') +
      emv('26', merchantAccount) +
      emv('52', '0000') +
      emv('53', '986') +
      emv('54', number.toFixed(2)) +
      emv('58', 'BR') +
      emv('59', merchant) +
      emv('60', city) +
      emv('62', emv('05', txid));
    const unfinished = body + '6304';
    return unfinished + crc16(unfinished);
  }

  function setMessage(element, message, isError) {
    if (!element) return;
    element.textContent = message || '';
    element.classList.toggle('error-text', !!isError);
    element.classList.toggle('success-text', !isError && !!message);
  }

  window.WeddingApp = {
    config, supabaseConfigured, pixConfigured, createDb, imageUrl, formatMoney, pixCode, setMessage
  };
})();
