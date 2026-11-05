# Correção de modo claro no site Lara & Gustavo

Esta versão parte do projeto de cartões padronizados e aplica:
- `<meta name="color-scheme" content="only light">` no `index.html` e no `admin.html`.
- `color-scheme: only light` no `style.css`, preservando a paleta bege/creme e o gradiente.
- Mesma imagem floral nos dois cantos, com rotação de 180° no canto inferior.

## Como atualizar sem perder suas mudanças feitas no GitHub

1. No `index.html` e no `admin.html`, adicione a linha abaixo dentro de `<head>`, logo depois de `<meta charset="UTF-8">`:
   `<meta name="color-scheme" content="only light">`
2. Cole o conteúdo de `correcao-site-sempre-claro.css` ao final do seu `style.css`.
3. Envie os arquivos modificados ao GitHub e recarregue o site no celular, limpando o cache se necessário.

Obs.: alguns navegadores (especialmente Samsung Internet com opção de forçar escurecimento) podem impor alterações mesmo com a preferência do site. Neste caso, a pessoa pode desativar a opção "Forçar modo escuro para conteúdo da Web" nas configurações do navegador.

Não é necessário mexer no Supabase, nos dados Pix ou reenviar imagens.
