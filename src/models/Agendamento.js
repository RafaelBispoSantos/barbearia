const mongoose = require('mongoose');

const agendamentoSchema = new mongoose.Schema({
  // Nova referência para estabelecimento
  estabelecimento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estabelecimento',
    required: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  barbeiro: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  servicos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Servico',
    required: true
  }],
  data: {
    type: Date,
    required: true
  },
  horario: {
    type: String,
    required: true
  },
  duracao: {
    type: Number, // duração total em minutos
    required: true
  },
  precoTotal: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['agendado', 'confirmado', 'cancelado', 'concluido'],
    default: 'agendado'
  },
  notasCliente: {
    type: String
  },
  notasBarbeiro: {
    type: String
  },
  avaliacao: {
    nota: Number, // 1-5
    comentario: String
  },
  // Rastreamento de notificações
  notificacoes: [{
    tipo: String, // 'email', 'sms', 'push'
    status: String, // 'enviado', 'falha', 'pendente'
    dataEnvio: Date
  }],
  // Método de pagamento (se aplicável)
  pagamento: {
    status: {
      type: String,
      enum: ['pendente', 'pago', 'reembolsado', 'cancelado'],
      default: 'pendente'
    },
    metodo: String,
    referencia: String,
    dataPagamento: Date
  }
}, { timestamps: true });

// Índices para melhorar performance das consultas
agendamentoSchema.index({ estabelecimento: 1, data: 1 });
agendamentoSchema.index({ estabelecimento: 1, barbeiro: 1, data: 1 });
agendamentoSchema.index({ estabelecimento: 1, cliente: 1, data: 1 });
agendamentoSchema.index({ estabelecimento: 1, status: 1 });

module.exports = mongoose.model('Agendamento', agendamentoSchema);