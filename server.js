const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = 3000;

// ============================================
// SENHA DO ADMIN — Altere aqui quando quiser
// ============================================
const ADMIN_PASSWORD = 'drone@admin2024';

// Hash da senha (gerado na inicialização)
let passwordHash = bcrypt.hashSync(ADMIN_PASSWORD, 10);

// Tokens de sessão ativos
const activeSessions = new Map();

// Caminhos
const LEADS_FILE = path.join(__dirname, 'data', 'leads.json');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Funções auxiliares ---

function readLeads() {
  try {
    const data = fs.readFileSync(LEADS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function writeLeads(leads) {
  fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), 'utf-8');
}

function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (!token || !activeSessions.has(token)) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

// --- Rotas da API ---

// Salvar novo lead
app.post('/api/leads', (req, res) => {
  const { nome, whatsapp, email } = req.body;

  if (!nome || !whatsapp || !email) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }

  const leads = readLeads();
  leads.push({
    nome: nome.trim(),
    whatsapp: whatsapp.trim(),
    email: email.trim().toLowerCase(),
    data: new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  });
  writeLeads(leads);

  res.json({ message: 'Interesse registrado com sucesso!' });
});

// Login admin
app.post('/api/admin/login', (req, res) => {
  const { senha } = req.body;

  if (!senha || !bcrypt.compareSync(senha, passwordHash)) {
    return res.status(401).json({ error: 'Senha incorreta' });
  }

  const token = crypto.randomUUID();
  activeSessions.set(token, { createdAt: Date.now() });

  res.json({ token });
});

// Logout admin
app.post('/api/admin/logout', authMiddleware, (req, res) => {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  activeSessions.delete(token);
  res.json({ message: 'Logout realizado' });
});

// Listar leads (protegido)
app.get('/api/admin/leads', authMiddleware, (req, res) => {
  const leads = readLeads();
  res.json(leads);
});

// Excluir lead (protegido)
app.delete('/api/admin/leads/:index', authMiddleware, (req, res) => {
  const index = parseInt(req.params.index, 10);
  const leads = readLeads();

  if (index < 0 || index >= leads.length) {
    return res.status(404).json({ error: 'Lead não encontrado' });
  }

  leads.splice(index, 1);
  writeLeads(leads);

  res.json({ message: 'Lead excluído' });
});

// Limpar sessões expiradas a cada 30 minutos
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of activeSessions) {
    if (now - session.createdAt > 2 * 60 * 60 * 1000) { // 2 horas
      activeSessions.delete(token);
    }
  }
}, 30 * 60 * 1000);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  console.log(`Painel admin: http://localhost:${PORT}/admin.html`);
});
