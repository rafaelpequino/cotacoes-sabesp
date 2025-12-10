// Página de Serviços - CRUD funcional

let servicosCrud = new CrudManager('services');
let servicosData = [];

// Carregar dados ao iniciar página
document.addEventListener('DOMContentLoaded', async () => {
    await loadServicos();
    setupEventListeners();
});

async function loadServicos() {
    try {
        servicosData = await servicosCrud.loadAll();
        renderServicosTable(servicosData);
    } catch (error) {
        console.error('Erro ao carregar serviços:', error);
    }
}

function renderServicosTable(servicos) {
    const tbody = document.querySelector('.servicos-table table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (servicos.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="8" style="text-align: center; color: #999; padding: 20px;">Nenhum serviço cadastrado. Crie um novo!</td>';
        tbody.appendChild(row);
        return;
    }

    servicos.forEach(servico => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${servico.originalId}</td>
            <td>${new Date(servico.createdAt).toLocaleDateString('pt-BR')}</td>
            <td>${servico.item}</td>
            <td>${servico.unit}</td>
            <td>R$ ${parseFloat(servico.precoAdotado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>R$ ${parseFloat(servico.precoAdotado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>Você</td>
            <td class="actions">
                <button class="action-btn" title="Visualizar" onclick="viewServico(${servico.id})">👁</button>
                <button class="action-btn" title="Editar" onclick="editServico(${servico.id})">✏️</button>
                <button class="action-btn" title="Excluir" onclick="deleteServico(${servico.id})">🗑</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupEventListeners() {
    const btnNovaCotacao = document.querySelector('.btn-nova-cotacao');
    if (btnNovaCotacao) {
        btnNovaCotacao.addEventListener('click', openCreateModal);
    }

    // Form de criar
    const createForm = document.getElementById('createModal')?.querySelector('form');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveServico();
        });
    }

    // Form de editar
    const editForm = document.getElementById('editModal')?.querySelector('form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateServico();
        });
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

async function saveServico() {
    const modal = document.getElementById('createModal');
    const inputs = modal.querySelectorAll('input[type="text"], input[type="number"], textarea');

    const data = {
        originalId: inputs[0]?.value,
        item: inputs[1]?.value,
        unit: inputs[2]?.value,
        priceFornecedor: parseFloat(inputs[3]?.value || 0),
        precoMontagem: parseFloat(inputs[4]?.value || 0),
        precoAdotado: parseFloat(inputs[5]?.value || 0),
        mediaAdotada: parseFloat(inputs[6]?.value || null),
        mediaSaneada: parseFloat(inputs[7]?.value || null),
        menorValor: parseFloat(inputs[8]?.value || null),
        mediaAritmetica: parseFloat(inputs[9]?.value || null),
        mediana: parseFloat(inputs[10]?.value || null),
        empresa1: parseFloat(inputs[11]?.value || null),
        empresa2: parseFloat(inputs[12]?.value || null),
        empresa3: parseFloat(inputs[13]?.value || null),
        empresa4: parseFloat(inputs[14]?.value || null),
        empresa5: parseFloat(inputs[15]?.value || null),
        empresa6: parseFloat(inputs[16]?.value || null),
        justificativa: inputs[17]?.value,
        tempoPassado: parseInt(inputs[18]?.value || 0),
        mesAnterior: inputs[19]?.value,
        indiceAnterior: parseFloat(inputs[20]?.value || null),
        indiceAtual: parseFloat(inputs[21]?.value || null)
    };

    try {
        await servicosCrud.create(data);
        closeCreateModal();
        await loadServicos();
        modal.querySelector('form').reset();
    } catch (error) {
        console.error('Erro ao salvar:', error);
    }
}

function editServico(id) {
    const servico = servicosData.find(s => s.id === id);
    if (!servico) return;

    const modal = document.getElementById('editModal');
    const inputs = modal.querySelectorAll('input[type="text"], input[type="number"], textarea');

    inputs[0].value = servico.originalId;
    inputs[1].value = servico.item;
    inputs[2].value = servico.unit;
    inputs[3].value = servico.priceFornecedor;
    inputs[4].value = servico.precoMontagem;
    inputs[5].value = servico.precoAdotado;
    inputs[6].value = servico.mediaAdotada || '';
    inputs[7].value = servico.mediaSaneada || '';
    inputs[8].value = servico.menorValor || '';
    inputs[9].value = servico.mediaAritmetica || '';
    inputs[10].value = servico.mediana || '';
    inputs[11].value = servico.empresa1 || '';
    inputs[12].value = servico.empresa2 || '';
    inputs[13].value = servico.empresa3 || '';
    inputs[14].value = servico.empresa4 || '';
    inputs[15].value = servico.empresa5 || '';
    inputs[16].value = servico.empresa6 || '';
    inputs[17].value = servico.justificativa || '';
    inputs[18].value = servico.tempoPassado || '';
    inputs[19].value = servico.mesAnterior || '';
    inputs[20].value = servico.indiceAnterior || '';
    inputs[21].value = servico.indiceAtual || '';

    // Armazenar ID para update
    modal.dataset.servicoId = id;
    modal.style.display = 'flex';
}

async function updateServico() {
    const modal = document.getElementById('editModal');
    const servicoId = modal.dataset.servicoId;
    const inputs = modal.querySelectorAll('input[type="text"], input[type="number"], textarea');

    const data = {
        originalId: inputs[0]?.value,
        item: inputs[1]?.value,
        unit: inputs[2]?.value,
        priceFornecedor: parseFloat(inputs[3]?.value || 0),
        precoMontagem: parseFloat(inputs[4]?.value || 0),
        precoAdotado: parseFloat(inputs[5]?.value || 0),
        mediaAdotada: parseFloat(inputs[6]?.value || null),
        mediaSaneada: parseFloat(inputs[7]?.value || null),
        menorValor: parseFloat(inputs[8]?.value || null),
        mediaAritmetica: parseFloat(inputs[9]?.value || null),
        mediana: parseFloat(inputs[10]?.value || null),
        empresa1: parseFloat(inputs[11]?.value || null),
        empresa2: parseFloat(inputs[12]?.value || null),
        empresa3: parseFloat(inputs[13]?.value || null),
        empresa4: parseFloat(inputs[14]?.value || null),
        empresa5: parseFloat(inputs[15]?.value || null),
        empresa6: parseFloat(inputs[16]?.value || null),
        justificativa: inputs[17]?.value,
        tempoPassado: parseInt(inputs[18]?.value || 0),
        mesAnterior: inputs[19]?.value,
        indiceAnterior: parseFloat(inputs[20]?.value || null),
        indiceAtual: parseFloat(inputs[21]?.value || null)
    };

    try {
        await servicosCrud.update(servicoId, data);
        closeEditModal();
        await loadServicos();
    } catch (error) {
        console.error('Erro ao atualizar:', error);
    }
}

async function deleteServico(id) {
    const deleted = await servicosCrud.delete(id);
    if (deleted) {
        await loadServicos();
    }
}

function viewServico(id) {
    const servico = servicosData.find(s => s.id === id);
    if (!servico) return;

    // Preencher modal de visualização
    const modal = document.getElementById('viewModal');
    // ... (implementar preenchimento do modal de visualização)
    modal.style.display = 'flex';
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) modal.style.display = 'none';
}

// Fechar modais ao clicar fora
window.addEventListener('click', function(event) {
    const createModal = document.getElementById('createModal');
    const editModal = document.getElementById('editModal');
    const viewModal = document.getElementById('viewModal');

    if (event.target === createModal) closeCreateModal();
    if (event.target === editModal) closeEditModal();
    if (event.target === viewModal) closeViewModal();
});

// Fechar com ESC
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeCreateModal();
        closeEditModal();
        closeViewModal();
    }
});

