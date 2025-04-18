const express = require('express');
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Rotas públicas de autenticação
router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/register-estabelecimento', authController.registerEstabelecimento);

// Verificação de token (rota protegida)
router.get('/verify-token', authMiddleware, (req, res) => {
  res.status(200).json({
    status: 'success',
    user: {
      id: req.user.id,
      nome: req.user.nome,
      email: req.user.email,
      tipo: req.user.tipo,
      estabelecimento: req.user.estabelecimento
    }
  });
});

module.exports = router;