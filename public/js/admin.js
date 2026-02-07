// ========================================
// ESTADO
// ========================================
let token = sessionStorage.getItem('admin_token') || null;

const loginSection = document.getElementById('loginSection');
const panelSection = document.getElementById('panelSection');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const leadsContainer = document.getElementById('leadsContainer');
const leadsCount = document.getElementById('leadsCount');

// Se já tem token, tentar ir direto para o painel
if (token) {
  showPanel();
}

// ========================================
// LOGIN
// ========================================
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.style.display = 'none';

  const senha = document.getElementById('senha').value;

  try {
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha })
    });

    if (!res.ok) {
      loginError.style.display = 'block';
      return;
    }

    const data = await res.json();
    token = data.token;
    sessionStorage.setItem('admin_token', token);
    showPanel();
  } catch {
    loginError.textContent = 'Erro de conexão';
    loginError.style.display = 'block';
  }
});

// ========================================
// PAINEL
// ========================================
function showPanel() {
  loginSection.style.display = 'none';
  panelSection.style.display = 'block';
  loadLeads();
}

async function loadLeads() {
  try {
    const res = await fetch('/api/admin/leads', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.status === 401) {
      logout();
      return;
    }

    const leads = await res.json();
    renderLeads(leads);
  } catch {
    leadsContainer.innerHTML = '<p style="color: var(--text-muted);">Erro ao carregar leads.</p>';
  }
}

function renderLeads(leads) {
  leadsCount.textContent = `${leads.length} lead${leads.length !== 1 ? 's' : ''} registrado${leads.length !== 1 ? 's' : ''}`;

  if (leads.length === 0) {
    leadsContainer.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
          <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 00-3-3.87"/>
          <path d="M16 3.13a4 4 0 010 7.75"/>
        </svg>
        <h3>Nenhum lead ainda</h3>
        <p>Os contatos do formulário aparecerão aqui.</p>
      </div>
    `;
    return;
  }

  const rows = leads.map((lead, index) => `
    <tr>
      <td class="lead-name">${escapeHtml(lead.nome)}</td>
      <td class="lead-whatsapp">
        <a href="https://wa.me/55${lead.whatsapp.replace(/\D/g, '')}" target="_blank" rel="noopener">
          ${escapeHtml(lead.whatsapp)}
        </a>
      </td>
      <td>${escapeHtml(lead.email)}</td>
      <td>${escapeHtml(lead.data)}</td>
      <td>
        <button class="btn-delete" onclick="deleteLead(${index})" title="Excluir">
          Excluir
        </button>
      </td>
    </tr>
  `).join('');

  leadsContainer.innerHTML = `
    <table class="leads-table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>WhatsApp</th>
          <th>E-mail</th>
          <th>Data</th>
          <th></th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ========================================
// AÇÕES
// ========================================
async function deleteLead(index) {
  if (!confirm('Tem certeza que deseja excluir este lead?')) return;

  try {
    const res = await fetch(`/api/admin/leads/${index}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (res.ok) {
      loadLeads();
    }
  } catch {
    alert('Erro ao excluir lead.');
  }
}

function logout() {
  fetch('/api/admin/logout', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  }).catch(() => {});

  token = null;
  sessionStorage.removeItem('admin_token');
  loginSection.style.display = '';
  panelSection.style.display = 'none';
  document.getElementById('senha').value = '';
  loginError.style.display = 'none';
}

function exportCSV() {
  fetch('/api/admin/leads', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
    .then(res => res.json())
    .then(leads => {
      if (leads.length === 0) {
        alert('Nenhum lead para exportar.');
        return;
      }

      const header = 'Nome,WhatsApp,Email,Data';
      const rows = leads.map(l =>
        `"${l.nome}","${l.whatsapp}","${l.email}","${l.data}"`
      );
      const csv = [header, ...rows].join('\n');

      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads_droneview_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    })
    .catch(() => alert('Erro ao exportar.'));
}

// ========================================
// UTILIDADES
// ========================================
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========================================
// EVENT LISTENERS
// ========================================
document.getElementById('btnRefresh').addEventListener('click', loadLeads);
document.getElementById('btnExport').addEventListener('click', exportCSV);
document.getElementById('btnLogout').addEventListener('click', logout);
