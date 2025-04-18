const Usuario = require('../models/Usuario');
const Agendamento = require('../models/Agendamento');
const bcrypt = require('bcrypt');

exports.listarUsuariosPorTipo = async (req, res) => {
  try {
    const { tipo, estabelecimentoId } = req.query;
    
    if (!estabelecimentoId) {
      return res.status(400).json({
        status: 'error',
        message: 'ID do estabelecimento é obrigatório'
      });
    }
    
    // Verificar permissões
    if (req.user.tipo !== 'admin' && req.user.tipo !== 'proprietario') {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para listar usuários'
      });
    }
    
    // Proprietários só podem ver usuários do próprio estabelecimento
    if (req.user.tipo === 'proprietario' && 
        req.user.estabelecimento.toString() !== estabelecimentoId) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para listar usuários deste estabelecimento'
      });
    }
    
    const filtro = { 
      estabelecimento: estabelecimentoId,
      ativo: true
    };
    
    if (tipo) filtro.tipo = tipo;
    
    const usuarios = await Usuario.find(filtro)
      .select('-password')
      .sort({ nome: 1 });
    
    res.status(200).json({
      status: 'success',
      results: usuarios.length,
      data: usuarios
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.obterUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    const usuario = await Usuario.findById(id).select('-password');
    
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.id !== id && req.user.tipo !== 'admin') {
      // Proprietários podem ver apenas usuários do próprio estabelecimento
      if (req.user.tipo === 'proprietario' && 
          (usuario.estabelecimento === null || 
           usuario.estabelecimento.toString() !== req.user.estabelecimento.toString())) {
        return res.status(403).json({
          status: 'error',
          message: 'Sem permissão para acessar este usuário'
        });
      }
      
      // Outros tipos não podem acessar
      if (req.user.tipo !== 'proprietario') {
        return res.status(403).json({
          status: 'error',
          message: 'Sem permissão para acessar este usuário'
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.criarBarbeiro = async (req, res) => {
  try {
    const { estabelecimentoId, nome, email, telefone, especialidades, horarioTrabalho, password } = req.body;
    
    // Verificar permissões (apenas proprietários e admins podem criar barbeiros)
    if (req.user.tipo !== 'admin' && req.user.tipo !== 'proprietario') {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para criar barbeiros'
      });
    }
    
    // Proprietários só podem criar barbeiros para o próprio estabelecimento
    if (req.user.tipo === 'proprietario' && 
        req.user.estabelecimento.toString() !== estabelecimentoId) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para criar barbeiros neste estabelecimento'
      });
    }
    
    // Verificar se o email já está em uso
    const emailExistente = await Usuario.findOne({ email });
    if (emailExistente) {
      return res.status(400).json({
        status: 'error',
        message: 'Este email já está em uso'
      });
    }
    
    // Hash da senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Criar o barbeiro
    const novoBarbeiro = new Usuario({
      nome,
      email,
      password: hashedPassword,
      telefone,
      tipo: 'barbeiro',
      estabelecimento: estabelecimentoId,
      especialidades,
      horarioTrabalho
    });
    
    const barbeiro = await novoBarbeiro.save();
    
    // Remover a senha da resposta
    const barbeiroSemSenha = { ...barbeiro.toObject() };
    delete barbeiroSemSenha.password;
    
    res.status(201).json({
      status: 'success',
      data: barbeiroSemSenha
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Obter o usuário para verificações
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.id !== id && req.user.tipo !== 'admin') {
      // Proprietários podem editar apenas usuários do próprio estabelecimento
      if (req.user.tipo === 'proprietario' && 
          (usuario.estabelecimento === null || 
           usuario.estabelecimento.toString() !== req.user.estabelecimento.toString())) {
        return res.status(403).json({
          status: 'error',
          message: 'Sem permissão para editar este usuário'
        });
      }
      
      // Outros tipos não podem editar
      if (req.user.tipo !== 'proprietario') {
        return res.status(403).json({
          status: 'error',
          message: 'Sem permissão para editar este usuário'
        });
      }
    }
    
    // Campos que não podem ser atualizados
    const camposProtegidos = ['tipo', 'estabelecimento', 'password'];
    
    // Remover campos protegidos da atualização
    const dadosAtualizacao = { ...req.body };
    camposProtegidos.forEach(campo => delete dadosAtualizacao[campo]);
    
    // Atualizar o usuário
    const usuarioAtualizado = await Usuario.findByIdAndUpdate(
      id,
      dadosAtualizacao,
      { new: true, runValidators: true }
    ).select('-password');
    
    res.status(200).json({
      status: 'success',
      data: usuarioAtualizado
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.alterarSenha = async (req, res) => {
  try {
    const { id } = req.params;
    const { senhaAtual, novaSenha } = req.body;
    
    // Apenas o próprio usuário ou admin podem alterar senhas
    if (req.user.id !== id && req.user.tipo !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para alterar a senha deste usuário'
      });
    }
    
    // Buscar o usuário
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Se não for admin, verificar a senha atual
    if (req.user.tipo !== 'admin') {
      const senhaCorreta = await usuario.verificarSenha(senhaAtual);
      
      if (!senhaCorreta) {
        return res.status(401).json({
          status: 'error',
          message: 'Senha atual incorreta'
        });
      }
    }
    
    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(novaSenha, salt);
    
    // Atualizar a senha
    usuario.password = hashedPassword;
    await usuario.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Senha alterada com sucesso'
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.desativarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o usuário para verificações
    const usuario = await Usuario.findById(id);
    
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.tipo !== 'admin' && req.user.tipo !== 'proprietario') {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para desativar usuários'
      });
    }
    
    // Proprietários só podem desativar usuários do próprio estabelecimento
    if (req.user.tipo === 'proprietario' && 
        (usuario.estabelecimento === null || 
         usuario.estabelecimento.toString() !== req.user.estabelecimento.toString())) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para desativar este usuário'
      });
    }
    
    // Se for um barbeiro, verificar se tem agendamentos futuros
    if (usuario.tipo === 'barbeiro') {
      const dataAtual = new Date();
      const agendamentosFuturos = await Agendamento.find({
        barbeiro: id,
        data: { $gt: dataAtual },
        status: { $in: ['agendado', 'confirmado'] }
      });
      
      if (agendamentosFuturos.length > 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Não é possível desativar o barbeiro pois existem agendamentos futuros',
          agendamentos: agendamentosFuturos.length
        });
      }
    }
    
    // Desativar o usuário
    await Usuario.findByIdAndUpdate(id, { ativo: false });
    
    res.status(200).json({
      status: 'success',
      message: 'Usuário desativado com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};