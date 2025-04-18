const express = require('express');
const authRoutes = require('./authRoutes');
const usuarioRoutes = require('./usuarioRoutes');
const estabelecimentoRoutes = require('./estabelecimentoRoutes');
const servicoRoutes = require('./servicoRoutes');
const agendamentoRoutes = require('./agendamentoRoutes');
const assinaturaRoutes = require('./assinaturaRoutes');
const adminRoutes = require('./adminRoutes');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Rotas públicas
router.use('/auth', authRoutes);

// Rotas protegidas (requerem autenticação)
router.use('/usuarios', authMiddleware, usuarioRoutes);
router.use('/estabelecimentos', estabelecimentoRoutes);
router.use('/servicos', authMiddleware, servicoRoutes);
router.use('/agendamentos', authMiddleware, agendamentoRoutes);
router.use('/assinaturas', authMiddleware, assinaturaRoutes);
router.use('/admin', authMiddleware, adminRoutes);

// Rota para verificar o estado da API
router.get('/status', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API do SaaS para Barbearias funcionando corretamente',
    timestamp: new Date()
  });
});

module.exports = router;