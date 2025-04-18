// seed.js
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const Usuario = require('./src/models/Usuario');
const Estabelecimento = require('./src/models/Estabelecimento');
const Servico = require('./src/models/Servico');
const Agendamento = require('./src/models/Agendamento');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB conectado para seed'))
.catch(err => {
  console.error('Erro na conexão com MongoDB:', err);
  process.exit(1);
});

// Dados predefinidos para uso no seed
const dadosMock = {
  nomes: [
    'João Silva', 'Maria Oliveira', 'Pedro Santos', 'Ana Souza', 'Carlos Ferreira',
    'Fernanda Lima', 'Rodrigo Almeida', 'Juliana Costa', 'Marcos Pereira', 'Patrícia Rodrigues',
    'Lucas Martins', 'Camila Gomes', 'Felipe Ribeiro', 'Larissa Cardoso', 'Bruno Carvalho',
    'Amanda Teixeira', 'Gustavo Barbosa', 'Aline Moreira', 'Rafael Castro', 'Vanessa Correia'
  ],
  sobrenomes: [
    'Silva', 'Oliveira', 'Santos', 'Souza', 'Ferreira', 'Lima', 'Almeida', 'Costa', 
    'Pereira', 'Rodrigues', 'Martins', 'Gomes', 'Ribeiro', 'Cardoso', 'Carvalho'
  ],
  emails: ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com', 'barbersaas.com'],
  telefones: ['11', '12', '13', '14', '15', '16', '17', '21', '22', '24', '27', '31', '32', '41', '47', '51'],
  ruas: [
    'Rua das Flores', 'Avenida Brasil', 'Rua São João', 'Avenida Paulista', 'Rua Augusta',
    'Avenida Atlântica', 'Rua Oscar Freire', 'Avenida Copacabana', 'Rua da Paz', 'Avenida Central'
  ],
  bairros: [
    'Centro', 'Jardim Primavera', 'Vila Nova', 'Boa Vista', 'Bela Vista',
    'Jardim Europa', 'Vila Mariana', 'Ipanema', 'Leblon', 'Moema'
  ],
  cidades: [
    'São Paulo', 'Rio de Janeiro', 'Belo Horizonte', 'Salvador', 'Brasília',
    'Curitiba', 'Fortaleza', 'Recife', 'Porto Alegre', 'Manaus'
  ],
  estados: [
    { nome: 'São Paulo', sigla: 'SP' },
    { nome: 'Rio de Janeiro', sigla: 'RJ' },
    { nome: 'Minas Gerais', sigla: 'MG' },
    { nome: 'Bahia', sigla: 'BA' },
    { nome: 'Distrito Federal', sigla: 'DF' },
    { nome: 'Paraná', sigla: 'PR' },
    { nome: 'Ceará', sigla: 'CE' },
    { nome: 'Pernambuco', sigla: 'PE' },
    { nome: 'Rio Grande do Sul', sigla: 'RS' },
    { nome: 'Amazonas', sigla: 'AM' }
  ],
  barbearias: [
    'Barbearia Vintage', 'Corte & Cia', 'Barba Negra', 'Tesoura de Ouro', 'Cabelo & Barba',
    'Studio Barber', 'Barber Shop', 'Barber King', 'Gentleman Barber', 'BarberStyle'
  ],
  especialidades: [
    'Corte Masculino', 'Barba', 'Cabelo e Barba', 'Corte Infantil',
    'Coloração', 'Degradê', 'Relaxamento', 'Sobrancelha'
  ],
  categorias: ['Cabelo', 'Barba', 'Combo', 'Tratamento', 'Estética'],
  servicos: [
    {
      nome: 'Corte de Cabelo',
      descricao: 'Corte de cabelo masculino tradicional',
      preco: 40,
      duracao: 30,
      categoria: 'Cabelo',
      destaque: true
    },
    {
      nome: 'Barba',
      descricao: 'Barba aparada com toalha quente e produtos premium',
      preco: 30,
      duracao: 20,
      categoria: 'Barba',
      destaque: true
    },
    {
      nome: 'Combo Cabelo + Barba',
      descricao: 'Corte de cabelo e barba completos',
      preco: 60,
      duracao: 50,
      categoria: 'Combo',
      destaque: true
    },
    {
      nome: 'Corte Degradê',
      descricao: 'Corte com degradê personalizado',
      preco: 50,
      duracao: 40,
      categoria: 'Cabelo',
      destaque: false
    },
    {
      nome: 'Coloração',
      descricao: 'Coloração profissional para cabelo',
      preco: 80,
      duracao: 60,
      categoria: 'Tratamento',
      destaque: false
    },
    {
      nome: 'Corte Infantil',
      descricao: 'Corte de cabelo para crianças até 12 anos',
      preco: 35,
      duracao: 25,
      categoria: 'Cabelo',
      destaque: false
    },
    {
      nome: 'Sobrancelha',
      descricao: 'Design e aparada de sobrancelha',
      preco: 20,
      duracao: 15,
      categoria: 'Estética',
      destaque: false
    },
    {
      nome: 'Hidratação',
      descricao: 'Tratamento de hidratação profunda para cabelo',
      preco: 70,
      duracao: 45,
      categoria: 'Tratamento',
      destaque: false
    }
  ],
  cores: [
    '#1a2b3c', '#2c3e50', '#34495e', '#7f8c8d', '#16a085',
    '#27ae60', '#2ecc71', '#3498db', '#e74c3c', '#c0392b'
  ],
  fontes: [
    'Roboto', 'Open Sans', 'Lato', 'Montserrat', 'Oswald',
    'Raleway', 'PT Sans', 'Nunito', 'Poppins', 'Ubuntu'
  ],
  complementos: ['', 'Sala 101', 'Sala 102', 'Loja 01', 'Loja 02', 'Andar 3']
};

// Funções auxiliares
const getRandomElement = (array) => {
  return array[Math.floor(Math.random() * array.length)];
};

const getRandomNumber = (min, max) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const getRandomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const getRandomBoolean = () => {
  return Math.random() > 0.5;
};

const getRandomName = () => {
  return getRandomElement(dadosMock.nomes);
};

const getRandomPhoneNumber = () => {
  const ddd = getRandomElement(dadosMock.telefones);
  const part1 = getRandomNumber(10000, 99999);
  const part2 = getRandomNumber(1000, 9999);
  return `${ddd}${part1}${part2}`;
};

const getFormattedPhoneNumber = () => {
  const ddd = getRandomElement(dadosMock.telefones);
  const part1 = getRandomNumber(10000, 99999);
  const part2 = getRandomNumber(1000, 9999);
  return `(${ddd}) ${part1}-${part2}`;
};

// Função para gerar email único
const usedEmails = new Set(); // Para armazenar emails já usados

const getUniqueEmail = (name) => {
  const nameParts = name.toLowerCase().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';
  const domain = getRandomElement(dadosMock.emails);
  let email;
  
  // Tentar até 5 formatos diferentes de email
  for (let i = 0; i < 5; i++) {
    if (i === 0) {
      email = `${firstName}.${lastName}@${domain}`;
    } else if (i === 1) {
      email = `${firstName}${getRandomNumber(1, 999)}@${domain}`;
    } else if (i === 2) {
      email = `${firstName}.${lastName}${getRandomNumber(1, 99)}@${domain}`;
    } else if (i === 3) {
      email = `${firstName[0]}${lastName}@${domain}`;
    } else {
      email = `${firstName}${lastName[0]}${getRandomNumber(100, 999)}@${domain}`;
    }
    
    // Verificar se o email já existe
    if (!usedEmails.has(email)) {
      usedEmails.add(email);
      return email;
    }
  }
  
  // Se todas as tentativas falharem, criar um email com timestamp
  email = `${firstName}${Date.now()}@${domain}`;
  usedEmails.add(email);
  return email;
};

const getRandomAddress = () => {
  const estado = getRandomElement(dadosMock.estados);
  return {
    rua: getRandomElement(dadosMock.ruas),
    numero: getRandomNumber(1, 1000).toString(),
    complemento: getRandomElement(dadosMock.complementos),
    bairro: getRandomElement(dadosMock.bairros),
    cidade: getRandomElement(dadosMock.cidades),
    estado: estado.sigla,
    cep: `${getRandomNumber(10000, 99999)}-${getRandomNumber(100, 999)}`
  };
};

// Função para normalizar strings para URLs
const normalizeUrlString = (str) => {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
    .replace(/[^a-z0-9]/g, '-') // substitui caracteres não alfanuméricos por hífen
    .replace(/-+/g, '-') // remove hífens duplicados
    .replace(/^-|-$/g, ''); // remove hífens no início e fim
};

// Função para garantir URLs únicas
const usedUrls = new Set();

const getUniqueUrl = (baseUrl, index) => {
  let url = baseUrl;
  
  // Adicionar índice se não for o primeiro
  if (index > 0) {
    url = `${baseUrl}-${index}`;
  }
  
  // Verificar se a URL já existe
  if (usedUrls.has(url)) {
    // Adicionar um número aleatório
    url = `${baseUrl}-${index}-${getRandomNumber(1000, 9999)}`;
  }
  
  usedUrls.add(url);
  return url;
};

// Hash de senha
const hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
};

// Limpar dados existentes
const clearDatabase = async () => {
  try {
    await Usuario.deleteMany({});
    await Estabelecimento.deleteMany({});
    await Servico.deleteMany({});
    await Agendamento.deleteMany({});
    console.log('Database cleared');
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
};

// Seed admin user
const seedAdmin = async () => {
  try {
    const adminPassword = await hashPassword('admin123');
    const admin = new Usuario({
      nome: 'Administrador',
      email: 'admin@barbersaas.com',
      password: adminPassword,
      telefone: getRandomPhoneNumber(),
      tipo: 'admin',
      ativo: true
    });
    
    await admin.save();
    console.log('Admin user created');
    return admin;
  } catch (error) {
    console.error('Error creating admin:', error);
    process.exit(1);
  }
};

// Seed establishments and their owners
const seedEstabelecimentos = async (count) => {
  try {
    const estabelecimentos = [];
    const proprietarios = [];
    
    for (let i = 0; i < count; i++) {
      // Create owner
      const ownerPassword = await hashPassword('senha123');
      const nomeProprietario = getRandomName();
      const emailProprietario = getUniqueEmail(nomeProprietario);
      
      const proprietario = new Usuario({
        nome: nomeProprietario,
        email: emailProprietario,
        password: ownerPassword,
        telefone: getRandomPhoneNumber(),
        tipo: 'proprietario',
        ativo: true
      });
      
      // Create establishment
      const nomeEstabelecimento = `${getRandomElement(dadosMock.barbearias)} ${i+1}`;
      const urlBase = normalizeUrlString(nomeEstabelecimento);
      const urlPersonalizada = getUniqueUrl(urlBase, i);
      
      // Random plan and status selection
      const planos = ['basico', 'profissional', 'premium'];
      const status = ['ativo', 'trial', 'inativo', 'pendente'];
      const planoIndex = Math.floor(Math.random() * 3); // 0, 1, or 2
      const statusIndex = Math.floor(Math.random() * 4); // 0, 1, 2, or 3
      const plano = planos[planoIndex];
      const statusPlano = status[statusIndex];
      
      // Create a dataRenovacao based on status
      let dataRenovacao = new Date();
      if (statusPlano === 'trial') {
        dataRenovacao.setDate(dataRenovacao.getDate() + 15); // Trial for 15 days
      } else {
        dataRenovacao.setMonth(dataRenovacao.getMonth() + 1); // One month ahead
      }
      
      // Add some previous payments for active establishments
      const historicoFaturamento = [];
      if (statusPlano === 'ativo') {
        const precos = {
          'basico': 99.90,
          'profissional': 199.90,
          'premium': 299.90
        };
        
        // Add 1-3 previous payments
        const paymentCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < paymentCount; j++) {
          const paymentDate = new Date();
          paymentDate.setMonth(paymentDate.getMonth() - j - 1);
          
          historicoFaturamento.push({
            data: paymentDate,
            valor: precos[plano],
            status: 'pago',
            comprovante: `payment-${Date.now() - j * 86400000}`
          });
        }
      }
      
      const endereco = getRandomAddress();
      const estabelecimento = new Estabelecimento({
        nome: nomeEstabelecimento,
        urlPersonalizada: urlPersonalizada,
        endereco: endereco,
        contato: {
          telefone: getFormattedPhoneNumber(),
          email: `contato@${urlPersonalizada}.com.br`,
          whatsapp: getFormattedPhoneNumber()
        },
        redesSociais: {
          instagram: `@${urlPersonalizada}`,
          facebook: `fb.com/${urlPersonalizada}`,
          twitter: `@${urlPersonalizada}`
        },
        proprietario: proprietario._id,
        horarioFuncionamento: {
          diasDisponiveis: [1, 2, 3, 4, 5, 6], // Monday to Saturday
          horarios: [
            { dia: 1, inicio: '09:00', fim: '19:00' },
            { dia: 2, inicio: '09:00', fim: '19:00' },
            { dia: 3, inicio: '09:00', fim: '19:00' },
            { dia: 4, inicio: '09:00', fim: '19:00' },
            { dia: 5, inicio: '09:00', fim: '19:00' },
            { dia: 6, inicio: '09:00', fim: '17:00' }
          ]
        },
        marca: {
          logo: `/uploads/logos/logo${i % 3 + 1}.png`,
          corPrimaria: getRandomElement(dadosMock.cores),
          corSecundaria: getRandomElement(dadosMock.cores)
        },
        conteudo: {
          titulo: nomeEstabelecimento,
          descricao: 'Barbearia moderna com os melhores profissionais da região.',
          sobreNos: 'Somos uma barbearia especializada em cortes masculinos e barba. Nossos profissionais são treinados para oferecer o melhor atendimento e os melhores serviços. Venha conhecer nossa barbearia e saia com um visual renovado!',
          banners: [
            {
              imagem: '/uploads/banners/banner1.jpg',
              titulo: 'Promoção de Inauguração',
              subtitulo: 'Cortes com 20% de desconto',
              link: '/promocoes',
              ativo: true
            }
          ]
        },
        assinatura: {
          plano: plano,
          status: statusPlano,
          dataInicio: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
          dataRenovacao: dataRenovacao,
          metodoPagamento: {
            tipo: 'cartao',
            ultimosDigitos: getRandomNumber(1000, 9999).toString(),
            tokenProvider: `token_${Date.now()}`
          },
          historicoFaturamento: historicoFaturamento
        },
        configuracoes: {
          intervaloPadrao: 30,
          politicaCancelamento: 24,
          permitirAgendamentoOnline: true,
          lembreteAutomatico: true,
          tempoAntecedenciaLembrete: 24
        },
        ativo: true
      });
      
      // Save both
      await proprietario.save();
      await estabelecimento.save();
      
      // Add reference to owner
      proprietario.estabelecimento = estabelecimento._id;
      await proprietario.save();
      
      estabelecimentos.push(estabelecimento);
      proprietarios.push(proprietario);
      
      console.log(`Created establishment: ${estabelecimento.nome}`);
    }
    
    return { estabelecimentos, proprietarios };
  } catch (error) {
    console.error('Error creating establishments:', error);
    process.exit(1);
  }
};

// Seed barbers for each establishment
const seedBarbeiros = async (estabelecimentos, count) => {
  try {
    const barbeiros = [];
    
    for (const estabelecimento of estabelecimentos) {
      // Determine how many barbers based on the plan
      let maxBarbeiros;
      switch (estabelecimento.assinatura.plano) {
        case 'basico':
          maxBarbeiros = 3;
          break;
        case 'profissional':
          maxBarbeiros = 7;
          break;
        case 'premium':
          maxBarbeiros = count;
          break;
        default:
          maxBarbeiros = 3;
      }
      
      const barbeiroCount = Math.min(count, maxBarbeiros);
      
      for (let i = 0; i < barbeiroCount; i++) {
        const barbeiroPassword = await hashPassword('senha123');
        const nomeBarbeiro = getRandomName();
        const emailBarbeiro = getUniqueEmail(nomeBarbeiro);
        
        // Generate random specialties
        const especialidades = [];
        const specialtyCount = getRandomNumber(1, 4); // 1 to 4 specialties
        
        for (let j = 0; j < specialtyCount; j++) {
          const specialty = getRandomElement(dadosMock.especialidades);
          if (!especialidades.includes(specialty)) {
            especialidades.push(specialty);
          }
        }
        
        const barbeiro = new Usuario({
          nome: nomeBarbeiro,
          email: emailBarbeiro,
          password: barbeiroPassword,
          telefone: getRandomPhoneNumber(),
          tipo: 'barbeiro',
          estabelecimento: estabelecimento._id,
          especialidades: especialidades,
          horarioTrabalho: {
            inicio: '09:00',
            fim: '19:00',
            diasDisponiveis: [1, 2, 3, 4, 5, 6] // Monday to Saturday
          },
          ativo: true
        });
        
        await barbeiro.save();
        barbeiros.push(barbeiro);
      }
      
      console.log(`Created ${barbeiroCount} barbers for ${estabelecimento.nome}`);
    }
    
    return barbeiros;
  } catch (error) {
    console.error('Error creating barbers:', error);
    process.exit(1);
  }
};

// Seed clients
const seedClientes = async (count) => {
  try {
    const clientes = [];
    
    for (let i = 0; i < count; i++) {
      const clientePassword = await hashPassword('senha123');
      const nomeCliente = getRandomName();
      const emailCliente = getUniqueEmail(nomeCliente);
      
      const cliente = new Usuario({
        nome: nomeCliente,
        email: emailCliente,
        password: clientePassword,
        telefone: getRandomPhoneNumber(),
        tipo: 'cliente',
        ativo: true,
        preferencias: {
          receberEmailMarketing: getRandomBoolean(),
          receberSMS: getRandomBoolean(),
          receberPushNotification: getRandomBoolean()
        }
      });
      
      await cliente.save();
      clientes.push(cliente);
    }
    
    console.log(`Created ${count} clients`);
    return clientes;
  } catch (error) {
    console.error('Error creating clients:', error);
    process.exit(1);
  }
};

// Seed services for each establishment
const seedServicos = async (estabelecimentos) => {
  try {
    const servicos = [];
    
    for (const estabelecimento of estabelecimentos) {
      // Determine how many services based on the plan
      let serviceCount;
      switch (estabelecimento.assinatura.plano) {
        case 'basico':
          serviceCount = 5;
          break;
        case 'profissional':
          serviceCount = 7;
          break;
        case 'premium':
          serviceCount = dadosMock.servicos.length;
          break;
        default:
          serviceCount = 5;
      }
      
      // Add services for this establishment
      const estabelecimentoServicos = [];
      for (let i = 0; i < serviceCount; i++) {
        // Base on pre-defined service but with some random variation
        const baseService = dadosMock.servicos[i];
        
        // Random price variation (±10%)
        const priceVariation = baseService.preco * (0.9 + Math.random() * 0.2);
        const price = Math.round(priceVariation / 5) * 5; // Round to nearest 5
        
        // Add random promotions (20% chance)
        const hasPromotion = Math.random() < 0.2;
        let promocao = {
          ativa: false
        };
        
        if (hasPromotion) {
          const discountPercent = getRandomNumber(10, 30); // 10-30% discount
          const discountedPrice = Math.round((price * (1 - discountPercent / 100)) / 5) * 5; // Round to nearest 5
          
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 30); // Promotion for the next 30 days
          
          promocao = {
            ativa: true,
            precoPromocional: discountedPrice,
            dataInicio: startDate,
            dataFim: endDate,
            descricaoPromocao: `${discountPercent}% de desconto por tempo limitado!`
          };
        }
        
        const servico = new Servico({
          estabelecimento: estabelecimento._id,
          nome: baseService.nome,
          descricao: baseService.descricao,
          preco: price,
          duracao: baseService.duracao,
          imagem: `/uploads/servicos/servico${i+1}.jpg`,
          categoria: baseService.categoria,
          promocao: promocao,
          destaque: baseService.destaque,
          ordem: i,
          ativo: true
        });
        
        await servico.save();
        estabelecimentoServicos.push(servico);
      }
      
      servicos.push(...estabelecimentoServicos);
      console.log(`Created ${serviceCount} services for ${estabelecimento.nome}`);
    }
    
    return servicos;
  } catch (error) {
    console.error('Error creating services:', error);
    process.exit(1);
  }
};

// Helper para gerar um horário aleatório no formato HH:MM
const randomTimeHHMM = (start = '09:00', end = '19:00') => {
  const [startHour, startMinute] = start.split(':').map(Number);
  const [endHour, endMinute] = end.split(':').map(Number);

  const startMinutes = startHour * 60 + startMinute;
  const endMinutes = endHour * 60 + endMinute;
  
  // Gerar um número aleatório de minutos entre início e fim
  let randomMinutes = Math.floor(Math.random() * (endMinutes - startMinutes)) + startMinutes;
  
  // Arredondar para múltiplos de 30 minutos (00 ou 30)
  randomMinutes = Math.floor(randomMinutes / 30) * 30;
  
  const hour = Math.floor(randomMinutes / 60);
  const minute = randomMinutes % 60;
  
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
};

// Seed appointments for each establishment
const seedAgendamentos = async (estabelecimentos, clientes, count) => {
  try {
    const agendamentos = [];
    
    for (const estabelecimento of estabelecimentos) {
      // Skip if establishment is inactive
      if (estabelecimento.assinatura.status !== 'ativo' && estabelecimento.assinatura.status !== 'trial') {
        continue;
      }
      
      // Get barbers and services for this establishment
      const barbeiros = await Usuario.find({
        estabelecimento: estabelecimento._id,
        tipo: 'barbeiro',
        ativo: true
      });
      
      const servicos = await Servico.find({
        estabelecimento: estabelecimento._id,
        ativo: true
      });
      
      if (barbeiros.length === 0 || servicos.length === 0) {
        console.log(`Skipping appointments for ${estabelecimento.nome} (no barbers or services)`);
        continue;
      }
      
      // Create past, present, and future appointments
      for (let i = 0; i < count; i++) {
        // Decide type of appointment (past, today, or future)
        const appointmentType = Math.random();
        let appointmentDate = new Date();
        let appointmentStatus = 'agendado';
        
        if (appointmentType < 0.5) {
          // Past appointment
          appointmentDate.setDate(appointmentDate.getDate() - getRandomNumber(1, 30));
          appointmentStatus = Math.random() < 0.1 ? 'cancelado' : 'concluido';
        } else if (appointmentType < 0.7) {
          // Today's appointment
          appointmentStatus = Math.random() < 0.7 ? 'confirmado' : 'agendado';
        } else {
          // Future appointment
          appointmentDate.setDate(appointmentDate.getDate() + getRandomNumber(1, 14));
          appointmentStatus = Math.random() < 0.3 ? 'confirmado' : 'agendado';
        }
        
        // Random client, barber, and services
        const cliente = getRandomElement(clientes);
        const barbeiro = getRandomElement(barbeiros);
        
        // Random 1-3 services
        const serviceCount = getRandomNumber(1, 3);
        const selectedServices = [];
        let totalDuration = 0;
        let totalPrice = 0;
        
        for (let j = 0; j < serviceCount; j++) {
          const service = getRandomElement(servicos);
          if (!selectedServices.includes(service._id)) {
            selectedServices.push(service._id);
            totalDuration += service.duracao;
            
            // Use promotional price if active
            if (service.promocao && service.promocao.ativa) {
              totalPrice += service.promocao.precoPromocional;
            } else {
              totalPrice += service.preco;
            }
          }
        }
        
        // Random time slot
        const horario = randomTimeHHMM('09:00', '19:00');
        
        // Create appointment
        const agendamento = new Agendamento({
          estabelecimento: estabelecimento._id,
          cliente: cliente._id,
          barbeiro: barbeiro._id,
          servicos: selectedServices,
          data: appointmentDate,
          horario: horario,
          duracao: totalDuration,
          precoTotal: totalPrice,
          status: appointmentStatus
        });
        
        // Add rating for completed appointments
        if (appointmentStatus === 'concluido') {
          const notas = [3, 4, 5]; // 3-5 stars
          const comentarios = [
            'Ótimo serviço!',
            'Gostei muito do resultado.',
            'Atendimento excelente.',
            'Recomendo muito.',
            'Voltarei mais vezes.',
            'Profissional muito atencioso.',
            'Corte ficou perfeito.'
          ];
          
          agendamento.avaliacao = {
            nota: getRandomElement(notas),
            comentario: getRandomElement(comentarios)
          };
        }
        
        await agendamento.save();
        agendamentos.push(agendamento);
        
        // Add appointment to client's history
        await Usuario.findByIdAndUpdate(
          cliente._id,
          { $push: { historicoAgendamentos: agendamento._id } }
        );
      }
      
      console.log(`Created ${count} appointments for ${estabelecimento.nome}`);
    }
    
    return agendamentos;
  } catch (error) {
    console.error('Error creating appointments:', error);
    process.exit(1);
  }
};

// Main seed function
const seedDatabase = async () => {
  try {
    await clearDatabase();
    
    // Seed different entities
    const admin = await seedAdmin();
    const { estabelecimentos, proprietarios } = await seedEstabelecimentos(5);
    const barbeiros = await seedBarbeiros(estabelecimentos, 5);
    const clientes = await seedClientes(20);
    const servicos = await seedServicos(estabelecimentos);
    const agendamentos = await seedAgendamentos(estabelecimentos, clientes, 15);
    
    console.log('Database seeding completed successfully!');
    console.log('----------------------------------------');
    console.log('Summary:');
    console.log(`- 1 admin user`);
    console.log(`- ${estabelecimentos.length} establishments`);
    console.log(`- ${proprietarios.length} proprietários`);
    console.log(`- ${barbeiros.length} barbers`);
    console.log(`- ${clientes.length} clients`);
    console.log(`- ${servicos.length} services`);
    console.log(`- ${agendamentos.length} appointments`);
    console.log('----------------------------------------');
    console.log('You can now login with these credentials:');
    console.log('Admin: admin@barbersaas.com / admin123');
    console.log(`Proprietário: ${proprietarios[0].email} / senha123`);
    console.log(`Barbeiro: ${barbeiros[0].email} / senha123`);
    console.log(`Cliente: ${clientes[0].email} / senha123`);
    
    mongoose.disconnect();
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

// Run the seed function
seedDatabase();