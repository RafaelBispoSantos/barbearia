const mongoose = require('mongoose');

const estabelecimentoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true
  },
  urlPersonalizada: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'URL pode conter apenas letras, números e hífens']
  },
  endereco: {
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: String,
    estado: String,
    cep: String
  },
  contato: {
    telefone: String,
    email: String,
    whatsapp: String
  },
  redesSociais: {
    instagram: String,
    facebook: String,
    twitter: String
  },
  proprietario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  horarioFuncionamento: {
    diasDisponiveis: [Number], // 0-6 (domingo-sábado)
    horarios: [{
      dia: Number,
      inicio: String,
      fim: String
    }]
  },
  // Configurações de marca e personalização
  marca: {
    logo: {
      type: String, // URL para a imagem
      default: '/default-logo.png'
    },
    corPrimaria: {
      type: String,
      default: '#000000'
    },
    corSecundaria: {
      type: String,
      default: '#ffffff'
    },
    fontes: {
      principal: {
        type: String,
        default: 'Roboto'
      },
      secundaria: {
        type: String,
        default: 'Open Sans'
      }
    }
  },
  // Conteúdo personalizado
  conteudo: {
    titulo: {
      type: String,
      default: function() { return this.nome; }
    },
    descricao: {
      type: String,
      default: 'Barbearia profissional com atendimento de qualidade.'
    },
    sobreNos: String,
    metaTags: {
      titulo: String,
      descricao: String,
      palavrasChave: String
    },
    banners: [{
      imagem: String,
      titulo: String,
      subtitulo: String,
      link: String,
      ativo: {
        type: Boolean,
        default: true
      }
    }]
  },
  // Configurações de assinatura
  assinatura: {
    plano: {
      type: String,
      enum: ['basico', 'profissional', 'premium'],
      default: 'basico'
    },
    status: {
      type: String,
      enum: ['ativo', 'inativo', 'trial', 'pendente'],
      default: 'trial'
    },
    dataInicio: Date,
    dataRenovacao: Date,
    metodoPagamento: {
      tipo: String,
      ultimosDigitos: String,
      tokenProvider: String
    },
    historicoFaturamento: [{
      data: Date,
      valor: Number,
      status: String,
      comprovante: String
    }]
  },
  configuracoes: {
    intervaloPadrao: {
      type: Number, // minutos
      default: 30
    },
    politicaCancelamento: {
      type: Number, // horas antes
      default: 24
    },
    permitirAgendamentoOnline: {
      type: Boolean,
      default: true
    },
    lembreteAutomatico: {
      type: Boolean,
      default: true
    },
    tempoAntecedenciaLembrete: {
      type: Number, // horas
      default: 24
    }
  },
  ativo: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Estabelecimento', estabelecimentoSchema);