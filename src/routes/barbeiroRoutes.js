const express = require('express');
const barbeiroController = require('../controllers/barbeiroController');
const { authMiddleware, estabelecimentoCheck, proprietarioCheck } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware);
router.use(estabelecimentoCheck);

// Rotas públicas
router.get('/', barbeiroController.listarBarbeiros); // Sem middlewares para esta rota específica

// Rotas protegidas
router.post('/', barbeiroController.criarBarbeiro);
router.get('/horarios-disponiveis', barbeiroController.obterHorariosDisponiveis);
router.get('/:id', barbeiroController.obterBarbeiro);
router.patch('/:id', barbeiroController.atualizarBarbeiro);
router.delete('/:id', barbeiroController.deletarBarbeiro);

module.exports = router;