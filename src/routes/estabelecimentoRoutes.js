const express = require('express');
const estabelecimentoController = require('../controllers/estabelecimentoController');
const { authMiddleware, restrictTo, proprietarioCheck, estabelecimentoCheck } = require('../middleware/authMiddleware');

const router = express.Router();

// Rota pública para obter detalhes do estabelecimento pela URL
router.get('/por-url/:url', estabelecimentoController.getEstabelecimento);

// Rotas protegidas
router.use(authMiddleware);

// Obter estabelecimento pelo ID
router.get('/:id', estabelecimentoController.getEstabelecimento);

// Rotas que requerem ser proprietário do estabelecimento ou admin
router.use('/:id', estabelecimentoCheck, proprietarioCheck);

// Estatísticas do estabelecimento
router.get('/:id/stats', estabelecimentoController.getEstabelecimentoStats);

// Atualizar estabelecimento
router.patch('/:id', estabelecimentoController.atualizarEstabelecimento);

// Atualizar URL personalizada
router.patch('/:id/url', estabelecimentoController.atualizarUrlPersonalizada);

// Atualizar marca/identidade visual
router.patch('/:id/marca', estabelecimentoController.atualizarMarca);

// Atualizar conteúdo
router.patch('/:id/conteudo', estabelecimentoController.atualizarConteudo);

// Gerenciar banners
router.post('/:id/banners', estabelecimentoController.adicionarBanner);
router.delete('/:id/banners/:bannerId', estabelecimentoController.removerBanner);

// Apenas administradores podem atualizar status de assinatura
router.patch(
  '/:id/assinatura',
  restrictTo('admin'),
  estabelecimentoController.atualizarStatusAssinatura
);

module.exports = router;