const express = require('express');
const agendamentoController = require('../controllers/agendamentoController');
const { authMiddleware, estabelecimentoCheck } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Criar agendamento
router.post(
  '/',
  estabelecimentoCheck,
  agendamentoController.criarAgendamento
);

// Listar agendamentos (com filtro por estabelecimento, barbeiro, cliente, data)
router.get(
  '/',
  estabelecimentoCheck,
  agendamentoController.listarAgendamentos
);

// Obter agendamento específico
router.get(
  '/:id',
  agendamentoController.obterAgendamento
);

// Atualizar status do agendamento (confirmar, cancelar, concluir)
router.patch(
  '/:id/status',
  agendamentoController.atualizarStatusAgendamento
);

// Adicionar avaliação a um agendamento
router.patch(
  '/:id/avaliacao',
  agendamentoController.adicionarAvaliacao
);

module.exports = router;