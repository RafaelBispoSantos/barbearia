const express = require('express');
const assinaturaController = require('../controllers/assinaturaController');
const { 
  authMiddleware, 
  restrictTo, 
  estabelecimentoCheck, 
  proprietarioCheck 
} = require('../middleware/authMiddleware');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);

// Obter informações da assinatura atual
router.get(
  '/:estabelecimentoId',
  estabelecimentoCheck,
  proprietarioCheck,
  assinaturaController.getAssinaturaInfo
);

// Atualizar plano (upgrade/downgrade)
router.post(
  '/:estabelecimentoId/atualizar-plano',
  estabelecimentoCheck,
  proprietarioCheck,
  assinaturaController.atualizarPlano
);

// Adicionar/atualizar método de pagamento
router.post(
  '/:estabelecimentoId/metodo-pagamento',
  estabelecimentoCheck,
  proprietarioCheck,
  assinaturaController.atualizarMetodoPagamento
);

// Histórico de faturas
router.get(
  '/:estabelecimentoId/faturas',
  estabelecimentoCheck,
  proprietarioCheck,
  assinaturaController.listarFaturas
);

// Cancelar assinatura
router.post(
  '/:estabelecimentoId/cancelar',
  estabelecimentoCheck,
  proprietarioCheck,
  assinaturaController.cancelarAssinatura
);

// Reativar assinatura
router.post(
  '/:estabelecimentoId/reativar',
  estabelecimentoCheck,
  proprietarioCheck,
  assinaturaController.reativarAssinatura
);

module.exports = router;