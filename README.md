# Lista de presentes de casamento com Pix

Site responsivo com área pública e cadastro protegido. Funciona em hospedagens estáticas (GitHub Pages), usando **Supabase** para banco, login e imagens. Ao clicar em **Pagar com Pix**, o site monta um **BR Code Pix estático com o valor do presente**, mostra um QR Code e um código Pix Copia e Cola. O valor é destinado à chave Pix informada em `config.js`.

## Arquivos

- `index.html`: página que os convidados acessam.
- `admin.html`: login e painel de cadastro, edição e exclusão de presentes.
- `config.js`: nome do casal, Supabase e dados do Pix.
- `style.css`, `common.js`, `index.js`, `admin.js`: interface e lógica.
- `supabase.sql`: cria tabelas, regras de segurança e bucket de fotos.
- `assets/`: imagens de exemplo exibidas apenas no modo demonstração.

## Passo a passo de instalação

### 1. Preparar o Supabase

1. Acesse https://supabase.com/dashboard e crie um projeto, ou use um projeto que você já possui.
2. Dentro do projeto, abra **SQL Editor > New query**.
3. Copie todo o conteúdo de `supabase.sql`, cole no editor e clique em **Run**. Ele cria as tabelas `gifts` e `gift_admins` e o bucket público `gift-images`, com políticas de acesso (RLS).
4. Acesse **Authentication > Users** e crie uma conta com e-mail e senha para o painel administrativo (**Add user**). Se necessário, marque a opção de confirmar o e-mail ao criar pelo painel.
5. Copie o **UID** (UUID) desse usuário.
6. Volte ao **SQL Editor** e execute, trocando pelo UID real (mantenha as aspas):

   ```sql
   insert into public.gift_admins (user_id)
   values ('SEU-UID-REAL-AQUI');
   ```

7. Para adicionar mais um administrador, crie outra conta e repita o INSERT com o novo UID.
8. Confira em **Project Settings > API Keys** a **publishable key** (ou `anon` legada) e em **Connect / Project Settings** a URL do projeto. Os nomes das opções podem variar conforme a versão do painel.

### 2. Configurar o arquivo `config.js`

Altere estas propriedades:

```js
window.WEDDING_CONFIG = {
  SUPABASE_URL: 'https://SEU-PROJETO.supabase.co',
  SUPABASE_PUBLIC_KEY: 'SUA_CHAVE_PUBLICAVEL_DO_SUPABASE',
  COUPLE_NAMES: 'Ana & Pedro',
  WELCOME_MESSAGE: 'Escolha um presente especial e contribua com o nosso casamento!',
  PIX_KEY: 'sua-chave-pix@provedor.com',
  PIX_RECEIVER_NAME: 'ANA MARIA SILVA',
  PIX_RECEIVER_CITY: 'SAO CARLOS'
};
```

**Atenção:** `PIX_RECEIVER_NAME` deve corresponder ao **titular real da chave Pix**, mesmo que seja apenas um dos noivos, e não necessariamente ao nome do casal. `PIX_RECEIVER_CITY` é a cidade do beneficiário. A chave Pix fica visível publicamente e o código Pix vai diretamente a ela. Nunca use `service_role` ou chave `secret` em arquivos estáticos.

### 3. Testar no computador

1. Abra esta pasta no VS Code.
2. Use a extensão **Live Server** e clique em **Open with Live Server** no `index.html`, ou rode `python -m http.server 8000` na pasta e visite `http://localhost:8000`.
3. Abra `admin.html`, faça login com o e-mail e senha cadastrados.
4. Crie presentes com nome, valor e imagem. A descrição é opcional.
5. Volte à `index.html` e atualize. Os presentes cadastrados aparecem para todos os visitantes.
6. **Antes de divulgar**, gere um Pix de teste com valor baixo e confira o destinatário, o valor e a capacidade do seu aplicativo bancário de ler o QR Code. Confirme uma transferência apenas se realmente desejar efetuá-la.

### 4. Publicar no GitHub Pages

1. Crie um repositório no GitHub e envie **todos** os arquivos desta pasta para a raiz do repositório (incluindo `assets/`).
2. No repositório, abra **Settings > Pages**.
3. Em **Build and deployment**, selecione **Deploy from a branch**, escolha a branch `main`, pasta `/(root)` e salve.
4. Aguarde o GitHub fornecer um endereço semelhante a `https://usuario.github.io/nome-do-repositorio/`.
5. Envie esse endereço aos convidados. O painel ficará em `https://usuario.github.io/nome-do-repositorio/admin.html`.

O GitHub Pages é só a hospedagem. Imagens e presentes são mantidos no Supabase e aparecem em todos os dispositivos. Modificações feitas no painel **não exigem** publicar o GitHub novamente.

## Como o Pix funciona (importante)

- O botão gera um **Pix estático com valor preenchido**, conforme a chave configurada. O QR Code usa o padrão BR Code (EMV) e inclui CRC16.
- O convidado paga em seu **próprio aplicativo bancário**, usando a câmera ou o Pix Copia e Cola. O site **não recebe nem processa o dinheiro**.
- O nome do recebedor será exibido pelo banco do convidado. Ele deve conferir **titular e valor** antes de confirmar.
- **Não existe confirmação automática de pagamento** e o presente **não é marcado como pago**. Para ter confirmação, reservas, identificação de cada convidado, comprovantes e evitar duplicidade, é preciso integrar um **provedor de pagamentos Pix com API/webhooks** e um backend seguro, diferente desta versão gratuita com chave Pix estática.
- Um presente pode ser pago mais de uma vez por convidados diferentes. É uma **lista de contribuições**, não um estoque limitado.

## Segurança

- Apenas usuários autorizados na tabela `gift_admins` conseguem cadastrar, editar ou excluir presentes ou enviar fotos. O navegador não usa chave secreta.
- A tabela `gifts` usa RLS, permitindo visitantes lerem apenas presentes ativos.
- Fotos ficam em bucket público porque precisam ser vistas pelos convidados; somente admins podem enviá-las ou apagá-las.
- Não habilite cadastro público de administrador. Adicione novas contas manualmente no Supabase.
- A chave Pix pública pode ser copiada por visitantes (o que é necessário para usá-la). Não a trate como um segredo.

## Personalização

- Mude o nome do casal e o texto de boas-vindas em `config.js`.
- Edite a paleta de cores no início de `style.css` (`--blush`, `--blush-dark`, etc.).
- No painel, você pode cadastrar presentes divertidos como nos prints, cada um com sua própria imagem, nome e valor.

## Imagens padronizadas (atualização de 05/11/2026)

Os cards têm área de imagem com proporção 4:3, fundo off-white e margens uniformes.
As fotos são exibidas completas com `object-fit: contain` e centralizadas, sem recortes.
A prévia de envio e as miniaturas do painel administrativo também foram adaptadas.

**Para atualizar um site que já está publicado:** envie apenas o novo arquivo `style.css`
para a raiz do repositório e, se desejar, o `admin.html` atualizado (a dica
de envio foi ajustada). **Não substitua o seu `config.js` preenchido** pelo
exemplo deste pacote. Nenhuma alteração no banco de dados é necessária.

As imagens originais continuam no Supabase e não precisam ser enviadas novamente.
Apenas muda a maneira como o navegador as enquadra.
