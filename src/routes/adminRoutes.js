const express = require('express');
const adminController = require('../controllers/adminController');
const { authMiddleware, restrictTo } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas as rotas abaixo exigem autenticação e permissão de administrador
router.use(authMiddleware);
router.use(restrictTo('admin'));

// Estatísticas gerais da plataforma
router.get('/stats', adminController.getStats);

// Gerenciamento de estabelecimentos
router.get('/estabelecimentos', adminController.listarEstabelecimentos);
router.get('/estabelecimentos/:id', adminController.obterEstabelecimento);
router.patch('/estabelecimentos/:id/status', adminController.atualizarStatusEstabelecimento);
router.patch('/estabelecimentos/:id/assinatura', adminController.atualizarAssinaturaEstabelecimento);

// Gerenciamento de usuários
router.get('/usuarios', adminController.listarUsuarios);
router.patch('/usuarios/:id/status', adminController.atualizarStatusUsuario);

// Relatórios financeiros
router.get('/financeiro/faturamento', adminController.relatorioFaturamento);
router.get('/financeiro/assinaturas', adminController.relatorioAssinaturas);

module.exports = router;