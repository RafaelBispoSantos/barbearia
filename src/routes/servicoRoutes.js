const express = require('express');
const servicoController = require('../controllers/servicoController');
const { 
  authMiddleware, 
  estabelecimentoCheck, 
  proprietarioCheck 
} = require('../middleware/authMiddleware');

const router = express.Router();

// Rotas públicas
router.get('/', servicoController.listarServicos);
router.get('/:id', servicoController.obterServico);

// Rotas protegidas
router.use(authMiddleware);

// Rotas que exigem permissão de proprietário
router.post(
  '/',
  estabelecimentoCheck,
  proprietarioCheck,
  servicoController.criarServico
);

router.patch(
  '/:id',
  estabelecimentoCheck,
  proprietarioCheck,
  servicoController.atualizarServico
);

router.delete(
  '/:id',
  estabelecimentoCheck,
  proprietarioCheck,
  servicoController.excluirServico
);

// Gerenciamento de promoções
router.post(
  '/:id/promocao',
  estabelecimentoCheck,
  proprietarioCheck,
  servicoController.criarPromocao
);

router.delete(
  '/:id/promocao',
  estabelecimentoCheck,
  proprietarioCheck,
  servicoController.encerrarPromocao
);

module.exports = router;