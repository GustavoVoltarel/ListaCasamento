/*
  CONFIGURAÇÃO DO SITE
  1) Preencha a URL e a CHAVE PUBLICÁVEL (publishable ou anon) do Supabase.
  2) Preencha os dados PIX exatamente como cadastrados no banco.
  3) Nunca coloque a service_role nem chaves secretas neste arquivo.
*/
window.WEDDING_CONFIG = {
  SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
  SUPABASE_PUBLIC_KEY: 'SUA_CHAVE_PUBLICAVEL_DO_SUPABASE',

  COUPLE_NAMES: 'Lara & Gustavo',
  WELCOME_MESSAGE: 'Para quem deseja nos presentear, preparamos uma seleção especial de presentes e disponibilizamos a opção de contribuir via Pix.',

  PIX_KEY: 'SUA_CHAVE_PIX',
  PIX_RECEIVER_NAME: 'NOME DO TITULAR DA CHAVE',
  PIX_RECEIVER_CITY: 'SAO CARLOS'
};
