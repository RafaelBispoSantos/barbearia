const mongoose = require('mongoose');

const servicoSchema = new mongoose.Schema({
  // Nova referência para estabelecimento
  estabelecimento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estabelecimento',
    required: true
  },
  nome: {
    type: String,
    required: true
  },
  descricao: {
    type: String
  },
  preco: {
    type: Number,
    required: true
  },
  duracao: {
    type: Number, // duração em minutos
    required: true
  },
  imagem: {
    type: String
  },
  categoria: {
    type: String
  },
  // Promoções e descontos
  promocao: {
    ativa: {
      type: Boolean,
      default: false
    },
    precoPromocional: Number,
    dataInicio: Date,
    dataFim: Date,
    descricaoPromocao: String
  },
  // Quando barbeiros específicos realizam este serviço
  barbeirosDisponiveis: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario'
  }],
  destaque: {
    type: Boolean,
    default: false
  },
  ordem: {
    type: Number,
    default: 0
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Índices para melhorar performance
servicoSchema.index({ estabelecimento: 1, ativo: 1 });
servicoSchema.index({ estabelecimento: 1, categoria: 1, ativo: 1 });

module.exports = mongoose.model('Servico', servicoSchema);