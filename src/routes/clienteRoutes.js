const express = require('express');
const clienteController = require('../controllers/clienteController');

const router = express.Router();

router.post('/', clienteController.criarCliente);
router.get('/', clienteController.listarClientes);
router.get('/:id', clienteController.obterCliente);
router.patch('/:id', clienteController.atualizarCliente);

module.exports = router;
