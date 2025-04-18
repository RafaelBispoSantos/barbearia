const Estabelecimento = require('../models/Estabelecimento');
const mongoose = require('mongoose');

// Informações dos planos (simulação)
const planos = {
  basico: {
    preco: 99.90,
    recursos: [
      'Até 3 barbeiros',
      'Agendamento online',
      'Dashboard básico',
      'Customização limitada'
    ],
    limites: {
      barbeiros: 3,
      agendamentos: 300,
      relatorios: 'básicos'
    }
  },
  profissional: {
    preco: 199.90,
    recursos: [
      'Até 7 barbeiros',
      'Agendamento online',
      'Dashboard completo',
      'Personalização avançada',
      'Marketing por SMS e Email'
    ],
    limites: {
      barbeiros: 7,
      agendamentos: 1000,
      relatorios: 'avançados'
    }
  },
  premium: {
    preco: 299.90,
    recursos: [
      'Barbeiros ilimitados',
      'Agendamento online e app personalizado',
      'Dashboard gerencial completo',
      'Personalização total',
      'Marketing multicanal',
      'Múltiplas unidades'
    ],
    limites: {
      barbeiros: 'ilimitado',
      agendamentos: 'ilimitado',
      relatorios: 'premium'
    }
  }
};

// Obter informações da assinatura atual
exports.getAssinaturaInfo = async (req, res) => {
  try {
    const estabelecimentoId = req.params.estabelecimentoId;
    
    const estabelecimento = await Estabelecimento.findById(estabelecimentoId);
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    // Adicionar informações do plano às informações da assinatura
    const planoAtual = estabelecimento.assinatura.plano;
    const infoPlano = planos[planoAtual] || {};
    
    const assinaturaInfo = {
      ...estabelecimento.assinatura.toObject(),
      infoPlanoDe: planoAtual,
      detalhesPlano: infoPlano,
      planos: planos // Informações de todos os planos para comparação
    };
    
    res.status(200).json({
      status: 'success',
      data: assinaturaInfo
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Atualizar plano (upgrade/downgrade)
exports.atualizarPlano = async (req, res) => {
  try {
    const estabelecimentoId = req.params.estabelecimentoId;
    const { novoPlano } = req.body;
    
    // Verificar se o plano é válido
    if (!planos[novoPlano]) {
      return res.status(400).json({
        status: 'error',
        message: 'Plano inválido'
      });
    }
    
    const estabelecimento = await Estabelecimento.findById(estabelecimentoId);
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    // Verificar se está fazendo downgrade para um plano com menos recursos
    if (novoPlano === 'basico' && estabelecimento.assinatura.plano !== 'basico') {
      // Aqui seria necessário verificar se o estabelecimento não excede os limites do plano básico
      // Por exemplo, verificar quantos barbeiros ativos existem
      const Usuario = require('../models/Usuario');
      const barbeirosAtivos = await Usuario.countDocuments({
        estabelecimento: estabelecimentoId,
        tipo: 'barbeiro',
        ativo: true
      });
      
      if (barbeirosAtivos > planos.basico.limites.barbeiros) {
        return res.status(400).json({
          status: 'error',
          message: `Você tem ${barbeirosAtivos} barbeiros ativos. O plano básico permite apenas ${planos.basico.limites.barbeiros}.`
        });
      }
    }
    
    // Atualizar o plano
    const dataRenovacao = new Date();
    dataRenovacao.setMonth(dataRenovacao.getMonth() + 1); // +1 mês
    
    estabelecimento.assinatura.plano = novoPlano;
    estabelecimento.assinatura.status = 'ativo';
    estabelecimento.assinatura.dataRenovacao = dataRenovacao;
    
    // Adicionar ao histórico de faturamento
    estabelecimento.assinatura.historicoFaturamento.push({
      data: new Date(),
      valor: planos[novoPlano].preco,
      status: 'pago',
      comprovante: `payment-${Date.now()}`
    });
    
    await estabelecimento.save();
    
    // Integração com gateway de pagamento (simulação)
    // const pagamento = await processarPagamento(estabelecimento, planos[novoPlano].preco);
    
    res.status(200).json({
      status: 'success',
      message: `Plano atualizado para ${novoPlano} com sucesso`,
      data: {
        plano: novoPlano,
        preco: planos[novoPlano].preco,
        dataRenovacao
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Atualizar método de pagamento
exports.atualizarMetodoPagamento = async (req, res) => {
  try {
    const estabelecimentoId = req.params.estabelecimentoId;
    const { tipo, numeroCartao, validade, titular } = req.body;
    
    // Validar dados do cartão (simulação)
    if (tipo === 'cartao' && (!numeroCartao || !validade || !titular)) {
      return res.status(400).json({
        status: 'error',
        message: 'Dados do cartão incompletos'
      });
    }
    
    // Integração com gateway de pagamento (simulação)
    // const tokenCartao = await tokenizarCartao(numeroCartao, validade, titular);
    const tokenCartao = `token_${Date.now()}`;
    
    // Atualizar método de pagamento
    const estabelecimento = await Estabelecimento.findByIdAndUpdate(
      estabelecimentoId,
      {
        'assinatura.metodoPagamento': {
          tipo,
          ultimosDigitos: numeroCartao ? numeroCartao.slice(-4) : '',
          tokenProvider: tokenCartao
        }
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
      message: 'Método de pagamento atualizado com sucesso',
      data: {
        tipo,
        ultimosDigitos: numeroCartao ? numeroCartao.slice(-4) : ''
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Listar faturas
exports.listarFaturas = async (req, res) => {
  try {
    const estabelecimentoId = req.params.estabelecimentoId;
    
    const estabelecimento = await Estabelecimento.findById(estabelecimentoId);
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    const faturas = estabelecimento.assinatura.historicoFaturamento || [];
    
    res.status(200).json({
      status: 'success',
      results: faturas.length,
      data: faturas
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Cancelar assinatura
exports.cancelarAssinatura = async (req, res) => {
  try {
    const estabelecimentoId = req.params.estabelecimentoId;
    const { motivo } = req.body;
    
    const estabelecimento = await Estabelecimento.findById(estabelecimentoId);
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    // Atualizar status da assinatura
    estabelecimento.assinatura.status = 'inativo';
    await estabelecimento.save();
    
    // Integração com CRM/sistema de retenção (simulação)
    // await registrarCancelamento(estabelecimentoId, motivo);
    
    res.status(200).json({
      status: 'success',
      message: 'Assinatura cancelada com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Reativar assinatura
exports.reativarAssinatura = async (req, res) => {
  try {
    const estabelecimentoId = req.params.estabelecimentoId;
    
    const estabelecimento = await Estabelecimento.findById(estabelecimentoId);
    
    if (!estabelecimento) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado'
      });
    }
    
    // Verificar se tem método de pagamento válido
    if (!estabelecimento.assinatura.metodoPagamento || 
        !estabelecimento.assinatura.metodoPagamento.tokenProvider) {
      return res.status(400).json({
        status: 'error',
        message: 'É necessário cadastrar um método de pagamento válido'
      });
    }
    
    // Processar pagamento (simulação)
    // const pagamento = await processarPagamento(
    //   estabelecimento, 
    //   planos[estabelecimento.assinatura.plano].preco
    // );
    
    // Atualizar status da assinatura
    const dataRenovacao = new Date();
    dataRenovacao.setMonth(dataRenovacao.getMonth() + 1); // +1 mês
    
    estabelecimento.assinatura.status = 'ativo';
    estabelecimento.assinatura.dataRenovacao = dataRenovacao;
    
    // Adicionar ao histórico de faturamento
    estabelecimento.assinatura.historicoFaturamento.push({
      data: new Date(),
      valor: planos[estabelecimento.assinatura.plano].preco,
      status: 'pago',
      comprovante: `payment-${Date.now()}`
    });
    
    await estabelecimento.save();
    
    res.status(200).json({
      status: 'success',
      message: 'Assinatura reativada com sucesso',
      data: {
        plano: estabelecimento.assinatura.plano,
        dataRenovacao
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};