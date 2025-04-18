const express = require('express');
const usuarioController = require('../controllers/usuarioController');
const { 
  authMiddleware, 
  restrictTo, 
  estabelecimentoCheck, 
  proprietarioCheck 
} = require('../middleware/authMiddleware');

const router = express.Router();

// Obter perfil do próprio usuário
router.get('/perfil', usuarioController.obterUsuario);

// Atualizar próprio perfil
router.patch('/perfil', usuarioController.atualizarUsuario);

// Alterar própria senha
router.patch('/alterar-senha', usuarioController.alterarSenha);

// Listar usuários por tipo (barbeiros, clientes) - requer permissão de proprietário
router.get(
  '/por-estabelecimento',
  estabelecimentoCheck,
  proprietarioCheck,
  usuarioController.listarUsuariosPorTipo
);

// Criar novo barbeiro - apenas proprietários e admins
router.post(
  '/barbeiros',
  estabelecimentoCheck,
  proprietarioCheck,
  usuarioController.criarBarbeiro
);

// Obter detalhes de um usuário específico
router.get(
  '/:id',
  usuarioController.obterUsuario
);

// Atualizar usuário específico
router.patch(
  '/:id',
  usuarioController.atualizarUsuario
);

// Desativar usuário
router.patch(
  '/:id/desativar',
  estabelecimentoCheck,
  proprietarioCheck,
  usuarioController.desativarUsuario
);

module.exports = router;