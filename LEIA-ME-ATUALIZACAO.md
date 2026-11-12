# Atualização — Lara & Gustavo: presença e fonte Amoresa

Esta edição **parte da versão clara anterior**, com flores transparentes e cards de presentes padronizados. Não é o redesign alternativo que você descartou.

## Novidades

- **Nome do casal**: `Amoresa` configurada no cabeçalho e no destaque principal; fonte reserva `Great Vibes` caso não exista arquivo licenciado.
- **Descrição dos presentes**: tamanho reduzido de 14px para 12,5px, sem alterar o título, preço e botão Pix.
- **`presenca.html`**: página pública para confirmar participação; admite o nome principal e **até 10 acompanhantes**, com botão Adicionar/Remover.
- **`confirmacoes.html`**: página exclusiva de administradores, com login, busca por convidado, totais, agrupamento por confirmação e **data/hora de Brasília**.
- **Exportações**: `Excel (.xlsx)` com duas abas (*Convidados* e *Resumo*) e `CSV` como alternativa compatível com Excel.
- **Banco de dados**: tabela `rsvp_confirmations`, com registro de horário gerado no servidor e RLS para preservar a privacidade dos convidados.

## Instalação: projeto que já funciona no GitHub e Supabase

1. No projeto **já existente**, abra **Supabase > SQL Editor** e execute **apenas** `supabase-rsvp.sql`. Ele é independente da tabela `gifts` e pode ser executado mais de uma vez. **Não apague suas tabelas**.
2. No repositório GitHub, atualize `index.html`, `admin.html` e `style.css` e adicione **quatro arquivos novos**: `presenca.html`, `presenca.js`, `confirmacoes.html`, `confirmacoes.js`.
3. **Preserve o conteúdo real do seu `config.js`**, inclusive a chave pública e os dados Pix. Você não precisa alterá-lo para a funcionalidade de presença.
4. Mantenha as imagens da pasta `assets/` com os nomes atuais. O pacote inclui as imagens transparentes usadas na versão anterior.
5. Publicado no GitHub Pages, acesse `https://SEU-USUARIO.github.io/REPOSITORIO/presenca.html`. O painel fica em `.../confirmacoes.html` e também estará vinculado dentro de `admin.html`.
6. Faça uma confirmação de teste com **um nome e um acompanhante**, volte ao painel, confira os nomes, a data/hora e baixe o Excel. Se desejar, apague o registro de teste pelo **Supabase > Table Editor > rsvp_confirmations**; não disponibilizamos exclusão pública no site.

Se o projeto **ainda não tiver** as tabelas de presentes, o `supabase.sql` incluído neste pacote contém **o setup dos presentes mais a funcionalidade de presença**. Para o projeto que você já criou, prefira somente `supabase-rsvp.sql`.

## Ativação da fonte Amoresa

A fonte Amoresa indicada no Fonts Hut é apresentada como fonte de uso pessoal. Para publicá-la como fonte embutida em um site, **confirme que sua licença permite webfont / redistribuição Web**. Não incluímos fontes no ZIP.

1. Obtenha o arquivo pelo canal/licença apropriado.
2. Se tiver autorização de incorporação em site, envie seu arquivo de fonte para `assets/fonts/` com **um** destes nomes exatos:
   - `Amoresa-Regular.woff2` (preferencial), ou
   - `Amoresa-Regular.otf`.
3. Publique a pasta junto com o site; o `style.css` já contém `@font-face`. Enquanto não houver arquivo válido, os nomes aparecem com a fonte cursiva alternativa `Great Vibes`.

A fonte não precisa ser instalada nos celulares dos convidados: o navegador carrega o arquivo do próprio site, quando legalmente hospedado.

## Banco e privacidade

A tabela `public.rsvp_confirmations` usa:

| Coluna | Descrição |
|---|---|
| `id` | UUID da confirmação |
| `primary_guest` | Nome da pessoa responsável |
| `additional_guests` | Nomes dos acompanhantes |
| `confirmed_at` | Data/hora fornecida pelo servidor Supabase (`timestamptz`) |

O formulário público só pode **INSERIR nomes**; não pode consultar todas as confirmações. Mesmo que o convidado manipule o formulário, não pode atribuir diretamente o horário, porque o SQL concede permissão de inserção **apenas** às colunas de nome. A leitura exige usuário logado e previamente cadastrado em `gift_admins` (mesma autorização do painel de presentes). Os dados de RSVP não são publicados na página pública.

**Observações:**

- O botão registra a **confirmação de presença**, mas não garante que a pessoa efetivamente comparecerá.
- Como o formulário não exige identidade, uma mesma pessoa pode enviar mais de uma confirmação. Para uma lista de convidados fechada e evitar duplicidade, é preciso acrescentar identificação/validação por convite.
- Como todo formulário aberto, há risco de envios automatizados. Se o site começar a receber spam, a melhoria recomendada é validar CAPTCHA no servidor, usando uma Edge Function, antes de gravar.
- O prazo **20/02/2027** aparece como orientação visual, mas não há bloqueio automático dos envios após essa data.
- Os dados Pix e as imagens de presentes continuam como na versão anterior, sem alteração de funcionamento.
- A exportação `.xlsx` depende do script ExcelJS carregado por CDN. Em redes que bloqueiem a CDN, use **Baixar CSV**, que abre no Excel.

