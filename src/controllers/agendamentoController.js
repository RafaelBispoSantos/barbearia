const Agendamento = require('../models/Agendamento');
const Usuario = require('../models/Usuario');
const Servico = require('../models/Servico');
const Estabelecimento = require('../models/Estabelecimento');
const mongoose = require('mongoose');

exports.criarAgendamento = async (req, res) => {
  try {
    const { cliente: clienteId, barbeiro, servicos, data, horario, estabelecimentoId } = req.body;
    
    // Verificar se o estabelecimento existe e está ativo
    const estabelecimento = await Estabelecimento.findById(estabelecimentoId);
    if (!estabelecimento || !estabelecimento.ativo) {
      return res.status(404).json({
        status: 'error',
        message: 'Estabelecimento não encontrado ou inativo'
      });
    }
    
    // Verificar se a assinatura está ativa ou em trial
    if (!['ativo', 'trial'].includes(estabelecimento.assinatura.status)) {
      return res.status(403).json({
        status: 'error',
        message: 'Estabelecimento com assinatura inativa ou pendente'
      });
    }
    
    // Verificar se os serviços existem e pertencem ao estabelecimento
    const servicosEncontrados = await Servico.find({
      _id: { $in: servicos },
      estabelecimento: estabelecimentoId,
      ativo: true
    });
    
    if (servicosEncontrados.length !== servicos.length) {
      return res.status(400).json({
        status: 'error',
        message: 'Um ou mais serviços não foram encontrados ou estão inativos'
      });
    }
    
    // Calcular preço total e duração
    const precoTotal = servicosEncontrados.reduce((total, servico) => total + servico.preco, 0);
    const duracaoTotal = servicosEncontrados.reduce((total, servico) => total + servico.duracao, 0);
    
    // Verificar se o barbeiro existe e pertence ao estabelecimento
    const barbeiroExiste = await Usuario.findOne({
      _id: barbeiro,
      estabelecimento: estabelecimentoId,
      tipo: 'barbeiro',
      ativo: true
    });
    
    if (!barbeiroExiste) {
      return res.status(400).json({
        status: 'error',
        message: 'Barbeiro não encontrado ou inativo'
      });
    }
    
    // Verificar disponibilidade do horário
    const horarioOcupado = await Agendamento.findOne({
      estabelecimento: estabelecimentoId,
      barbeiro,
      data: {
        $gte: new Date(new Date(data).setHours(0, 0, 0)),
        $lt: new Date(new Date(data).setHours(23, 59, 59))
      },
      horario,
      status: { $in: ['agendado', 'confirmado'] }
    });
    
    if (horarioOcupado) {
      return res.status(400).json({
        status: 'error',
        message: 'Horário não disponível'
      });
    }
    
    // Criar o agendamento
    const novoAgendamento = new Agendamento({
      estabelecimento: estabelecimentoId,
      cliente: clienteId,
      barbeiro,
      servicos,
      data,
      horario,
      duracao: duracaoTotal,
      precoTotal
    });
    
    const agendamento = await novoAgendamento.save();
    
    // Adicionar o agendamento ao histórico do cliente
    await Usuario.findByIdAndUpdate(
      clienteId,
      { $push: { historicoAgendamentos: agendamento._id } }
    );
    
    // Enviar notificação (implementação futura)
    // await notificationService.enviarConfirmacao(agendamento);
    
    res.status(201).json({
      status: 'success',
      data: agendamento
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.listarAgendamentos = async (req, res) => {
  try {
    const { barbeiro, cliente, data, status, estabelecimentoId } = req.query;
    const filtro = { estabelecimento: estabelecimentoId };
    
    // Verificar permissões
    if (req.user.tipo === 'cliente') {
      // Clientes só podem ver seus próprios agendamentos
      filtro.cliente = req.user.id;
    } else if (req.user.tipo === 'barbeiro') {
      // Barbeiros só podem ver seus próprios agendamentos
      filtro.barbeiro = req.user.id;
    } else if (req.user.tipo === 'proprietario' || req.user.tipo === 'admin') {
      // Proprietários e admins podem filtrar como quiserem
      if (barbeiro) filtro.barbeiro = barbeiro;
      if (cliente) filtro.cliente = cliente;
    }
    
    if (status) filtro.status = status;
    
    if (data) {
      // Filtrar por data específica
      filtro.data = {
        $gte: new Date(new Date(data).setHours(0, 0, 0)),
        $lt: new Date(new Date(data).setHours(23, 59, 59))
      };
    }
    
    const agendamentos = await Agendamento.find(filtro)
      .populate('cliente', 'nome email telefone fotoPerfil')
      .populate('barbeiro', 'nome especialidades fotoPerfil')
      .populate('servicos', 'nome preco duracao')
      .sort({ data: 1, horario: 1 });
    
    res.status(200).json({
      status: 'success',
      results: agendamentos.length,
      data: agendamentos
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.obterAgendamento = async (req, res) => {
  try {
    const agendamento = await Agendamento.findById(req.params.id)
      .populate('cliente', 'nome email telefone fotoPerfil')
      .populate('barbeiro', 'nome especialidades fotoPerfil')
      .populate('servicos', 'nome preco duracao');
    
    if (!agendamento) {
      return res.status(404).json({
        status: 'error',
        message: 'Agendamento não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.tipo === 'cliente' && agendamento.cliente._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para acessar este agendamento'
      });
    }
    
    if (req.user.tipo === 'barbeiro' && agendamento.barbeiro._id.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para acessar este agendamento'
      });
    }
    
    if (req.user.tipo === 'proprietario' && agendamento.estabelecimento.toString() !== req.user.estabelecimento) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para acessar este agendamento'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: agendamento
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarStatusAgendamento = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    if (!['agendado', 'confirmado', 'cancelado', 'concluido'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status inválido'
      });
    }
    
    // Buscar o agendamento
    const agendamento = await Agendamento.findById(id);
    
    if (!agendamento) {
      return res.status(404).json({
        status: 'error',
        message: 'Agendamento não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.tipo === 'cliente') {
      // Clientes só podem cancelar seus próprios agendamentos
      if (agendamento.cliente.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'Sem permissão para atualizar este agendamento'
        });
      }
      
      // Clientes só podem cancelar, não podem confirmar ou concluir
      if (status !== 'cancelado') {
        return res.status(403).json({
          status: 'error',
          message: 'Clientes só podem cancelar agendamentos'
        });
      }
      
      // Verificar política de cancelamento
      const estabelecimento = await Estabelecimento.findById(agendamento.estabelecimento);
      if (estabelecimento && estabelecimento.configuracoes.politicaCancelamento) {
        const horasAntecedencia = estabelecimento.configuracoes.politicaCancelamento;
        const dataAgendamento = new Date(agendamento.data);
        dataAgendamento.setHours(
          parseInt(agendamento.horario.split(':')[0]),
          parseInt(agendamento.horario.split(':')[1])
        );
        
        const agora = new Date();
        const horasRestantes = (dataAgendamento - agora) / (1000 * 60 * 60);
        
        if (horasRestantes < horasAntecedencia) {
          return res.status(400).json({
            status: 'error',
            message: `Cancelamentos devem ser feitos com pelo menos ${horasAntecedencia} horas de antecedência`
          });
        }
      }
    }
    
    // Atualizar o agendamento
    const agendamentoAtualizado = await Agendamento.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    
    // Adicionar registro de notificação
    if (status === 'confirmado' || status === 'cancelado') {
      const tipoNotificacao = status === 'confirmado' ? 'confirmacao' : 'cancelamento';
      
      // Adicionar ao histório de notificações
      await Agendamento.findByIdAndUpdate(
        id,
        { 
          $push: { 
            notificacoes: {
              tipo: 'email',
              status: 'pendente',
              dataEnvio: new Date()
            } 
          } 
        }
      );
      
      // Aqui seria o lugar para chamar um serviço de notificação
      // await notificationService.enviarNotificacao(agendamentoAtualizado, tipoNotificacao);
    }
    
    res.status(200).json({
      status: 'success',
      data: agendamentoAtualizado
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.adicionarAvaliacao = async (req, res) => {
  try {
    const { nota, comentario } = req.body;
    const { id } = req.params;
    
    if (nota < 1 || nota > 5) {
      return res.status(400).json({
        status: 'error',
        message: 'A nota deve estar entre 1 e 5'
      });
    }
    
    // Verificar se o agendamento existe e está concluído
    const agendamento = await Agendamento.findById(id);
    
    if (!agendamento) {
      return res.status(404).json({
        status: 'error',
        message: 'Agendamento não encontrado'
      });
    }
    
    if (agendamento.status !== 'concluido') {
      return res.status(400).json({
        status: 'error',
        message: 'Apenas agendamentos concluídos podem ser avaliados'
      });
    }
    
    // Verificar se quem está avaliando é o cliente do agendamento
    if (req.user.tipo !== 'cliente' || agendamento.cliente.toString() !== req.user.id) {
      return res.status(403).json({
        status: 'error',
        message: 'Apenas o cliente pode avaliar o agendamento'
      });
    }
    
    // Adicionar avaliação
    const agendamentoAtualizado = await Agendamento.findByIdAndUpdate(
      id,
      { avaliacao: { nota, comentario } },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: agendamentoAtualizado
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};