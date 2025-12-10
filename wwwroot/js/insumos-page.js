// Página de Insumos - CRUD funcional
// Similar ao servicos-page.js mas para inputs

let insumosCrud = new CrudManager('inputs');
let insumosData = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadInsumos();
    setupEventListeners();
});

async function loadInsumos() {
    try {
        insumosData = await insumosCrud.loadAll();
        renderInsumosTable(insumosData);
    } catch (error) {
        console.error('Erro ao carregar insumos:', error);
    }
}

function renderInsumosTable(insumos) {
    const tbody = document.querySelector('.servicos-table table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (insumos.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" style="text-align: center; color: #999; padding: 20px;">Nenhum insumo cadastrado. Crie um novo!</td>';
        tbody.appendChild(row);
        return;
    }

    insumos.forEach(insumo => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${insumo.originalId}</td>
            <td>${new Date(insumo.createdAt).toLocaleDateString('pt-BR')}</td>
            <td>${insumo.item}</td>
            <td>${insumo.unit}</td>
            <td>R$ ${parseFloat(insumo.precoAdotado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>R$ ${parseFloat(insumo.precoAdotado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>Você</td>
            <td class="actions">
                <button class="action-btn" title="Visualizar" onclick="viewInsumo(${insumo.id})">👁</button>
                <button class="action-btn" title="Editar" onclick="editInsumo(${insumo.id})">✏️</button>
                <button class="action-btn" title="Excluir" onclick="deleteInsumo(${insumo.id})">🗑</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupEventListeners() {
    const btnNovoInsumo = document.querySelector('.btn-nova-cotacao');
    if (btnNovoInsumo) {
        btnNovoInsumo.addEventListener('click', openCreateModal);
    }
}

function openCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) modal.style.display = 'flex';
}

function closeCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) modal.style.display = 'none';
}

async function editInsumo(id) {
    const insumo = insumosData.find(i => i.id === id);
    if (!insumo) return;

    const modal = document.getElementById('editModal');
    const inputs = modal.querySelectorAll('input, textarea');

    // Preencher campos (similar ao servicos)
    inputs[0].value = insumo.originalId;
    inputs[1].value = insumo.item;
    inputs[2].value = insumo.unit;
    
    modal.dataset.insumoId = id;
    modal.style.display = 'flex';
}

async function deleteInsumo(id) {
    const deleted = await insumosCrud.delete(id);
    if (deleted) {
        await loadInsumos();
    }
}

function viewInsumo(id) {
    const modal = document.getElementById('viewModal');
    if (modal) modal.style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) modal.style.display = 'none';
}

window.addEventListener('click', function(event) {
    const createModal = document.getElementById('createModal');
    const editModal = document.getElementById('editModal');
    const viewModal = document.getElementById('viewModal');

    if (event.target === createModal) closeCreateModal();
    if (event.target === editModal) closeEditModal();
    if (event.target === viewModal) closeViewModal();
});

document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCreateModal();
        closeEditModal();
        closeViewModal();
    }
});

