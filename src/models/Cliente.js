const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  telefone: {
    type: String,
    required: true
  },
  fotoPerfil: {
    type: String
  },
  
  isAdmin: {
    type: Boolean,
    default: false
  },
  historicoAgendamentos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agendamento'
  }]
}, { timestamps: true });

module.exports = mongoose.model('Cliente', clienteSchema);