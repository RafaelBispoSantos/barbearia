const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const usuarioSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  telefone: {
    type: String
  },
  fotoPerfil: {
    type: String
  },
  tipo: {
    type: String,
    enum: ['admin', 'proprietario', 'barbeiro', 'cliente'],
    required: true
  },
  estabelecimento: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Estabelecimento'
  },
  // Para barbeiros
  especialidades: [{
    type: String
  }],
  horarioTrabalho: {
    inicio: String,
    fim: String,
    diasDisponiveis: [Number] // 0-6 (domingo-sábado)
  },
  // Para clientes
  historicoAgendamentos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Agendamento'
  }],
  // Preferências e notificações
  preferencias: {
    receberEmailMarketing: {
      type: Boolean,
      default: true
    },
    receberSMS: {
      type: Boolean,
      default: true
    },
    receberPushNotification: {
      type: Boolean,
      default: true
    }
  },
  ultimoLogin: Date,
  ativo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Método para comparar senhas
usuarioSchema.methods.verificarSenha = async function(senha) {
  return await bcrypt.compare(senha, this.password);
};

module.exports = mongoose.model('Usuario', usuarioSchema);