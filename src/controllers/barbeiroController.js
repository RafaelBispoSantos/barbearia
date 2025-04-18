const Barbeiro = require('../models/Barbeiro');
const Agendamento = require('../models/Agendamento');

exports.criarBarbeiro = async (req, res) => {
  try {
    const novoBarbeiro = new Barbeiro(req.body);
    const barbeiro = await novoBarbeiro.save();
    res.status(201).json({
      status: 'success',
      data: barbeiro
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};



exports.listarBarbeiros = async (req, res) => {
  try {
    const { estabelecimentoId } = req.query;
    
    if (!estabelecimentoId) {
      return res.status(400).json({
        status: 'error',
        message: 'ID do estabelecimento é obrigatório'
      });
    }
    
    const barbeiros = await Usuario.find({
      estabelecimento: estabelecimentoId,
      tipo: 'barbeiro',
      ativo: true
    }).select('-password');
    
    res.status(200).json({
      status: 'success',
      results: barbeiros.length,
      data: barbeiros
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.obterBarbeiro = async (req, res) => {
  try {
    const barbeiro = await Barbeiro.findById(req.params.id);
    if (!barbeiro) {
      return res.status(404).json({
        status: 'error',
        message: 'Barbeiro não encontrado'
      });
    }
    res.status(200).json({
      status: 'success',
      data: barbeiro
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
exports.deletarBarbeiro = async (req, res) => {
  try {
    // Verificar se existem agendamentos futuros para este barbeiro
    const dataAtual = new Date();
    const agendamentosFuturos = await Agendamento.find({
      barbeiro: req.params.id,
      data: { $gt: dataAtual },
      status: { $in: ['agendado', 'confirmado'] }
    });

    if (agendamentosFuturos.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Não é possível deletar o barbeiro pois existem agendamentos futuros',
        agendamentos: agendamentosFuturos.length
      });
    }

    // Exclusão lógica (apenas marcar como inativo)
    const resultado = await Barbeiro.findByIdAndUpdate(
      req.params.id,
      { ativo: false },
      { new: true }
    );
    
    if (!resultado) {
      return res.status(404).json({
        status: 'error',
        message: 'Barbeiro não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      message: 'Barbeiro removido com sucesso'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.atualizarBarbeiro = async (req, res) => {
  try {
    const barbeiro = await Barbeiro.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!barbeiro) {
      return res.status(404).json({
        status: 'error',
        message: 'Barbeiro não encontrado'
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: barbeiro
    });
  } catch (error) {
    res.status(400).json({
      status: 'error',
      message: error.message
    });
  }
};

exports.obterHorariosDisponiveis = async (req, res) => {
  try {
    const { barbeiroId, data } = req.query;
    
    // Buscar barbeiro e seus horários de trabalho
    const barbeiro = await Barbeiro.findById(barbeiroId);
    if (!barbeiro) {
      return res.status(404).json({
        status: 'error',
        message: 'Barbeiro não encontrado'
      });
    }
    
    // Verificar se o barbeiro trabalha neste dia
    const dataAgendamento = new Date(data);
    const diaDaSemana = dataAgendamento.getDay();
    
    if (!barbeiro.horarioTrabalho.diasDisponiveis.includes(diaDaSemana)) {
      return res.status(200).json({
        status: 'success',
        message: 'Barbeiro não atende neste dia',
        data: []
      });
    }
    
    // Buscar agendamentos existentes deste barbeiro nesta data
    const agendamentos = await Agendamento.find({
      barbeiro: barbeiroId,
      data: {
        $gte: new Date(new Date(data).setHours(0, 0, 0)),
        $lt: new Date(new Date(data).setHours(23, 59, 59))
      },
      status: { $in: ['agendado', 'confirmado'] }
    }).select('horario duracao');
    
    // Gerar horários disponíveis
    const horariosOcupados = agendamentos.map(a => ({
      inicio: a.horario,
      fim: calcularHorarioFim(a.horario, a.duracao)
    }));
    
    const horariosDisponiveis = gerarHorariosDisponiveis(
      barbeiro.horarioTrabalho.inicio,
      barbeiro.horarioTrabalho.fim,
      horariosOcupados
    );
    
    res.status(200).json({
      status: 'success',
      data: horariosDisponiveis
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Funções auxiliares
function calcularHorarioFim(horario, duracao) {
  const [horas, minutos] = horario.split(':').map(Number);
  const dataBase = new Date();
  dataBase.setHours(horas, minutos, 0);
  dataBase.setMinutes(dataBase.getMinutes() + duracao);
  return `${String(dataBase.getHours()).padStart(2, '0')}:${String(dataBase.getMinutes()).padStart(2, '0')}`;
}

function gerarHorariosDisponiveis(horaInicio, horaFim, horariosOcupados) {
  const intervalos = []; // Intervalos de 30 minutos
  const [horaInicioH, horaInicioM] = horaInicio.split(':').map(Number);
  const [horaFimH, horaFimM] = horaFim.split(':').map(Number);
  
  let horaAtual = new Date();
  horaAtual.setHours(horaInicioH, horaInicioM, 0);
  
  const horaFinalDia = new Date();
  horaFinalDia.setHours(horaFimH, horaFimM, 0);
  
  while (horaAtual < horaFinalDia) {
    const horarioFormatado = `${String(horaAtual.getHours()).padStart(2, '0')}:${String(horaAtual.getMinutes()).padStart(2, '0')}`;
    
    // Verificar se este horário está disponível
    const horarioDisponivel = !horariosOcupados.some(ho => {
      return (horarioFormatado >= ho.inicio && horarioFormatado < ho.fim);
    });
    
    if (horarioDisponivel) {
      intervalos.push(horarioFormatado);
    }
    
    // Avançar 30 minutos
    horaAtual.setMinutes(horaAtual.getMinutes() + 30);
  }
  
  return intervalos;
}
