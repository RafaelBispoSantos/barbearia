const Usuario = require('../models/Usuario');
const Estabelecimento = require('../models/Estabelecimento');
const Agendamento = require('../models/Agendamento');
const mongoose = require('mongoose');

exports.getStats = async (req, res) => {
  try {
    // Estatísticas de usuários
    const totalUsuarios = await Usuario.countDocuments();
    const usuariosPorTipo = await Usuario.aggregate([
      { $group: { _id: '$tipo', count: { $sum: 1 } } }
    ]);
    
    // Estatísticas de estabelecimentos
    const totalEstabelecimentos = await Estabelecimento.countDocuments();
    const estabelecimentosPorPlano = await Estabelecimento.aggregate([
      { $group: { _id: '$assinatura.plano', count: { $sum: 1 } } }
    ]);
    const estabelecimentosPorStatus = await Estabelecimento.aggregate([
      { $group: { _id: '$assinatura.status', count: { $sum: 1 } } }
    ]);
    
    // Estatísticas de agendamentos
    const totalAgendamentos = await Agendamento.countDocuments();
    const agendamentosHoje = await Agendamento.countDocuments({
      data: {
        $gte: new Date(new Date().setHours(0, 0, 0)),
        $lt: new Date(new Date().setHours(23, 59, 59))
      }
    });
    
    // Estatísticas financeiras
    // Faturamento do mês atual
    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    
    const fimMes = new Date();
    fimMes.setMonth(fimMes.getMonth() + 1);
    fimMes.setDate(0);
    fimMes.setHours(23, 59, 59, 999);
    
    const faturamentoMes = await Estabelecimento.aggregate([
      { $unwind: '$assinatura.historicoFaturamento' },
      { 
        $match: { 
          'assinatura.historicoFaturamento.data': { 
            $gte: inicioMes, 
            $lte: fimMes 
          },
          'assinatura.historicoFaturamento.status': 'pago'
        } 
      },
      { $group: { _id: null, total: { $sum: '$assinatura.historicoFaturamento.valor' } } }
    ]);
    
    res.status(200).json({
      status: 'success',
      data: {
        usuarios: {
          total: totalUsuarios,
          porTipo: usuariosPorTipo
        },
        estabelecimentos: {
          total: totalEstabelecimentos,
          porPlano: estabelecimentosPorPlano,
          porStatus: estabelecimentosPorStatus
        },
        agendamentos: {
          total: totalAgendamentos,
          hoje: agendamentosHoje
        },
        financeiro: {
          faturamentoMes: faturamentoMes.length > 0 ? faturamentoMes[0].total : 0
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.listarEstabelecimentos = async (req, res) => {
  try {
    const { status, plano, busca } = req.query;
    
    const filtro = {};
    
    if (status) filtro['assinatura.status'] = status;
    if (plano) filtro['assinatura.plano'] = plano;
    if (busca) {
      filtro.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { urlPersonalizada: { $regex: busca, $options: 'i' } }
      ];
    }
    
    const estabelecimentos = await Estabelecimento.find(filtro)
      .populate('proprietario', 'nome email telefone')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      status: 'success',
      results: estabelecimentos.length,
      data: estabelecimentos
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.obterEstabelecimento = async (req, res) => {
  try {
    const { id } = req.params;
    
    const estabelecimento = await Estabelecimento.findById(id)
      .populate('proprietario', 'nome email telefone');
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    // Estatísticas adicionais
    const barbeiros = await Usuario.countDocuments({ 
      estabelecimento: id,
      tipo: 'barbeiro',
      ativo: true
    });
    
    const clientes = await Usuario.countDocuments({
      estabelecimento: id,
      tipo: 'cliente',
      ativo: true
    });
    
    const agendamentosTotal = await Agendamento.countDocuments({
      estabelecimento: id
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        ...estabelecimento._doc,
        estatisticas: {
          barbeiros,
          clientes,
          agendamentosTotal
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarStatusEstabelecimento = async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      id,
      { ativo },
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
      message: `Estabelecimento ${ativo ? 'ativado' : 'desativado'} com sucesso`,
      data: estabelecimento
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarAssinaturaEstabelecimento = async (req, res) => {
  try {
    const { id } = req.params;
    const { plano, status, dataRenovacao } = req.body;
    
    // Validar plano
    const planosValidos = ['basico', 'profissional', 'premium'];
    if (plano && !planosValidos.includes(plano)) {
      return res.status(400).json({
        status: 'error',
        message: 'Plano inválido'
      });
    }
    
    // Validar status
    const statusValidos = ['ativo', 'inativo', 'trial', 'pendente'];
    if (status && !statusValidos.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status inválido'
      });
    }
    
    // Preparar atualização
    const atualizacao = {};
    if (plano) atualizacao['assinatura.plano'] = plano;
    if (status) atualizacao['assinatura.status'] = status;
    if (dataRenovacao) atualizacao['assinatura.dataRenovacao'] = new Date(dataRenovacao);
    
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      id,
      atualizacao,
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
      message: 'Assinatura atualizada com sucesso',
      data: estabelecimento
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.listarUsuarios = async (req, res) => {
  try {
    const { tipo, estabelecimentoId, busca } = req.query;
    
    const filtro = {};
    
    if (tipo) filtro.tipo = tipo;
    if (estabelecimentoId) filtro.estabelecimento = estabelecimentoId;
    if (busca) {
      filtro.$or = [
        { nome: { $regex: busca, $options: 'i' } },
        { email: { $regex: busca, $options: 'i' } }
      ];
    }
    
    const usuarios = await Usuario.find(filtro)
      .select('-password')
      .populate('estabelecimento', 'nome urlPersonalizada')
      .sort({ createdAt: -1 });
    
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

exports.atualizarStatusUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { ativo } = req.body;
    
    const usuario = await Usuario.findByIdAndUpdate(
      id,
      { ativo },
      { new: true }
    ).select('-password');
    
    if (!usuario) {
      return res.status(404).json({
        status: 'error',
        message: 'Usuário não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso`,
      data: usuario
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.relatorioFaturamento = async (req, res) => {
  try {
    const { inicio, fim } = req.query;
    
    let dataInicio, dataFim;
    
    if (inicio && fim) {
      dataInicio = new Date(inicio);
      dataFim = new Date(fim);
    } else {
      // Últimos 12 meses por padrão
      dataInicio = new Date();
      dataInicio.setMonth(dataInicio.getMonth() - 11);
      dataInicio.setDate(1);
      dataInicio.setHours(0, 0, 0, 0);
      
      dataFim = new Date();
      dataFim.setDate(31);
      dataFim.setHours(23, 59, 59, 999);
    }
    
    // Agrupar por mês
    const faturamentoPorMes = await Estabelecimento.aggregate([
      { $unwind: '$assinatura.historicoFaturamento' },
      { 
        $match: { 
          'assinatura.historicoFaturamento.data': { 
            $gte: dataInicio, 
            $lte: dataFim 
          },
          'assinatura.historicoFaturamento.status': 'pago'
        } 
      },
      { 
        $group: { 
          _id: { 
            ano: { $year: '$assinatura.historicoFaturamento.data' },
            mes: { $month: '$assinatura.historicoFaturamento.data' }
          },
          total: { $sum: '$assinatura.historicoFaturamento.valor' },
          count: { $sum: 1 }
        } 
      },
      { $sort: { '_id.ano': 1, '_id.mes': 1 } }
    ]);
    
    // Formatar para mais fácil exibição em front-end
    const faturamentoFormatado = faturamentoPorMes.map(item => ({
      ano: item._id.ano,
      mes: item._id.mes,
      total: item.total,
      quantidade: item.count,
      periodo: `${item._id.ano}-${String(item._id.mes).padStart(2, '0')}`
    }));
    
    res.status(200).json({
      status: 'success',
      data: faturamentoFormatado
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.relatorioAssinaturas = async (req, res) => {
  try {
    // Distribuição por plano
    const assinaturasPorPlano = await Estabelecimento.aggregate([
      { $group: { _id: '$assinatura.plano', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Distribuição por status
    const assinaturasPorStatus = await Estabelecimento.aggregate([
      { $group: { _id: '$assinatura.status', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Assinaturas novas por mês (últimos 6 meses)
    const seisMesesAtras = new Date();
    seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 5);
    seisMesesAtras.setDate(1);
    seisMesesAtras.setHours(0, 0, 0, 0);
    
    const novasAssinaturasPorMes = await Estabelecimento.aggregate([
      { 
        $match: { 
          createdAt: { $gte: seisMesesAtras } 
        } 
      },
      { 
        $group: { 
          _id: { 
            ano: { $year: '$createdAt' },
            mes: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        } 
      },
      { $sort: { '_id.ano': 1, '_id.mes': 1 } }
    ]);
    
    // Taxa de conversão de trial para pagante
    const totalTrials = await Estabelecimento.countDocuments({
      'assinatura.status': { $ne: 'trial' },
      createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) }
    });
    
    const convertidosParaPagantes = await Estabelecimento.countDocuments({
      'assinatura.status': 'ativo',
      createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 3)) }
    });
    
    const taxaConversao = totalTrials > 0 
      ? (convertidosParaPagantes / totalTrials) * 100 
      : 0;
    
    res.status(200).json({
      status: 'success',
      data: {
        porPlano: assinaturasPorPlano,
        porStatus: assinaturasPorStatus,
        novasAssinaturasPorMes: novasAssinaturasPorMes.map(item => ({
          ano: item._id.ano,
          mes: item._id.mes,
          quantidade: item.count,
          periodo: `${item._id.ano}-${String(item._id.mes).padStart(2, '0')}`
        })),
        conversao: {
          totalTrials,
          convertidos: convertidosParaPagantes,
          taxa: taxaConversao.toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};