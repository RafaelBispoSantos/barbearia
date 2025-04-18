# 💈 BarberApp SaaS

<div align="center">
  <img src="https://res.cloudinary.com/dmhyzqdp9/image/upload/v1744490361/Gemini_Generated_Image_ezsmgrezsmgrezsm_vxtpif.jpg" alt="Logo BarberApp SaaS" width="240px" height="240px" />
  
  <p align="center">
    <strong>Plataforma SaaS de gerenciamento multi-tenant para barbearias</strong>
  </p>
  
  <p align="center">
    <a href="#visão-geral">Visão Geral</a>
    ·
    <a href="#funcionalidades">Funcionalidades</a>
    ·
    <a href="#instalação">Instalação</a>
    ·
    <a href="#endpoints">Endpoints</a>
    ·
    <a href="#tecnologias">Tecnologias</a>
    ·
    <a href="#estrutura-do-projeto">Estrutura</a>
    ·
    <a href="#planos-e-assinaturas">Planos</a>
  </p>
</div>

## 🌟 Visão Geral

BarberApp SaaS é uma plataforma completa desenvolvida com Node.js e Express para gerenciar múltiplas barbearias em um modelo de Software as a Service. Cada barbearia cliente recebe seu próprio subdomínio personalizado, interface customizada e acesso aos recursos com base em seu plano de assinatura.

## ✨ Funcionalidades

- 🏢 **Arquitetura Multi-tenant**
  - Isolamento de dados por estabelecimento
  - URLs personalizadas (subdomínios)
  - Marca e identidade visual exclusivas
  - Controle de recursos por plano de assinatura

- 💰 **Sistema de Assinaturas**
  - Planos diferenciados (Básico, Profissional, Premium)
  - Pagamentos recorrentes mensais
  - Período de trial gratuito
  - Dashboard administrativo para gestão de assinaturas

- 🎨 **Personalização Completa**
  - Subdomínios personalizados (suabarbearia.barberapp.com)
  - Cores, logos e fontes configuráveis
  - Conteúdo e banners personalizáveis
  - Templates de interface adaptáveis

- 🔐 **Autenticação e Autorização**
  - Registro e login de usuários
  - Autenticação via JWT
  - Sistema de perfis (admin, proprietário, barbeiro, cliente)
  - Verificação de permissões por estabelecimento

- 👨‍💼 **Gerenciamento de Barbeiros**
  - Cadastro de barbeiros com especialidades
  - Controle de horários de trabalho 
  - Disponibilidade por dia da semana

- 💇‍♂️ **Catálogo de Serviços**
  - Gerenciamento de serviços com preços e durações
  - Categorização de serviços
  - Sistema de promoções temporárias
  - Ativação/desativação de serviços

- 📅 **Sistema de Agendamentos**
  - Verificação inteligente de horários disponíveis
  - Cálculo automático de duração e preço total
  - Status de agendamento (agendado, confirmado, cancelado, concluído)
  - Sistema de avaliação pós-atendimento
  - Notificações automáticas

- 👥 **Gerenciamento de Clientes**
  - Perfis de clientes
  - Histórico de agendamentos
  - Atualizações de dados
  - Preferências de comunicação

- 📊 **Dashboard e Relatórios**
  - Estatísticas de agendamentos
  - Análise de faturamento
  - Métricas de desempenho
  - Relatórios por período

- 📱 **Armazenamento e CDN**
  - Upload e gerenciamento de imagens no AWS S3
  - Entrega otimizada de conteúdo via CDN
  - SSL em todos os subdomínios

## 🚀 Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seunome/barberapp-saas.git
   cd barberapp-saas
   ```

2. Instale as dependências:
   ```bash
   npm install
   ```

3. Crie um arquivo `.env` no diretório raiz e configure (veja o arquivo `.env.example`):
   ```
   MONGODB_URI=sua_uri_do_mongodb
   JWT_SECRET=seu_segredo_jwt
   PORT=3001
   
   # AWS S3 e CloudFront
   AWS_ACCESS_KEY_ID=sua_access_key
   AWS_SECRET_ACCESS_KEY=sua_secret_key
   AWS_DEFAULT_REGION=us-east-1
   AWS_BUCKET_NAME=seu-bucket-s3
   CDN_URL=https://seu-dominio-cloudfront.net
   
   # Configurações SaaS
   APP_DOMAIN=barberapp.com
   ADMIN_DOMAIN=admin.barberapp.com
   ```

4. Inicie o servidor:
   ```bash
   # Modo desenvolvimento
   npm run dev
   
   # Modo produção
   npm start
   ```

5. Alternativamente, use Docker:
   ```bash
   docker-compose up -d
   ```

## 🌐 Endpoints

### 🔑 Autenticação

```
POST /api/auth/login                 - Login de usuário
POST /api/auth/register              - Cadastro de usuário
POST /api/auth/register-estabelecimento - Registro de nova barbearia
GET  /api/auth/verify-token          - Verifica token JWT
```

### 🏢 Estabelecimentos

```
GET    /api/estabelecimentos/por-url/:url - Obter estabelecimento por URL
GET    /api/estabelecimentos/:id          - Obter estabelecimento por ID
PATCH  /api/estabelecimentos/:id          - Atualizar estabelecimento
PATCH  /api/estabelecimentos/:id/url      - Atualizar URL personalizada
PATCH  /api/estabelecimentos/:id/marca    - Atualizar marca e identidade visual
PATCH  /api/estabelecimentos/:id/conteudo - Atualizar conteúdo
GET    /api/estabelecimentos/:id/stats    - Estatísticas do estabelecimento
```

### 💰 Assinaturas

```
GET    /api/assinaturas/:estabelecimentoId      - Info da assinatura atual
POST   /api/assinaturas/:estabelecimentoId/atualizar-plano - Mudar plano
POST   /api/assinaturas/:estabelecimentoId/metodo-pagamento - Atualizar método de pagamento
GET    /api/assinaturas/:estabelecimentoId/faturas - Listar faturas
POST   /api/assinaturas/:estabelecimentoId/cancelar - Cancelar assinatura
POST   /api/assinaturas/:estabelecimentoId/reativar - Reativar assinatura
```

### 👤 Usuários

```
GET    /api/usuarios/perfil           - Obter próprio perfil
PATCH  /api/usuarios/perfil           - Atualizar próprio perfil  
PATCH  /api/usuarios/alterar-senha    - Alterar própria senha
GET    /api/usuarios/por-estabelecimento - Listar usuários por tipo
POST   /api/usuarios/barbeiros        - Criar novo barbeiro
GET    /api/usuarios/:id              - Obter usuário específico
PATCH  /api/usuarios/:id              - Atualizar usuário
PATCH  /api/usuarios/:id/desativar    - Desativar usuário
```

### 👨‍💼 Barbeiros

```
GET    /api/barbeiros               - Lista todos os barbeiros
POST   /api/barbeiros               - Cria novo barbeiro
GET    /api/barbeiros/:id           - Obtém barbeiro específico
PATCH  /api/barbeiros/:id           - Atualiza barbeiro
DELETE /api/barbeiros/:id           - Remove barbeiro (desativa)
GET    /api/barbeiros/horarios-disponiveis - Verifica disponibilidade
```

### 💇‍♂️ Serviços

```
GET    /api/servicos                - Lista todos os serviços
POST   /api/servicos                - Cria novo serviço
GET    /api/servicos/:id            - Obtém serviço específico
PATCH  /api/servicos/:id            - Atualiza serviço
DELETE /api/servicos/:id            - Remove serviço
POST   /api/servicos/:id/promocao   - Cria promoção
DELETE /api/servicos/:id/promocao   - Encerra promoção
```

### 📅 Agendamentos

```
GET    /api/agendamentos            - Lista agendamentos (com filtros)
POST   /api/agendamentos            - Cria novo agendamento
GET    /api/agendamentos/:id        - Obtém agendamento específico
PATCH  /api/agendamentos/:id/status - Atualiza status do agendamento
PATCH  /api/agendamentos/:id/avaliacao - Adiciona avaliação
```

### 👨‍💻 Admin

```
GET    /api/admin/stats              - Estatísticas gerais da plataforma
GET    /api/admin/estabelecimentos   - Lista todos os estabelecimentos
GET    /api/admin/estabelecimentos/:id - Obtém estabelecimento específico
PATCH  /api/admin/estabelecimentos/:id/status - Ativa/desativa estabelecimento
PATCH  /api/admin/estabelecimentos/:id/assinatura - Atualiza assinatura
GET    /api/admin/usuarios           - Lista todos os usuários
PATCH  /api/admin/usuarios/:id/status - Ativa/desativa usuário
GET    /api/admin/financeiro/faturamento - Relatório de faturamento
GET    /api/admin/financeiro/assinaturas - Relatório de assinaturas
```

## 🛠️ Tecnologias

- **Backend**: Node.js, Express.js
- **Banco de Dados**: MongoDB, Mongoose
- **Autenticação**: JWT (jsonwebtoken), bcrypt
- **Armazenamento**: AWS S3, CloudFront CDN
- **Infraestrutura**: Docker, NGINX
- **SSL**: Let's Encrypt (certificados wildcard)
- **Desenvolvimento**: Nodemon, Jest, Supertest

## 🔍 Estrutura do Projeto

```
src/
├── controllers/    # Controladores para cada recurso
├── models/         # Modelos Mongoose
├── routes/         # Definição de rotas
├── middleware/     # Middlewares para autenticação e outros
├── config/         # Configurações (S3, email, etc.)
├── services/       # Serviços compartilhados
├── app.js          # Configuração principal do Express
└── ...

docker/             # Configurações Docker
nginx/              # Configurações NGINX
```

## 📦 Modelos de Dados

### Estabelecimento
- Nome, URL personalizada, endereço, contato
- Proprietário, horário de funcionamento
- Marca (logo, cores, fontes)
- Conteúdo personalizado e banners
- Assinatura (plano, status, datas, pagamento)
- Configurações (intervalos, políticas)

### Usuario (unificado)
- Dados básicos (nome, email, senha, telefone)
- Tipo (admin, proprietário, barbeiro, cliente)
- Referência ao estabelecimento
- Dados específicos por tipo de usuário
- Preferências e notificações

### Serviço
- Estabelecimento (referência)
- Nome, descrição, categoria
- Preço, duração
- Promoções temporárias
- Status ativo/inativo

### Agendamento
- Estabelecimento, cliente, barbeiro
- Lista de serviços
- Data e horário
- Duração e preço total
- Status e notificações
- Avaliação (nota, comentário)

## 📱 Planos e Assinaturas

### Plano Básico
- Até 3 barbeiros
- Agendamento online
- Dashboard básico
- Personalização limitada
- R$ 99,90/mês

### Plano Profissional
- Até 7 barbeiros
- Agendamento online
- Dashboard completo
- Personalização avançada
- Marketing por SMS e Email
- R$ 199,90/mês

### Plano Premium
- Barbeiros ilimitados
- Agendamento online e app personalizado
- Dashboard gerencial completo
- Personalização total
- Marketing multicanal
- Múltiplas unidades
- R$ 299,90/mês

## 🔒 Segurança e Multi-tenant

A plataforma implementa:

1. **Isolamento de dados**: Cada estabelecimento tem acesso apenas aos seus próprios dados
2. **Autenticação JWT**: Tokens com informações de usuário e estabelecimento
3. **Middlewares específicos**: Verificação de permissões por estabelecimento
4. **SSL para todos os subdomínios**: Certificados wildcard Let's Encrypt
5. **Proteção de recursos**: Limitação baseada em plano de assinatura

## 🧪 Testes

Execute os testes automatizados:

```bash
npm test
```

## 📝 Licença

Distribuído sob a Licença MIT. Veja `LICENSE` para mais informações.

## 📞 Contato

RafaelBispoDev@outlook.com

Link do Projeto: [https://github.com/seunomeusuario/barberapp-saas](https://github.com/seunomeusuario/barberapp-saas)

---

<div align="center">
  <p>Desenvolvido com ❤️ por Rafael Bispo</p>
</div>
