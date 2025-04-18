const Estabelecimento = require('../models/Estabelecimento');
const Usuario = require('../models/Usuario');
const Agendamento = require('../models/Agendamento');
const Servico = require('../models/Servico');

exports.getEstabelecimento = async (req, res) => {
  try {
    // Pode buscar pelo ID ou pela URL personalizada
    const { id, url } = req.query;
    let estabelecimento;
    
    if (id) {
      estabelecimento = await Estabelecimento.findById(id);
    } else if (url) {
      estabelecimento = await Estabelecimento.findOne({ urlPersonalizada: url });
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'É necessário fornecer ID ou URL do estabelecimento'
      });
    }
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: estabelecimento
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarEstabelecimento = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o usuário tem permissão (proprietário ou admin)
    if (req.user.tipo !== 'admin' && 
        (!req.user.estabelecimento || req.user.estabelecimento.toString() !== id) ||
        req.user.tipo !== 'proprietario') {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para editar este estabelecimento'
      });
    }
    
    // Campos que não podem ser atualizados diretamente
    const camposProtegidos = ['assinatura', 'urlPersonalizada', 'proprietario'];
    
    // Remover campos protegidos da atualização
    const dadosAtualizacao = { ...req.body };
    camposProtegidos.forEach(campo => delete dadosAtualizacao[campo]);
    
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      id,
      dadosAtualizacao,
      { new: true, runValidators: true }
    );
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: estabelecimento
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarUrlPersonalizada = async (req, res) => {
  try {
    const { id } = req.params;
    const { urlPersonalizada } = req.body;
    
    // Verificar se a URL já está em uso
    const urlExistente = await Estabelecimento.findOne({ 
      urlPersonalizada,
      _id: { $ne: id }
    });
    
    if (urlExistente) {
      return res.status(400).json({
        status: 'error',
        message: 'Esta URL personalizada já está em uso'
      });
    }
    
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      id,
      { urlPersonalizada },
      { new: true, runValidators: true }
    );
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: estabelecimento
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarMarca = async (req, res) => {
  try {
    const { id } = req.params;
    const { marca } = req.body;
    
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      id,
      { marca },
      { new: true, runValidators: true }
    );
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: estabelecimento
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarConteudo = async (req, res) => {
  try {
    const { id } = req.params;
    const { conteudo } = req.body;
    
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      id,
      { conteudo },
      { new: true, runValidators: true }
    );
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: estabelecimento
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.adicionarBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const banner = req.body;
    
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      id,
      { $push: { 'conteudo.banners': banner } },
      { new: true, runValidators: true }
    );
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: estabelecimento.conteudo.banners
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.removerBanner = async (req, res) => {
  try {
    const { id, bannerId } = req.params;
    
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      id,
      { $pull: { 'conteudo.banners': { _id: bannerId } } },
      { new: true }
    );
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Banner removido com sucesso',
      data: estabelecimento.conteudo.banners
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.getEstabelecimentoStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar se o estabelecimento existe
    const estabelecimento = await Estabelecimento.findById(id);
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    // Estatísticas de agendamentos
    const totalAgendamentos = await Agendamento.countDocuments({ estabelecimento: id });
    
    const hoje = new Date();
    const agendamentosHoje = await Agendamento.countDocuments({
      estabelecimento: id,
      data: {
        $gte: new Date(hoje.setHours(0, 0, 0)),
        $lt: new Date(hoje.setHours(23, 59, 59))
      }
    });
    
    // Contagem de barbeiros ativos
    const barbeirosAtivos = await Usuario.countDocuments({ 
      estabelecimento: id,
      tipo: 'barbeiro',
      ativo: true 
    });
    
    // Contagem de clientes
    const totalClientes = await Usuario.countDocuments({
      estabelecimento: id,
      tipo: 'cliente'
    });
    
    // Calcular faturamento semanal
    const umaSemanaAtras = new Date();
    umaSemanaAtras.setDate(umaSemanaAtras.getDate() - 7);
    
    const agendamentosSemana = await Agendamento.find({
      estabelecimento: id,
      data: { $gte: umaSemanaAtras },
      status: 'concluido'
    }).select('precoTotal');
    
    const faturamentoSemanal = agendamentosSemana.reduce(
      (total, agendamento) => total + agendamento.precoTotal, 0);
    
    // Serviços mais populares
    const servicosPopulares = await Agendamento.aggregate([
      { $match: { estabelecimento: mongoose.Types.ObjectId(id) } },
      { $unwind: "$servicos" },
      { $group: { _id: "$servicos", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: {
          from: "servicos",
          localField: "_id",
          foreignField: "_id",
          as: "servicoDetalhes"
        }
      },
      { $unwind: "$servicoDetalhes" },
      { $project: {
          _id: 1,
          nome: "$servicoDetalhes.nome",
          count: 1
        }
      }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        totalAgendamentos,
        agendamentosHoje,
        barbeirosAtivos,
        totalClientes,
        faturamentoSemanal,
        servicosPopulares
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarStatusAssinatura = async (req, res) => {
  try {
    const { id } = req.params;
    const { plano, status } = req.body;
    
    // Apenas administradores podem atualizar status de assinatura
    if (req.user.tipo !== 'admin') {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para atualizar assinatura'
      });
    }
    
    const dataRenovacao = new Date();
    // Definir data de renovação baseado no plano
    if (plano === 'basico' || plano === 'profissional' || plano === 'premium') {
      dataRenovacao.setMonth(dataRenovacao.getMonth() + 1); // +1 mês
    }
    
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      id,
      { 
        'assinatura.plano': plano,
        'assinatura.status': status,
        'assinatura.dataRenovacao': dataRenovacao 
      },
      { new: true }
    );
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: estabelecimento
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};