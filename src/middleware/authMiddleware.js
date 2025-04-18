const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const Estabelecimento = require('../models/Estabelecimento');

exports.authMiddleware = async (req, res, next) => {
  try {
    // Verificar se o token está presente
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Você não está autenticado. Por favor, faça login.'
      });
    }
    
    // Verificar se o token é válido
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Verificar se o usuário ainda existe
    const usuarioAtual = await Usuario.findById(decoded.id).select('-password');
    
    if (!usuarioAtual) {
      return res.status(401).json({
        status: 'error',
        message: 'O usuário desta sessão não existe mais.'
      });
    }
    
    // Verificar se o usuário está ativo
    if (!usuarioAtual.ativo) {
      return res.status(401).json({
        status: 'error',
        message: 'Este usuário está desativado.'
      });
    }
    
    // Se for um usuário do tipo barbeiro ou proprietário, verificar se o estabelecimento está ativo
    if (usuarioAtual.tipo === 'barbeiro' || usuarioAtual.tipo === 'proprietario') {
      const estabelecimento = await Estabelecimento.findById(usuarioAtual.estabelecimento);
      
      if (!estabelecimento || !estabelecimento.ativo) {
        return res.status(403).json({
          status: 'error',
          message: 'O estabelecimento está desativado.'
        });
      }
      
      // Verificar se a assinatura do estabelecimento está ativa (exceto para admins)
      if (usuarioAtual.tipo !== 'admin') {
        if (!['ativo', 'trial'].includes(estabelecimento.assinatura.status)) {
          return res.status(403).json({
            status: 'error',
            message: 'A assinatura do estabelecimento está inativa ou pendente. Entre em contato com o suporte.'
          });
        }
        
        // Verificar se o período de trial expirou
        if (estabelecimento.assinatura.status === 'trial') {
          const hoje = new Date();
          const dataRenovacao = new Date(estabelecimento.assinatura.dataRenovacao);
          
          if (hoje > dataRenovacao) {
            // Atualizar o status da assinatura para pendente
            await Estabelecimento.findByIdAndUpdate(
              estabelecimento._id,
              { 'assinatura.status': 'pendente' }
            );
            
            return res.status(403).json({
              status: 'error',
              message: 'O período de trial expirou. Atualize o plano para continuar usando o sistema.'
            });
          }
        }
      }
    }
    
    // Adicionar o usuário ao objeto req
    req.user = {
      id: usuarioAtual._id,
      nome: usuarioAtual.nome,
      email: usuarioAtual.email,
      tipo: usuarioAtual.tipo,
      estabelecimento: usuarioAtual.estabelecimento
    };
    
    // Continuar
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        status: 'error',
        message: 'Sessão inválida. Por favor, faça login novamente.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        status: 'error',
        message: 'Sua sessão expirou. Por favor, faça login novamente.'
      });
    }
    
    res.status(500).json({
      status: 'error',
      message: 'Erro ao autenticar: ' + error.message
    });
  }
};

exports.restrictTo = (...tipos) => {
  return (req, res, next) => {
    if (!tipos.includes(req.user.tipo)) {
      return res.status(403).json({
        status: 'error',
        message: 'Você não tem permissão para executar esta ação'
      });
    }
    
    next();
  };
};

exports.estabelecimentoCheck = async (req, res, next) => {
  try {
    // Verificar se o ID ou URL do estabelecimento foi fornecido
    let estabelecimentoId = req.query.estabelecimentoId || req.body.estabelecimentoId;
    const estabelecimentoUrl = req.query.estabelecimentoUrl || req.body.estabelecimentoUrl;
    
    if (!estabelecimentoId && !estabelecimentoUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'ID ou URL do estabelecimento é obrigatório'
      });
    }
    
    // Se forneceu URL mas não ID, buscar o ID
    if (!estabelecimentoId && estabelecimentoUrl) {
      const estabelecimento = await Estabelecimento.findOne({ urlPersonalizada: estabelecimentoUrl });
      
      if (!estabelecimento) {
        return res.status(404).json({
          status: 'error',
          message: 'Estabelecimento não encontrado'
        });
      }
      
      estabelecimentoId = estabelecimento._id;
      
      // Adicionar o ID ao req para uso posterior
      req.query.estabelecimentoId = estabelecimentoId;
      req.body.estabelecimentoId = estabelecimentoId;
    }
    
    // Verificar se o estabelecimento existe e está ativo
    const estabelecimento = await Estabelecimento.findById(estabelecimentoId);
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    if (!estabelecimento.ativo) {
      return res.status(403).json({
        status: 'error',
        message: 'Este estabelecimento está desativado'
      });
    }
    
    // Verificar assinatura (exceto para admins)
    if (req.user.tipo !== 'admin') {
      if (!['ativo', 'trial'].includes(estabelecimento.assinatura.status)) {
        return res.status(403).json({
          status: 'error',
          message: 'A assinatura deste estabelecimento está inativa ou pendente'
        });
      }
    }
    
    // Adicionar o estabelecimento ao req para uso posterior
    req.estabelecimento = estabelecimento;
    
    next();
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.proprietarioCheck = (req, res, next) => {
  // Verificar se o usuário é proprietário do estabelecimento
  if (req.user.tipo !== 'admin' && 
      req.user.tipo !== 'proprietario') {
    return res.status(403).json({
      status: 'error',
      message: 'Apenas proprietários podem executar esta ação'
    });
  }
  
  // Se for proprietário, verificar se o estabelecimento é dele
  if (req.user.tipo === 'proprietario' && 
      (!req.estabelecimento || 
       req.user.estabelecimento.toString() !== req.estabelecimento._id.toString())) {
    return res.status(403).json({
      status: 'error',
      message: 'Você não tem permissão para gerenciar este estabelecimento'
    });
  }
  
  next();
};