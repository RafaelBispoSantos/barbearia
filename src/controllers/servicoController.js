const Servico = require('../models/Servico');
const Agendamento = require('../models/Agendamento');
const mongoose = require('mongoose');

exports.criarServico = async (req, res) => {
  try {
    const { estabelecimentoId } = req.body;
    
    // Verificar permissões (apenas proprietários e admins podem criar serviços)
    if (req.user.tipo !== 'admin' && req.user.tipo !== 'proprietario') {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para criar serviços'
      });
    }
    
    // Verificar se o usuário é proprietário deste estabelecimento
    if (req.user.tipo === 'proprietario' && req.user.estabelecimento.toString() !== estabelecimentoId) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para criar serviços neste estabelecimento'
      });
    }
    
    const novoServico = new Servico({
      ...req.body,
      estabelecimento: estabelecimentoId
    });
    
    const servico = await novoServico.save();
    
    res.status(201).json({
      status: 'success',
      data: servico
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.listarServicos = async (req, res) => {
  try {
    const { estabelecimentoId, categoria, destaque } = req.query;
    
    if (!estabelecimentoId) {
      return res.status(400).json({
        status: 'error',
        message: 'ID do estabelecimento é obrigatório'
      });
    }
    
    const filtro = { 
      estabelecimento: estabelecimentoId,
      ativo: true 
    };
    
    if (categoria) filtro.categoria = categoria;
    if (destaque === 'true') filtro.destaque = true;
    
    const servicos = await Servico.find(filtro).sort({ ordem: 1, nome: 1 });
    
    res.status(200).json({
      status: 'success',
      results: servicos.length,
      data: servicos
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.obterServico = async (req, res) => {
  try {
    const servico = await Servico.findById(req.params.id);
    
    if (!servico) {
      return res.status(404).json({
        status: 'error',
        message: 'Serviço não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: servico
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarServico = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o serviço para verificar permissões
    const servico = await Servico.findById(id);
    
    if (!servico) {
      return res.status(404).json({
        status: 'error',
        message: 'Serviço não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.tipo === 'proprietario' && 
        servico.estabelecimento.toString() !== req.user.estabelecimento.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para atualizar este serviço'
      });
    }
    
    // Não permitir alterar o estabelecimento
    const dadosAtualizacao = { ...req.body };
    delete dadosAtualizacao.estabelecimento;
    
    const servicoAtualizado = await Servico.findByIdAndUpdate(
      id,
      dadosAtualizacao,
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: servicoAtualizado
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.excluirServico = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o serviço para verificar permissões
    const servico = await Servico.findById(id);
    
    if (!servico) {
      return res.status(404).json({
        status: 'error',
        message: 'Serviço não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.tipo === 'proprietario' && 
        servico.estabelecimento.toString() !== req.user.estabelecimento.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para excluir este serviço'
      });
    }
    
    // Verificar se há agendamentos futuros com este serviço
    const agora = new Date();
    const agendamentosFuturos = await Agendamento.find({
      servicos: id,
      data: { $gt: agora },
      status: { $in: ['agendado', 'confirmado'] }
    });
    
    if (agendamentosFuturos.length > 0) {
      // Em vez de impedir a exclusão, fazemos uma exclusão lógica
      await Servico.findByIdAndUpdate(id, { ativo: false });
      
      return res.status(200).json({
        status: 'success',
        message: 'Serviço desativado pois há agendamentos futuros',
        agendamentos: agendamentosFuturos.length
      });
    }
    
    // Exclusão real se não houver agendamentos
    await Servico.findByIdAndDelete(id);
    
    res.status(200).json({
      status: 'success',
      message: 'Serviço excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir serviço:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao excluir serviço',
      error: error.message
    });
  }
};

exports.criarPromocao = async (req, res) => {
  try {
    const { id } = req.params;
    const { precoPromocional, dataInicio, dataFim, descricaoPromocao } = req.body;
    
    // Buscar o serviço para verificar permissões
    const servico = await Servico.findById(id);
    
    if (!servico) {
      return res.status(404).json({
        status: 'error',
        message: 'Serviço não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.tipo === 'proprietario' && 
        servico.estabelecimento.toString() !== req.user.estabelecimento.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para atualizar este serviço'
      });
    }
    
    // Validar preço promocional
    if (precoPromocional >= servico.preco) {
      return res.status(400).json({
        status: 'error',
        message: 'Preço promocional deve ser menor que o preço normal'
      });
    }
    
    // Criar a promoção
    const servicoAtualizado = await Servico.findByIdAndUpdate(
      id,
      {
        promocao: {
          ativa: true,
          precoPromocional,
          dataInicio: new Date(dataInicio),
          dataFim: new Date(dataFim),
          descricaoPromocao
        }
      },
      { new: true, runValidators: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: servicoAtualizado
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.encerrarPromocao = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Buscar o serviço para verificar permissões
    const servico = await Servico.findById(id);
    
    if (!servico) {
      return res.status(404).json({
        status: 'error',
        message: 'Serviço não encontrado'
      });
    }
    
    // Verificar permissões
    if (req.user.tipo === 'proprietario' && 
        servico.estabelecimento.toString() !== req.user.estabelecimento.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Sem permissão para atualizar este serviço'
      });
    }
    
    // Encerrar a promoção
    const servicoAtualizado = await Servico.findByIdAndUpdate(
      id,
      { 'promocao.ativa': false },
      { new: true }
    );
    
    res.status(200).json({
      status: 'success',
      data: servicoAtualizado
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};