# Ajustes — cabeçalho e exportação

Atualize somente estes arquivos no GitHub:

- `style.css`: remove a posição sticky/fixa do cabeçalho de todas as páginas.
- `confirmacoes.js`: muda os downloads Excel e CSV para **Nome** e **Data da confirmação**, sem colunas ou abas extras.

A exportação gera uma linha por pessoa, inclusive os acompanhantes. A data aparece no formato brasileiro `dd/mm/aaaa`, considerada a região de Brasília. O painel continua mostrando data e horário completo, mas o arquivo baixado leva somente a data.

Nenhuma alteração no Supabase é necessária. Não substitua o seu `config.js` preenchido pela versão de exemplo do pacote.
