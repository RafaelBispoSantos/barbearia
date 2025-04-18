const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const routes = require('./routes');
require('dotenv').config();

const app = express();

// Configuração CORS otimizada para multi-tenancy
const corsOptions = {
  origin: function (origin, callback) {
    // Lista branca de origens permitidas (você pode adicionar mais conforme necessário)
    const whitelist = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://seudominio.com',
      'https://admin.seudominio.com'
    ];
    
    // Permitir requisições de subdomínios do seu domínio principal
    const regexSubdominio = /^https:\/\/[a-z0-9-]+\.seudominio\.com$/;
    
    // Verificar se a origem está na lista branca ou é um subdomínio válido
    if (!origin || whitelist.indexOf(origin) !== -1 || regexSubdominio.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Bloqueado pela política de CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 horas
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' })); // Aumentar limite para uploads de imagens
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para logging de requisições
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} | ${req.method} ${req.originalUrl}`);
  next();
});

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB conectado'))
.catch(err => console.error('Erro na conexão com MongoDB:', err));

// Middleware para identificar subdomínios
app.use(async (req, res, next) => {
  const host = req.hostname;
  
  // Verificar se é um subdomínio
  if (host !== 'seudominio.com' && host.endsWith('.seudominio.com')) {
    const subdomain = host.split('.')[0];
    
    // Buscar o estabelecimento pelo subdomínio
    const Estabelecimento = require('./models/Estabelecimento');
    const estabelecimento = await Estabelecimento.findOne({ urlPersonalizada: subdomain });
    
    if (estabelecimento) {
      // Adicionar estabelecimento ao objeto req para uso em outros middlewares
      req.estabelecimento = estabelecimento;
      req.query.estabelecimentoId = estabelecimento._id;
      req.body.estabelecimentoId = estabelecimento._id;
    }
  }
  
  next();
});

// Rotas
app.use('/api', routes);

// Tratamento de erros
app.use((err, req, res, next) => {
  console.error(`${new Date().toISOString()} | Erro: ${err.stack}`);
  
  // Tratamento de erro específico para violações de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({
      status: 'error',
      message: 'Erro de validação',
      errors
    });
  }
  
  // Tratamento de erro para ID de MongoDB inválido
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({
      status: 'error',
      message: 'ID inválido'
    });
  }
  
  // Tratamento de erro para chaves duplicadas (unique)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      status: 'error',
      message: `${field} já está em uso`
    });
  }
  
  // Erro padrão para outros tipos de erros
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Erro interno do servidor'
  });
});

// Middleware para rotas não encontradas
app.all('*', (req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Não foi possível encontrar ${req.originalUrl} neste servidor`
  });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor SaaS rodando na porta ${PORT}`);
});

module.exports = app;