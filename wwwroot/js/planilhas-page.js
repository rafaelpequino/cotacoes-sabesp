// Página de Planilhas - CRUD funcional

let planilhasCrud = new CrudManager('spreadsheets');
let planilhasData = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadPlanilhas();
    setupEventListeners();
});

async function loadPlanilhas() {
    try {
        planilhasData = await planilhasCrud.loadAll();
        renderPlanilhasTable(planilhasData);
    } catch (error) {
        console.error('Erro ao carregar planilhas:', error);
    }
}

function renderPlanilhasTable(planilhas) {
    const tbody = document.querySelector('.servicos-table table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (planilhas.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center; color: #999; padding: 20px;">Nenhuma planilha cadastrada. Crie uma nova!</td>';
        tbody.appendChild(row);
        return;
    }

    planilhas.forEach(planilha => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${planilha.name}</td>
            <td>Você</td>
            <td class="actions">
                <button class="action-btn" title="Deletar" onclick="deletePlanilha(${planilha.id})">🗑</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupEventListeners() {
    const btnNovaPlanilha = document.querySelector('.btn-nova-cotacao');
    if (btnNovaPlanilha) {
        btnNovaPlanilha.addEventListener('click', openUploadModal);
    }
}

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        // Se não existir o modal de upload, criar um simples
        alert('Funcionalidade de upload de planilhas em desenvolvimento');
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) modal.style.display = 'none';
}

async function deletePlanilha(id) {
    const deleted = await planilhasCrud.delete(id);
    if (deleted) {
        await loadPlanilhas();
    }
}

window.addEventListener('click', function(event) {
    const uploadModal = document.getElementById('uploadModal');
    if (event.target === uploadModal) closeUploadModal();
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeUploadModal();
    }
});

