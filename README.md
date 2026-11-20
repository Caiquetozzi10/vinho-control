# Adega Flow

Crie uma plataforma web completa e profissional para controle de estoque, vendas e administração de usuários para adegas. A plataforma deve ter arquitetura moderna, design limpo e usabilidade simples para operadores. O sistema deve conter as seguintes funcionalidades e telas:

🔐 1. Tela de Login

Login por e-mail e senha.

Verificação se o usuário está ativo ou bloqueado.

Caso esteja bloqueado por falta de pagamento, exibir mensagem:
“Seu acesso está bloqueado. Entre em contato com o administrador.”

🏢 2. Painel Administrativo (somente para o dono da plataforma)

Crie uma área exclusiva do administrador geral, com as seguintes funções:

2.1 Gerenciamento de Adegas / Clientes

Criar nova adega / cliente.

Editar informações da adega.

Ativar ou desativar o acesso.

Filtrar por:

Ativos

Bloqueados

Aguardando pagamento

2.2 Gerenciamento de Usuários das Adegas

Criar usuários e vincular a uma adega.

Editar dados dos usuários.

Redefinir senha manualmente.

Bloquear / desbloquear acesso.

Remover usuário.

2.3 Controle Financeiro Básico

Campo onde o administrador marca se a adega realizou o pagamento mensal.

Se o pagamento estiver “não realizado”, o sistema deve bloquear automaticamente os usuários daquela adega no login.

📦 3. Tela de Cadastro de Produtos (para a adega)

Crie uma tela clara e fácil de usar com os seguintes campos:

Nome do produto

Categoria (vinho, cerveja, bebida quente, energética, gelo, etc.)

Preço de venda

Custo (opcional)

Quantidade inicial no estoque

Código de barras (opcional)

Foto do produto (opcional)

Regras importantes:

Sempre que um produto for cadastrado, a quantidade deve ser somada ao estoque atual.

O sistema deve mostrar automaticamente os produtos com estoque baixo (ex: menos de 5 unidades).

🛒 4. Página de Vendas

A página deve ser extremamente rápida e prática para o atendente da adega.

Requisitos:

Exibir todos os produtos cadastrados com:

nome

foto

preço

quantidade disponível

Campo de busca para localizar rapidamente o produto.

Ao clicar em um produto:

abrir modal para escolha da quantidade

descontar automaticamente do estoque

Botão para fechar venda.

Após concluir a venda:

Gerar registro completo contendo:

Nome do produto

Quantidade vendida

Valor total

Data e hora

Usuário que efetuou a venda

Adega responsável

📊 5. Tela de Relatórios

Criar uma interface com filtros e exportações.

Filtros de período:

Hoje

Últimos 7 dias

Mês atual

Período personalizado

Relatórios disponíveis:

Todas as vendas detalhadas

Total vendido por dia, semana e mês

Produtos mais vendidos

Produtos com estoque baixo

Estoque atual geral

Exportações:

PDF

CSV

Excel

⚙️ 6. Regras Gerais do Sistema

Cada adega só enxerga seus próprios produtos, estoque e vendas.

O administrador geral enxerga tudo.

Deve existir registro de auditoria das ações importantes (ex: cadastro, venda, edição, login, bloqueio).

Interface moderna, responsiva e com boa performance.

Backend estruturado usando melhores práticas (CRUD completo).

Banco de dados organizado em tabelas:

usuários

adegas

produtos

vendas

itens da venda

logs

🎨 7. Design desejado

Limpo e profissional

Baseado em componentes modernos

Uso de cores como azul, branco e cinza

Ícones minimalistas

Dashboard com gráficos simples (linha, barra, cards)

🎯 Objetivo Final

Construir uma plataforma completa e pronta para uso real por adegas, permitindo:

controle de estoque

vendas rápidas

relatórios completos

administração de clientes e usuários

bloqueio automático por falta de pagamento

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vinho-control.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/e86f9732-f514-461b-ab06-f5ac92a3df35).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
