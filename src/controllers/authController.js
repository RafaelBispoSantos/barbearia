const Usuario = require('../models/Usuario');
const Estabelecimento = require('../models/Estabelecimento');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
  try {
    const { email, password, estabelecimentoUrl } = req.body;
    
    // Buscar usuário pelo email
    const usuario = await Usuario.findOne({ email });
    
    if (!usuario) {
      return res.status(401).json({
        status: 'error',
        message: 'Email ou senha incorretos'
      });
    }
    
    // Verificar a senha
    const senhaCorreta = await usuario.verificarSenha(password);
    
    if (!senhaCorreta) {
      return res.status(401).json({
        status: 'error',
        message: 'Email ou senha incorretos'
      });
    }

    // Se tem url de estabelecimento, verificar se o usuário pertence a esse estabelecimento
    let estabelecimento = null;
    if (estabelecimentoUrl) {
      estabelecimento = await Estabelecimento.findOne({ urlPersonalizada: estabelecimentoUrl });
      
      if (!estabelecimento) {
        return res.status(404).json({
          status: 'error',
          message: 'Estabelecimento não encontrado'
        });
      }
      
      // Verificar relação do usuário com o estabelecimento
      if (usuario.tipo !== 'cliente' && usuario.tipo !== 'admin') {
        // Barbeiros e proprietários só podem acessar seus próprios estabelecimentos
        if (!usuario.estabelecimento || usuario.estabelecimento.toString() !== estabelecimento._id.toString()) {
          return res.status(403).json({
            status: 'error',
            message: 'Você não tem permissão para acessar este estabelecimento'
          });
        }
      }
      
      // Verificar se o estabelecimento está ativo
      if (!estabelecimento.ativo) {
        return res.status(403).json({
          status: 'error',
          message: 'Este estabelecimento está temporariamente indisponível'
        });
      }
      
      // Verificar status da assinatura (exceto para admins)
      if (usuario.tipo !== 'admin' && !['ativo', 'trial'].includes(estabelecimento.assinatura.status)) {
        return res.status(403).json({
          status: 'error',
          message: 'A assinatura deste estabelecimento está inativa ou pendente'
        });
      }
    } else if (usuario.tipo !== 'admin' && usuario.tipo !== 'cliente') {
      // Se não forneceu URL do estabelecimento, usuários não-admin e não-cliente precisam ter um estabelecimento
      return res.status(400).json({
        status: 'error',
        message: 'URL do estabelecimento é obrigatória para este tipo de usuário'
      });
    }
    
    // Atualizar último login
    usuario.ultimoLogin = new Date();
    await usuario.save();
    
    // Gerar token JWT com informações adicionais do estabelecimento
    const token = jwt.sign(
      { 
        id: usuario._id,
        tipo: usuario.tipo,
        estabelecimento: usuario.estabelecimento,
        estabelecimentoUrl: estabelecimento ? estabelecimento.urlPersonalizada : null
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    // Remover a senha antes de enviar a resposta
    const usuarioSemSenha = { ...usuario.toObject() };
    delete usuarioSemSenha.password;
    
    res.status(200).json({
      status: 'success',
      token,
      user: usuarioSemSenha,
      estabelecimento: estabelecimento ? {
        id: estabelecimento._id,
        nome: estabelecimento.nome,
        urlPersonalizada: estabelecimento.urlPersonalizada,
        marca: estabelecimento.marca
      } : null
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, password, nome, telefone, tipo, estabelecimentoUrl } = req.body;
    
    // Verificar se este email já está em uso
    const existeEmail = await Usuario.findOne({ email });
    if (existeEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Este email já está em uso'
      });
    }
    
    // Se o tipo for proprietário, não permitir registro direto (deve usar registerEstabelecimento)
    if (tipo === 'proprietario') {
      return res.status(400).json({
        status: 'error',
        message: 'Para registrar um proprietário, utilize a rota de registro de estabelecimento'
      });
    }
    
    // Validações específicas por tipo
    if (tipo === 'barbeiro' && !estabelecimentoUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'URL do estabelecimento é obrigatória para barbeiros'
      });
    }
    
    // Se estiver criando um barbeiro ou cliente para um estabelecimento específico
    let estabelecimentoId = null;
    let estabelecimento = null;
    
    if (estabelecimentoUrl) {
      estabelecimento = await Estabelecimento.findOne({ urlPersonalizada: estabelecimentoUrl });
      
      if (!estabelecimento) {
        return res.status(404).json({
          status: 'error',
          message: 'Estabelecimento não encontrado'
        });
      }
      
      // Verificar se o estabelecimento está ativo
      if (!estabelecimento.ativo) {
        return res.status(403).json({
          status: 'error',
          message: 'Este estabelecimento está temporariamente indisponível'
        });
      }
      
      // Verificar status da assinatura para barbeiros
      if (tipo === 'barbeiro' && !['ativo', 'trial'].includes(estabelecimento.assinatura.status)) {
        return res.status(403).json({
          status: 'error',
          message: 'A assinatura deste estabelecimento está inativa ou pendente'
        });
      }
      
      // Verificar limites do plano para barbeiros
      if (tipo === 'barbeiro') {
        const barbeirosAtuais = await Usuario.countDocuments({
          estabelecimento: estabelecimento._id,
          tipo: 'barbeiro',
          ativo: true
        });
        
        let limiteExcedido = false;
        
        if (estabelecimento.assinatura.plano === 'basico' && barbeirosAtuais >= 3) {
          limiteExcedido = true;
        } else if (estabelecimento.assinatura.plano === 'profissional' && barbeirosAtuais >= 7) {
          limiteExcedido = true;
        }
        
        if (limiteExcedido) {
          return res.status(403).json({
            status: 'error',
            message: 'Limite de barbeiros do plano excedido. Faça upgrade para adicionar mais barbeiros.'
          });
        }
      }
      
      estabelecimentoId = estabelecimento._id;
    }
    
    // Hash da senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Criar novo usuário com senha hasheada
    const novoUsuario = new Usuario({
      nome,
      email,
      password: hashedPassword,
      telefone,
      tipo,
      estabelecimento: estabelecimentoId
    });
    
    const usuario = await novoUsuario.save();
    
    // Se for um cliente, adicionar ao contador de clientes do estabelecimento
    if (tipo === 'cliente' && estabelecimentoId) {
      // Poderia implementar um contador de clientes no estabelecimento
      // ou deixar isso para uma análise agregada posterior
    }
    
    // Remover a senha antes de enviar a resposta
    const usuarioSemSenha = { ...usuario.toObject() };
    delete usuarioSemSenha.password;
    
    // Gerar token JWT com informações adicionais do estabelecimento
    const token = jwt.sign(
      { 
        id: usuario._id,
        tipo: usuario.tipo,
        estabelecimento: usuario.estabelecimento,
        estabelecimentoUrl: estabelecimento ? estabelecimento.urlPersonalizada : null
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      status: 'success',
      token,
      user: usuarioSemSenha,
      estabelecimento: estabelecimento ? {
        id: estabelecimento._id,
        nome: estabelecimento.nome,
        urlPersonalizada: estabelecimento.urlPersonalizada,
        marca: estabelecimento.marca
      } : null
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.registerEstabelecimento = async (req, res) => {
  try {
    const { 
      nomeEstabelecimento, 
      urlPersonalizada,
      email,
      password,
      nome,
      telefone
    } = req.body;
    
    // Verificar se este email já está em uso
    const existeEmail = await Usuario.findOne({ email });
    if (existeEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Este email já está em uso'
      });
    }
    
    // Verificar se a URL já está em uso
    const existeUrl = await Estabelecimento.findOne({ urlPersonalizada });
    if (existeUrl) {
      return res.status(400).json({
        status: 'error',
        message: 'Esta URL personalizada já está em uso'
      });
    }
    
    // Validar formato da URL (apenas letras, números e hífens)
    const urlPattern = /^[a-z0-9-]+$/;
    if (!urlPattern.test(urlPersonalizada)) {
      return res.status(400).json({
        status: 'error',
        message: 'URL personalizada pode conter apenas letras minúsculas, números e hífens'
      });
    }
    
    // Hash da senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // 1. Criar o proprietário
    const novoProprietario = new Usuario({
      nome,
      email,
      password: hashedPassword,
      telefone,
      tipo: 'proprietario'
    });
    
    const proprietario = await novoProprietario.save();
    
    // 2. Criar o estabelecimento
    const novoEstabelecimento = new Estabelecimento({
      nome: nomeEstabelecimento,
      urlPersonalizada,
      proprietario: proprietario._id,
      contato: {
        telefone,
        email
      },
      assinatura: {
        plano: 'basico',
        status: 'trial',
        dataInicio: new Date(),
        dataRenovacao: new Date(new Date().setDate(new Date().getDate() + 15)) // 15 dias de trial
      }
    });
    
    const estabelecimento = await novoEstabelecimento.save();
    
    // 3. Atualizar o proprietário com a referência ao estabelecimento
    proprietario.estabelecimento = estabelecimento._id;
    await proprietario.save();
    
    // Remover a senha antes de enviar a resposta
    const proprietarioSemSenha = { ...proprietario.toObject() };
    delete proprietarioSemSenha.password;
    
    // Gerar token JWT
    const token = jwt.sign(
      { 
        id: proprietario._id,
        tipo: proprietario.tipo,
        estabelecimento: estabelecimento._id,
        estabelecimentoUrl: estabelecimento.urlPersonalizada
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(201).json({
      status: 'success',
      token,
      user: proprietarioSemSenha,
      estabelecimento: {
        id: estabelecimento._id,
        nome: estabelecimento.nome,
        urlPersonalizada: estabelecimento.urlPersonalizada,
        marca: estabelecimento.marca
      }
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.verifyToken = async (req, res) => {
  try {
    // O usuário já está disponível no req.user graças ao middleware de autenticação
    const { id, tipo, estabelecimento: estabelecimentoId } = req.user;
    
    // Buscar informações adicionais do usuário
    const usuario = await Usuario.findById(id).select('-password');
    
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    // Se o usuário estiver vinculado a um estabelecimento, obter informações básicas
    let estabelecimentoInfo = null;
    if (estabelecimentoId) {
      const estabelecimento = await Estabelecimento.findById(estabelecimentoId);
      if (estabelecimento) {
        estabelecimentoInfo = {
          id: estabelecimento._id,
          nome: estabelecimento.nome,
          urlPersonalizada: estabelecimento.urlPersonalizada,
          marca: estabelecimento.marca
        };
      }
    }
    
    res.status(200).json({
      status: 'success',
      user: usuario,
      estabelecimento: estabelecimentoInfo
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Nova função para permitir que clientes se associem a estabelecimentos
exports.vincularEstabelecimento = async (req, res) => {
  try {
    const { estabelecimentoUrl } = req.body;
    const usuarioId = req.user.id;
    
    // Verificar se o usuário é um cliente
    const usuario = await Usuario.findById(usuarioId);
    if (!usuario || usuario.tipo !== 'cliente') {
      return res.status(403).json({
        status: 'error',
        message: 'Apenas clientes podem vincular-se a estabelecimentos'
      });
    }
    
    // Buscar o estabelecimento
    const estabelecimento = await Estabelecimento.findOne({ urlPersonalizada: estabelecimentoUrl });
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    // Verificar se o estabelecimento está ativo
    if (!estabelecimento.ativo) {
      return res.status(403).json({
        status: 'error',
        message: 'Este estabelecimento está temporariamente indisponível'
      });
    }
    
    // Para clientes, não atualizamos o campo estabelecimento diretamente
    // pois eles podem frequentar múltiplos estabelecimentos
    // Em vez disso, podemos adicionar a um array de estabelecimentos favoritos ou frequentados
    // (Isso exigiria uma modificação no modelo Usuario)
    
    // Gerar novo token com informações atualizadas
    const token = jwt.sign(
      { 
        id: usuario._id,
        tipo: usuario.tipo,
        estabelecimento: usuario.estabelecimento,
        estabelecimentoUrl: estabelecimento.urlPersonalizada
      }, 
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );
    
    res.status(200).json({
      status: 'success',
      message: 'Vínculo com estabelecimento realizado com sucesso',
      token,
      estabelecimento: {
        id: estabelecimento._id,
        nome: estabelecimento.nome,
        urlPersonalizada: estabelecimento.urlPersonalizada,
        marca: estabelecimento.marca
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};