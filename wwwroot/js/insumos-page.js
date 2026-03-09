// Página de Insumos - CRUD funcional
// Similar ao servicos-page.js mas para inputs

let insumosCrud = new CrudManager('inputs');
let insumosPageData = [];
let sectorsData = [];
let usersData = [];
let currentUserId = null;

/**
 * Calcula automaticamente o status com base nas informações preenchidas.
 * - Se statusAtual === 'Cancelada', mantém Cancelada.
 * - Se todos os campos essenciais preenchidos e precoAdotado > 0 → Concluída
 * - Caso contrário → Pendente
 */
function calcularAutoStatus(dados, statusAtual) {
    if (statusAtual === 'Cancelada') return 'Cancelada';
    const completo =
        dados.originalId && dados.originalId.trim() !== '' &&
        dados.item && dados.item.trim() !== '' &&
        dados.unit && dados.unit.trim() !== '' &&
        parseFloat(dados.precoAdotado || 0) > 0;
    return completo ? 'Concluída' : 'Pendente';
}

// Função para humanizar erros
function humanizeError(errorMessage) {
    const errorMap = {
        'Ocorreu um erro ao processar sua requisição': 'Houve um problema ao processar sua solicitação. Tente novamente.',
        'não encontrado': 'O item não foi encontrado.',
        'já existe': 'Este item já existe no sistema.',
        'campo obrigatório': 'Verifique se todos os campos obrigatórios foram preenchidos.',
        'inválido': 'Os dados fornecidos são inválidos.',
        'Erro 400': 'Verifique os dados fornecidos.',
        'Erro 401': 'Sua sessão expirou. Por favor, faça login novamente.',
        'Erro 403': 'Você não tem permissão para realizar esta ação.',
        'Erro 404': 'O recurso solicitado não foi encontrado.',
        'Erro 500': 'Erro no servidor. Tente novamente mais tarde.'
    };

    for (const [pattern, translation] of Object.entries(errorMap)) {
        if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
            return translation;
        }
    }

    return errorMessage || 'Ocorreu um erro desconhecido. Por favor, tente novamente.';
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadSectors();
    await loadUsers();
    await loadInsumos();
    setupEventListeners();
    setupIntencaoForm();
});

async function loadSectors() {
    try {
        sectorsData = await api.getSectors();
    } catch (error) {
        sectorsData = [];
        console.error('Erro ao carregar setores:', error);
    }
}

async function loadUsers() {
    try {
        usersData = await api.getUsers();
        // Obter ID do usuário logado
        const currentUser = await api.getCurrentUser();
        if (currentUser) {
            currentUserId = currentUser.id;
        }
    } catch (error) {
        usersData = [];
        console.error('Erro ao carregar usuários:', error);
    }
}

async function loadInsumos() {
    try {
        insumosPageData = await api.getInputs();
        renderInsumosTable(insumosPageData);
    } catch (error) {
        insumosPageData = [];
        renderInsumosTable([]);
    }
}

function renderInsumosTable(insumos) {
    const table = document.getElementById('insumosTableElement');
    const emptyMessage = document.getElementById('emptyMessage');
    const tbody = table ? table.querySelector('tbody') : null;
    
    if (!table || !emptyMessage || !tbody) {
        return;
    }

    tbody.innerHTML = '';

    if (!insumos || insumos.length === 0) {
        table.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyMessage.style.display = 'none';

    insumos.forEach(insumo => {
        const sectorName = sectorsData.find(s => s.id === insumo.sectorId)?.name || 'N/A';
        const responsibleUser = usersData.find(u => u.id === insumo.userId);
        const responsibleName = responsibleUser ? responsibleUser.name : 'N/A';
        const isOwner = currentUserId === insumo.userId;
        const row = document.createElement('tr');

        // Badge de status + botão de ação (apenas para o dono)
        const statusKey = (insumo.status || 'Concluída').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const statusLabel = insumo.status || 'Concluída';
        const isCancelada = statusLabel === 'Cancelada';
        let statusHtml;
        if (isOwner) {
            if (isCancelada) {
                statusHtml = `<span class="status-badge cancelada">${statusLabel}</span> <button class="action-btn-status" title="Reativar cotação" onclick="changeStatusInsumo(${insumo.id}, 'reativar', this)">↩</button>`;
            } else {
                statusHtml = `<span class="status-badge ${statusKey}">${statusLabel}</span> <button class="action-btn-status btn-cancelar-status" title="Cancelar cotação" onclick="changeStatusInsumo(${insumo.id}, 'Cancelada', this)">🚫</button>`;
            }
        } else {
            statusHtml = `<span class="status-badge ${statusKey}">${statusLabel}</span>`;
        }

        // Botões de editar e deletar apenas aparecem se for o dono
        const editDeleteButtons = isOwner ? `
                <button class="action-btn" title="Editar" onclick="editInsumo(${insumo.id})">✏️</button>
                <button class="action-btn" title="Excluir" onclick="deleteInsumo(${insumo.id})">🗑</button>
            ` : '';

        // Ocultar preços para itens com status Pendente
        const isPendente = insumo.status === 'Pendente';
        const precoMontagemTd = isPendente ? '-' : `R$ ${parseFloat(insumo.precoMontagem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const precoAdotadoTd  = isPendente ? '-' : `R$ ${parseFloat(insumo.precoAdotado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        row.innerHTML = `
            <td>${insumo.originalId || '-'}</td>
            <td>${sectorName}</td>
            <td>${insumo.item}</td>
            <td>${insumo.unit || '-'}</td>
            <td>${precoMontagemTd}</td>
            <td>${precoAdotadoTd}</td>
            <td>${responsibleName}</td>
            <td>${statusHtml}</td>
            <td class="actions">
                <button class="action-btn" title="Copiar dados" onclick="copyInsumo(${insumo.id})">📋</button>
                <button class="action-btn" title="Visualizar" onclick="viewInsumo(${insumo.id})">👁</button>
                ${editDeleteButtons}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupEventListeners() {
    const btnNovoInsumo = document.querySelector('.btn-criar-individual');
    if (btnNovoInsumo) {
        btnNovoInsumo.addEventListener('click', openCreateModal);
    }

    // Form de criar
    const createForm = document.getElementById('createModal')?.querySelector('form');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveInsumo();
        });
    }

    // Form de editar
    const editForm = document.getElementById('editModal')?.querySelector('form');
    if (editForm) {
        editForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await updateInsumo();
        });
    }

    // Configurar filtros
    setupFilterListeners();
}

function setupFilterListeners() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const sectorFilterSelect = document.getElementById('sectorFilterSelect');
    const responsibleFilterSelect = document.getElementById('responsibleFilterSelect');
    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnLimpar = document.getElementById('btnLimpar');

    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', applyFilters);
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', clearFilters);
    }

    // Ordenação dispara requisição automaticamente
    if (sortSelect) {
        sortSelect.addEventListener('change', applyFilters);
    }
    
    // Filtro de setor dispara requisição automaticamente
    if (sectorFilterSelect) {
        sectorFilterSelect.addEventListener('change', applyFilters);
    }

    // Filtro de responsável dispara requisição automaticamente
    if (responsibleFilterSelect) {
        responsibleFilterSelect.addEventListener('change', applyFilters);
    }

    // Normalizar texto de busca (regras iguais às dos campos de inserção)
    if (searchInput && typeof aplicarMaiuscula === 'function') {
        searchInput.addEventListener('input', () => {
            aplicarMaiuscula(searchInput);
        });
    }

    // Permitir busca ao digitar (Enter)
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
    
    // Popular o select de setores do filtro
    populateSectorFilter();
    
    // Popular o select de responsáveis do filtro
    populateResponsibleFilter();
}

async function populateSectorFilter() {
    const sectorFilterSelect = document.getElementById('sectorFilterSelect');
    if (!sectorFilterSelect) return;
    
    try {
        const sectors = await api.getSectors();
        
        // Limpar opções existentes (exceto "Todos os Setores")
        sectorFilterSelect.innerHTML = '<option value="">Todos os Setores</option>';
        
        // Adicionar setores
        sectors.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector.id;
            option.textContent = sector.name;
            sectorFilterSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Erro ao carregar setores para filtro:', error);
    }
}

async function populateResponsibleFilter() {
    const responsibleFilterSelect = document.getElementById('responsibleFilterSelect');
    if (!responsibleFilterSelect) return;
    
    try {
        // Limpar opções existentes
        responsibleFilterSelect.innerHTML = '<option value="">Todos os Responsáveis</option>';
        
        // Adicionar o usuário logado como primeira opção com label "Eu"
        if (currentUserId) {
            const option = document.createElement('option');
            option.value = currentUserId;
            option.textContent = 'Eu';
            responsibleFilterSelect.appendChild(option);
        }
        
        // Adicionar outros usuários
        usersData.forEach(user => {
            if (user.id !== currentUserId) {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = user.name;
                responsibleFilterSelect.appendChild(option);
            }
        });
    } catch (error) {
        console.error('Erro ao carregar responsáveis para filtro:', error);
    }
}

async function applyFilters() {
    const rawSearch = document.getElementById('searchInput')?.value || '';
    const search = typeof converterMaiuscula === 'function'
        ? converterMaiuscula(rawSearch)
        : rawSearch;
    const sort = document.getElementById('sortSelect')?.value || '';
    const sectorId = document.getElementById('sectorFilterSelect')?.value || '';
    const responsibleId = document.getElementById('responsibleFilterSelect')?.value || '';

    try {
        // Filtrar localmente por setor se selecionado
        let filteredData = await api.getInputs(search || null, sort || null, null);
        
        if (sectorId) {
            filteredData = filteredData.filter(item => item.sectorId === parseInt(sectorId));
        }

        if (responsibleId) {
            filteredData = filteredData.filter(item => item.userId === parseInt(responsibleId));
        }
        
        insumosPageData = filteredData;
        renderInsumosTable(insumosPageData);
        updateSearchIndicator(search);
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro ao Filtrar',
            text: humanizeError(error.message),
            confirmButtonColor: '#d32f2f'
        });
    }
}

function updateSearchIndicator(searchText) {
    const indicator = document.getElementById('searchIndicator');
    const searchTextElement = document.getElementById('searchText');
    
    if (searchText && searchText.trim()) {
        searchTextElement.textContent = searchText;
        indicator.style.display = 'block';
    } else {
        indicator.style.display = 'none';
    }
}

function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('sortSelect').value = '';
    document.getElementById('sectorFilterSelect').value = '';
    document.getElementById('responsibleFilterSelect').value = '';
    document.getElementById('searchIndicator').style.display = 'none';
    loadInsumos();
}

function openCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) {
        populateSectorSelect(modal);
        modal.style.display = 'flex';
        // Limpar anexos pendentes
        if (typeof pendingAttachments !== 'undefined') {
            pendingAttachments = [];
            if (typeof renderPendingAttachments !== 'undefined') {
                renderPendingAttachments('create');
            }
        }
    }
}

function populateSectorSelect(modal) {
    const selects = modal.querySelectorAll('select[name="sectorId"]');
    selects.forEach(select => {
        // Limpar opções existentes (exceto a primeira)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Adicionar setores
        sectorsData.forEach(sector => {
            const option = document.createElement('option');
            option.value = sector.id;
            option.textContent = sector.name;
            select.appendChild(option);
        });
    });
}

function closeCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) modal.style.display = 'none';
}

async function saveInsumo() {
    const modal = document.getElementById('createModal');
    const form = modal.querySelector('form');
    
    // Obter sectorId
    const sectorSelect = form.querySelector('select[name="sectorId"]');
    const sectorId = sectorSelect ? parseInt(sectorSelect.value) : null;
    
    // Obter valores de forma mais precisa baseado na estrutura do HTML
    const originalId = form.querySelector('input[placeholder="Ex: JAN/00"]')?.value || '';
    const item = form.querySelector('input[placeholder="DESCRIÇÃO DO ITEM"]')?.value || '';
    const unit = form.querySelector('input[placeholder="Ex: Un., m², Kg"]')?.value || '';
    
    // Validação básica
    if (!sectorId || !originalId || !item || !unit) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Campos obrigatórios',
            text: 'Por favor, preencha os campos obrigatórios (Setor, I0 Original, Item, Unidade)',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Obter todos os inputs de número
    const numberInputs = form.querySelectorAll('input[type="number"]');
    
    // Helper para converter valor numérico
    const toNumber = (value, defaultValue = null) => {
        if (!value || value === '') return defaultValue;
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    };
    
    const data = {
        sectorId: sectorId,
        originalId: originalId,
        item: item,
        unit: unit,
        priceFornecedor: toNumber(numberInputs[0]?.value, 0),
        precoMontagem: toNumber(numberInputs[1]?.value, 0),
        precoAdotado: toNumber(numberInputs[2]?.value, 0),
        mediaAdotada: toNumber(numberInputs[3]?.value),
        mediaSaneada: toNumber(numberInputs[4]?.value),
        menorValor: toNumber(numberInputs[5]?.value),
        mediaAritmetica: toNumber(numberInputs[6]?.value),
        mediana: toNumber(numberInputs[7]?.value),
        nomeEmpresa1: form.querySelector('input[name="nomeEmpresa1"]')?.value || null,
        empresa1: toNumber(numberInputs[8]?.value),
        nomeEmpresa2: form.querySelector('input[name="nomeEmpresa2"]')?.value || null,
        empresa2: toNumber(numberInputs[9]?.value),
        nomeEmpresa3: form.querySelector('input[name="nomeEmpresa3"]')?.value || null,
        empresa3: toNumber(numberInputs[10]?.value),
        nomeEmpresa4: form.querySelector('input[name="nomeEmpresa4"]')?.value || null,
        empresa4: toNumber(numberInputs[11]?.value),
        nomeEmpresa5: form.querySelector('input[name="nomeEmpresa5"]')?.value || null,
        empresa5: toNumber(numberInputs[12]?.value),
        nomeEmpresa6: form.querySelector('input[name="nomeEmpresa6"]')?.value || null,
        empresa6: toNumber(numberInputs[13]?.value),
        justificativa: form.querySelector('textarea')?.value || '',
        status: '' // será preenchido abaixo
    };
    // Auto-calcular status com base nos dados preenchidos
    data.status = calcularAutoStatus(data, null);

    try {
        const result = await api.createInput(data);
        
        // Fazer upload dos anexos pendentes
        if (typeof uploadPendingAttachments !== 'undefined' && typeof pendingAttachments !== 'undefined' && pendingAttachments.length > 0) {
            try {
                await uploadPendingAttachments('Input', result.id);
            } catch (uploadError) {
                console.error('Erro ao fazer upload de anexos:', uploadError);
                // Continua mesmo se houver erro no upload
            }
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Insumo criado com sucesso!',
            confirmButtonColor: '#13d0ff'
        }).then(() => {
            closeCreateModal();
            form.reset();
            // Limpar anexos pendentes
            if (typeof pendingAttachments !== 'undefined') {
                pendingAttachments = [];
                if (typeof renderPendingAttachments !== 'undefined') {
                    renderPendingAttachments('create');
                }
            }
            // Recarregar insumos após fechar modal
            loadInsumos();
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Erro ao criar insumo: ' + (error.message || 'Erro desconhecido'),
            confirmButtonColor: '#ff4444'
        });
    }
}

async function editInsumo(id) {
    const insumo = insumosPageData.find(i => i.id === id);
    if (!insumo) {
        Swal.fire({
            icon: 'error',
            title: '❌ Erro',
            text: 'Insumo não encontrado',
            confirmButtonText: 'OK'
        });
        return;
    }

    const modal = document.getElementById('editModal');
    const form = modal.querySelector('form');
    
    // Popular dropdown de setores
    populateSectorSelect(modal);
    
    // Selecionar o setor correto
    const sectorSelect = form.querySelector('select[name="sectorId"]');
    if (sectorSelect) sectorSelect.value = insumo.sectorId;
    
    // Preencher campos de texto (I0, Item, Unidade) — via placeholder para evitar problemas de índice
    const io0Input = form.querySelector('input[placeholder="Ex: JAN/00"]');
    const itemInput = form.querySelector('input[placeholder="DESCRIÇÃO DO ITEM"]');
    const unitInput = form.querySelector('input[placeholder="Ex: Un., m², Kg"]');
    if (io0Input) io0Input.value = insumo.originalId || '';
    if (itemInput) itemInput.value = insumo.item || '';
    if (unitInput) unitInput.value = insumo.unit || '';
    
    // Preencher nomes das empresas
    form.querySelector('input[name="nomeEmpresa1"]').value = insumo.nomeEmpresa1 || '';
    form.querySelector('input[name="nomeEmpresa2"]').value = insumo.nomeEmpresa2 || '';
    form.querySelector('input[name="nomeEmpresa3"]').value = insumo.nomeEmpresa3 || '';
    form.querySelector('input[name="nomeEmpresa4"]').value = insumo.nomeEmpresa4 || '';
    form.querySelector('input[name="nomeEmpresa5"]').value = insumo.nomeEmpresa5 || '';
    form.querySelector('input[name="nomeEmpresa6"]').value = insumo.nomeEmpresa6 || '';
    
    // Preencher campos de número
    const numberInputs = form.querySelectorAll('input[type="number"]');
    numberInputs[0].value = insumo.priceFornecedor || '';
    numberInputs[1].value = insumo.precoMontagem || '';
    numberInputs[2].value = insumo.precoAdotado || '';
    numberInputs[3].value = insumo.mediaAdotada || '';
    numberInputs[4].value = insumo.mediaSaneada || '';
    numberInputs[5].value = insumo.menorValor || '';
    numberInputs[6].value = insumo.mediaAritmetica || '';
    numberInputs[7].value = insumo.mediana || '';
    numberInputs[8].value = insumo.empresa1 || '';
    numberInputs[9].value = insumo.empresa2 || '';
    numberInputs[10].value = insumo.empresa3 || '';
    numberInputs[11].value = insumo.empresa4 || '';
    numberInputs[12].value = insumo.empresa5 || '';
    numberInputs[13].value = insumo.empresa6 || '';
    
    // Preencher textarea
    const textarea = form.querySelector('textarea');
    if (textarea) textarea.value = insumo.justificativa || '';

    // Preencher Status (checkbox de cancelar + badge informativo)
    const cancelarCheck = document.getElementById('editCancelarCheck');
    const statusDisplay = document.getElementById('editStatusDisplay');
    if (cancelarCheck) {
        cancelarCheck.checked = insumo.status === 'Cancelada';
    }
    if (statusDisplay) {
        const sk = (insumo.status || 'Pendente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        statusDisplay.innerHTML = `<span class="status-badge ${sk}">${insumo.status || 'Pendente'}</span>`;
    }

    // Armazenar ID para update
    modal.dataset.insumoId = id;
    modal.style.display = 'flex';
    
    // Carregar e renderizar anexos
    if (typeof loadAttachments !== 'undefined' && typeof renderEditAttachments !== 'undefined') {
        loadAttachments('Input', id).then(() => {
            pendingAttachments = [];
            renderEditAttachments();
        });
    }
}

async function updateInsumo() {
    const modal = document.getElementById('editModal');
    const insumoId = modal.dataset.insumoId;
    const form = modal.querySelector('form');
    
    if (!insumoId) {
        Swal.fire({
            icon: 'error',
            title: '❌ Erro',
            text: 'ID do insumo não encontrado',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Obter sectorId
    const sectorSelect = form.querySelector('select[name="sectorId"]');
    const sectorId = sectorSelect ? parseInt(sectorSelect.value) : null;
    
    // Obter valores de forma mais precisa baseado na estrutura do HTML
    const originalId = form.querySelector('input[placeholder="Ex: JAN/00"]')?.value || '';
    const item = form.querySelector('input[placeholder="DESCRIÇÃO DO ITEM"]')?.value || '';
    const unit = form.querySelector('input[placeholder="Ex: Un., m², Kg"]')?.value || '';
    
    // Validação básica
    if (!sectorId || !originalId || !item || !unit) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Campos obrigatórios',
            text: 'Por favor, preencha os campos obrigatórios (Setor, I0 Original, Item, Unidade)',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Obter todos os inputs de número
    const numberInputs = form.querySelectorAll('input[type="number"]');
    
    // Helper para converter valor numérico
    const toNumber = (value, defaultValue = null) => {
        if (!value || value === '') return defaultValue;
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    };
    
    const cancelarCheck = document.getElementById('editCancelarCheck');
    const isCancelar = cancelarCheck?.checked || false;
    const data = {
        sectorId: sectorId,
        originalId: originalId,
        item: item,
        unit: unit,
        priceFornecedor: toNumber(numberInputs[0]?.value, 0),
        precoMontagem: toNumber(numberInputs[1]?.value, 0),
        precoAdotado: toNumber(numberInputs[2]?.value, 0),
        mediaAdotada: toNumber(numberInputs[3]?.value),
        mediaSaneada: toNumber(numberInputs[4]?.value),
        menorValor: toNumber(numberInputs[5]?.value),
        mediaAritmetica: toNumber(numberInputs[6]?.value),
        mediana: toNumber(numberInputs[7]?.value),
        nomeEmpresa1: form.querySelector('input[name="nomeEmpresa1"]')?.value || null,
        empresa1: toNumber(numberInputs[8]?.value),
        nomeEmpresa2: form.querySelector('input[name="nomeEmpresa2"]')?.value || null,
        empresa2: toNumber(numberInputs[9]?.value),
        nomeEmpresa3: form.querySelector('input[name="nomeEmpresa3"]')?.value || null,
        empresa3: toNumber(numberInputs[10]?.value),
        nomeEmpresa4: form.querySelector('input[name="nomeEmpresa4"]')?.value || null,
        empresa4: toNumber(numberInputs[11]?.value),
        nomeEmpresa5: form.querySelector('input[name="nomeEmpresa5"]')?.value || null,
        empresa5: toNumber(numberInputs[12]?.value),
        nomeEmpresa6: form.querySelector('input[name="nomeEmpresa6"]')?.value || null,
        empresa6: toNumber(numberInputs[13]?.value),
        justificativa: form.querySelector('textarea')?.value || '',
        status: '' // será preenchido abaixo
    };
    // Auto-calcular status; se marcou "cancelar", forçar Cancelada
    data.status = isCancelar ? 'Cancelada' : calcularAutoStatus(data, null);

    try {
        const result = await api.updateInput(insumoId, data);
        
        // Fazer upload dos anexos pendentes
        if (typeof uploadPendingAttachments !== 'undefined' && typeof pendingAttachments !== 'undefined' && pendingAttachments.length > 0) {
            try {
                await uploadPendingAttachments('Input', insumoId);
            } catch (uploadError) {
                console.error('Erro ao fazer upload de anexos:', uploadError);
                // Continua mesmo se houver erro no upload
            }
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Insumo atualizado com sucesso!',
            confirmButtonColor: '#13d0ff'
        }).then(() => {
            closeEditModal();
            // Limpar anexos pendentes
            if (typeof pendingAttachments !== 'undefined') {
                pendingAttachments = [];
            }
            // Recarregar insumos após fechar modal
            loadInsumos();
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Erro ao atualizar insumo: ' + (error.message || 'Erro desconhecido'),
            confirmButtonColor: '#ff4444'
        });
    }
}

async function deleteInsumo(id) {
    try {
        const deleted = await insumosCrud.delete(id);
        if (deleted) {
            await loadInsumos();
        }
    } catch (error) {
    }
}

async function copyInsumo(id) {
    const insumo = insumosPageData.find(i => i.id === id);
    if (!insumo) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Insumo não encontrado'
        });
        return;
    }

    try {
        // PRIMEIRA LINHA: Nomes das empresas
        const companyNamesLine = [
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', // 0-13: vazias
            (insumo.nomeEmpresa1 || ''),  // 14
            (insumo.nomeEmpresa2 || ''),  // 15
            (insumo.nomeEmpresa3 || ''),  // 16
            (insumo.nomeEmpresa4 || ''),  // 17
            (insumo.nomeEmpresa5 || ''),  // 18
            (insumo.nomeEmpresa6 || ''),  // 19
            ''  // 20: Justificativa (vazia)
        ].join('\t');
        
        // SEGUNDA LINHA: Valores
        const valuesLine = [
            insumo.originalId,                    // 0. I0 Original (jan/00)
            insumo.item,                          // 1. ITEM
            insumo.unit,                          // 2. Unidade
            insumo.priceFornecedor || '',         // 3. Preço Fornecedor
            insumo.precoMontagem || '',           // 4. Preço Montagem
            '',                                   // 5. COLUNA VAZIA
            insumo.precoAdotado || '',            // 6. Preço Adotado
            '',                                   // 7. COLUNA VAZIA
            insumo.mediaAdotada || '',            // 8. Média Adotada
            insumo.mediaSaneada || '',            // 9. Média Saneada
            insumo.menorValor || '',              // 10. Menor Valor
            insumo.mediaAritmetica || '',         // 11. Média Aritmética
            insumo.mediana || '',                 // 12. Mediana
            '',                                   // 13. COLUNA VAZIA
            insumo.empresa1 || '',                // 14. EMPRESA 1
            insumo.empresa2 || '',                // 15. EMPRESA 2
            insumo.empresa3 || '',                // 16. EMPRESA 3
            insumo.empresa4 || '',                // 17. EMPRESA 4
            insumo.empresa5 || '',                // 18. EMPRESA 5
            insumo.empresa6 || '',                // 19. EMPRESA 6
            insumo.justificativa || ''            // 20. Justificativa
        ].join('\t');
        
        // Juntar as duas linhas
        const clipboardData = companyNamesLine + '\n' + valuesLine;

        await navigator.clipboard.writeText(clipboardData);
        showCopyNotification();
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro ao copiar dados para área de transferência'
        });
    }
}

function showCopyNotification() {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.textContent = '✓ Dados copiados para a área de transferência';
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 2000);
}

function viewInsumo(id) {
    const insumo = insumosPageData.find(i => i.id === id);
    if (!insumo) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Insumo não encontrado'
        });
        return;
    }

    // Preencher modal de visualização com os dados do insumo
    const modal = document.getElementById('viewModal');
    
    if (!modal) {
        return;
    }
    
    // Função auxiliar para formatar moeda
    const formatCurrency = (value) => {
        if (!value && value !== 0) return '-';
        return 'R$ ' + parseFloat(value).toLocaleString('pt-BR', { 
            minimumFractionDigits: 2, 
            maximumFractionDigits: 2 
        });
    };

    // Preencher seção de informações básicas
    const infoValues = modal.querySelectorAll('.info-value');
    if (infoValues.length >= 6) {
        infoValues[0].textContent = insumo.originalId || '-';  // I0 Original
        infoValues[1].textContent = insumo.item || '-';        // Item
        infoValues[2].textContent = insumo.unit || '-';        // Unidade
        infoValues[3].textContent = formatCurrency(insumo.priceFornecedor);  // Adotada
        infoValues[4].textContent = formatCurrency(insumo.precoMontagem);    // Preço Montagem
    }
    
    // Preço Adotado (price-main)
    const priceMain = modal.querySelector('.price-main');
    if (priceMain) {
        priceMain.textContent = formatCurrency(insumo.precoAdotado);
    }
    
    // Preencher estatísticas
    const statValues = modal.querySelectorAll('.stat-value');
    if (statValues.length >= 5) {
        statValues[0].textContent = formatCurrency(insumo.mediaAdotada);      // Média Adotada
        statValues[1].textContent = formatCurrency(insumo.mediaSaneada);      // Média Saneada
        statValues[2].textContent = formatCurrency(insumo.menorValor);        // Menor Valor
        statValues[3].textContent = formatCurrency(insumo.mediaAritmetica);   // Média Aritmética
        statValues[4].textContent = formatCurrency(insumo.mediana);           // Mediana
    }
    
    // Atualizar nomes e valores das empresas nos cards
    for (let i = 1; i <= 6; i++) {
        const nameLabel = modal.querySelector(`#company-name-${i}`);
        const valueLabel = modal.querySelector(`#company-value-${i}`);
        const card = modal.querySelector(`#company-card-${i}`);
        
        const companyName = insumo[`nomeEmpresa${i}`];
        const companyValue = insumo[`empresa${i}`];
        
        if (nameLabel) {
            nameLabel.textContent = companyName || `Empresa ${i}`;
        }
        
        if (valueLabel) {
            valueLabel.textContent = formatCurrency(companyValue);
        }
        
        // Marcar como vazio se não houver nome de empresa (desativada)
        if (card) {
            const detailBtn = card.querySelector('.btn-company-detail');
            if (!companyName) {
                card.classList.add('empty');
                if (detailBtn) detailBtn.style.display = 'none';
            } else {
                card.classList.remove('empty');
                if (detailBtn) detailBtn.style.display = '';
            }
        }
    }
    
    // Preencher justificativa
    const justificationText = modal.querySelector('.justification-text');
    if (justificationText) {
        justificationText.textContent = insumo.justificativa || '-';
    }

    // Armazenar o ID do insumo para ações futuras
    modal.dataset.insumoId = id;
    modal.style.display = 'flex';
    
    // Carregar e renderizar anexos
    if (typeof loadAttachments !== 'undefined' && typeof renderViewAttachments !== 'undefined') {
        loadAttachments('Input', id).then(() => {
            renderViewAttachments();
        });
    }
}

function editFromView() {
    const viewModal = document.getElementById('viewModal');
    const insumoId = viewModal.dataset.insumoId;
    
    if (!insumoId) {
        Swal.fire({
            icon: 'error',
            title: '❌ Erro',
            text: 'ID do insumo não encontrado',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Fechar modal de visualização
    closeViewModal();
    
    // Abrir modal de edição com os dados do insumo
    editInsumo(parseInt(insumoId));
}

function closeEditModal() {
    const modal = document.getElementById('editModal');
    if (modal) modal.style.display = 'none';
}

function closeViewModal() {
    const modal = document.getElementById('viewModal');
    if (modal) modal.style.display = 'none';
}

// =============================================
// ALTERAR STATUS — somente o dono pode alterar
// =============================================
async function changeStatusInsumo(id, novoStatus, btnEl) {
    const insumo = insumosPageData.find(i => i.id === id);
    if (!insumo) return;

    // "reativar" → recalcular automaticamente
    if (novoStatus === 'reativar') {
        novoStatus = calcularAutoStatus(insumo, null);
    }

    try {
        await api.updateInputStatus(id, novoStatus);

        // Atualizar dado local
        insumo.status = novoStatus;

        // Atualizar células da linha sem recarregar a página
        const row = btnEl.closest('tr');
        if (row) {
            const statusKey = novoStatus.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const isCancelada = novoStatus === 'Cancelada';
            const isPendente = novoStatus === 'Pendente';

            // Atualizar célula de status (coluna 8, índice 7)
            const cells = row.querySelectorAll('td');
            if (cells[7]) {
                if (isCancelada) {
                    cells[7].innerHTML = `<span class="status-badge cancelada">${novoStatus}</span> <button class="action-btn-status" title="Reativar cotação" onclick="changeStatusInsumo(${id}, 'reativar', this)">↩</button>`;
                } else {
                    cells[7].innerHTML = `<span class="status-badge ${statusKey}">${novoStatus}</span> <button class="action-btn-status btn-cancelar-status" title="Cancelar cotação" onclick="changeStatusInsumo(${id}, 'Cancelada', this)">🚫</button>`;
                }
            }

            // Atualizar células de preço (colunas 5 e 6, índices 4 e 5)
            const formatCurrency = v => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (cells[4]) cells[4].textContent = isPendente ? '-' : formatCurrency(insumo.precoMontagem);
            if (cells[5]) cells[5].textContent = isPendente ? '-' : formatCurrency(insumo.precoAdotado);
        }

        Swal.fire({
            toast: true,
            position: 'top-end',
            icon: 'success',
            title: `Status alterado para "${novoStatus}"`,
            showConfirmButton: false,
            timer: 2000
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro ao alterar status',
            text: error.message || 'Erro desconhecido',
            confirmButtonColor: '#ff4444'
        });
    }
}

// =============================================
// INTENÇÃO DE COTAÇÃO
// =============================================
function setupIntencaoForm() {
    const form = document.getElementById('intencaoForm');
    if (!form) return;

    // Popular setor do modal de intenção
    const sectorSelect = document.getElementById('intencaoSectorSelect');
    if (sectorSelect) {
        while (sectorSelect.options.length > 1) sectorSelect.remove(1);
        sectorsData.forEach(sector => {
            const opt = document.createElement('option');
            opt.value = sector.id;
            opt.textContent = sector.name;
            sectorSelect.appendChild(opt);
        });
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await saveIntencaoInsumo();
    });
}

async function saveIntencaoInsumo() {
    const sectorId = parseInt(document.getElementById('intencaoSectorSelect')?.value || '0');
    const item = document.getElementById('intencaoItem')?.value?.trim() || '';

    if (!sectorId || !item) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Campos obrigatórios',
            text: 'Preencha o Setor e a Descrição do item.',
            confirmButtonText: 'OK'
        });
        return;
    }

    const data = {
        sectorId,
        item,
        originalId: '',
        unit: '',
        priceFornecedor: 0,
        precoMontagem: 0,
        precoAdotado: 0,
        status: 'Pendente'
    };

    try {
        await api.createInput(data);
        Swal.fire({
            icon: 'success',
            title: 'Intenção registrada!',
            text: 'A cotação foi salva com status Pendente.',
            confirmButtonColor: '#f57f17'
        }).then(() => {
            document.getElementById('intencaoModal').style.display = 'none';
            document.getElementById('intencaoForm').reset();
            loadInsumos();
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro!',
            text: 'Erro ao registrar intenção: ' + (error.message || 'Erro desconhecido'),
            confirmButtonColor: '#ff4444'
        });
    }
}

// =============================================
// DETALHES DA EMPRESA (insumos — mesma lógica de servicos-page.js)
// =============================================

let _cdEntityType = 'Input';
let _cdEntityId = null;
let _cdEmpresaIndex = null;
let _cdDetailId = null;
let _cdIsOwner = false;

async function openCompanyDetailModal(entityType, empresaIndex) {
    const viewModal = document.getElementById('viewModal');
    const entityId = viewModal ? parseInt(viewModal.dataset.insumoId) : null;
    if (!entityId) return;

    _cdEntityType = entityType;
    _cdEntityId = entityId;
    _cdEmpresaIndex = empresaIndex;

    const insumo = insumosPageData.find(i => i.id === entityId);
    _cdIsOwner = insumo ? currentUserId === insumo.userId : false;

    const companyName = insumo ? (insumo[`nomeEmpresa${empresaIndex}`] || `Empresa ${empresaIndex}`) : `Empresa ${empresaIndex}`;
    document.getElementById('companyDetailModalTitle').textContent = `🏢 ${companyName}`;

    const btnEdit = document.getElementById('btnEditCompanyData');
    if (btnEdit) btnEdit.style.display = _cdIsOwner ? '' : 'none';

    try {
        const detail = await api.getCompanyDetail(entityType, entityId, empresaIndex);
        renderCompanyDetailView(detail);
    } catch (err) {
        renderCompanyDetailView(null);
    }

    document.getElementById('companyDetailModal').style.display = 'flex';
}

function closeCompanyDetailModal() {
    const modal = document.getElementById('companyDetailModal');
    if (modal) modal.style.display = 'none';
    _cdDetailId = null;
    document.getElementById('companyDataEdit').style.display = 'none';
    document.getElementById('companyDataView').style.display = '';
    document.getElementById('logForm').style.display = 'none';
    document.getElementById('logEditId').value = '';
}

function renderCompanyDetailView(detail) {
    _cdDetailId = detail ? detail.id : null;

    const fmt = v => v || '-';
    const fmtDate = v => {
        if (!v) return '-';
        try { return new Date(v + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return v; }
    };

    document.getElementById('cdvCNPJ').textContent = fmt(detail?.cnpj);
    document.getElementById('cdvTelefone').textContent = fmt(detail?.telefone);
    document.getElementById('cdvDataCotacao').textContent = fmtDate(detail?.dataCotacao);
    document.getElementById('cdvPessoaContatada').textContent = fmt(detail?.pessoaContatada);
    document.getElementById('cdvEndereco').textContent = fmt(detail?.endereco);

    renderContactLogs(detail?.contactLogs || []);
}

function toggleEditCompanyData() {
    const view = document.getElementById('companyDataView');
    const edit = document.getElementById('companyDataEdit');
    if (edit.style.display === 'none') {
        document.getElementById('cdeInputCNPJ').value = document.getElementById('cdvCNPJ').textContent.replace('-', '').trim();
        document.getElementById('cdeInputTelefone').value = document.getElementById('cdvTelefone').textContent.replace('-', '').trim();
        const rawDate = document.getElementById('cdvDataCotacao').textContent;
        if (rawDate && rawDate !== '-') {
            const parts = rawDate.split('/');
            if (parts.length === 3) {
                document.getElementById('cdeInputDataCotacao').value = `${parts[2]}-${parts[1]}-${parts[0]}`;
            } else {
                document.getElementById('cdeInputDataCotacao').value = '';
            }
        } else {
            document.getElementById('cdeInputDataCotacao').value = '';
        }
        document.getElementById('cdeInputPessoaContatada').value = document.getElementById('cdvPessoaContatada').textContent.replace('-', '').trim();
        document.getElementById('cdeInputEndereco').value = document.getElementById('cdvEndereco').textContent.replace('-', '').trim();
        view.style.display = 'none';
        edit.style.display = '';
    } else {
        view.style.display = '';
        edit.style.display = 'none';
    }
}

async function saveCompanyData() {
    const payload = {
        entityType: _cdEntityType,
        entityId: _cdEntityId,
        empresaIndex: _cdEmpresaIndex,
        cnpj: document.getElementById('cdeInputCNPJ').value.trim() || null,
        telefone: document.getElementById('cdeInputTelefone').value.trim() || null,
        dataCotacao: document.getElementById('cdeInputDataCotacao').value || null,
        pessoaContatada: document.getElementById('cdeInputPessoaContatada').value.trim() || null,
        endereco: document.getElementById('cdeInputEndereco').value.trim() || null
    };
    try {
        const result = await api.upsertCompanyDetail(payload);
        renderCompanyDetailView(result);
        document.getElementById('companyDataEdit').style.display = 'none';
        document.getElementById('companyDataView').style.display = '';
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Dados salvos!', showConfirmButton: false, timer: 2000 });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Erro ao salvar', text: err.message });
    }
}

function renderContactLogs(logs) {
    const container = document.getElementById('contactLogsList');
    if (!logs || logs.length === 0) {
        container.innerHTML = '<p style="color:#999; text-align:center; padding:20px 0;">Nenhum contato registrado.</p>';
        return;
    }
    container.innerHTML = logs.map(log => {
        const isLogOwner = log.responsavelId === currentUserId;
        const editBtn = isLogOwner ? `<button class="btn-log-action btn-log-edit" onclick="editLog(${log.id}, '${escapeJs(log.data)}', '${escapeJs(log.assunto)}', '${escapeJs(log.resposta || '')}', '${escapeJs(log.proximosPassos || '')}')">✏️</button>` : '';
        const delBtn = isLogOwner ? `<button class="btn-log-action btn-log-delete" onclick="deleteLog(${log.id})">🗑</button>` : '';
        return `
        <div class="contact-log-card" id="log-card-${log.id}">
            <div class="log-header">
                <span class="log-date">📅 ${formatLogDate(log.data)}</span>
                <span class="log-author">👤 ${log.responsavelNome}</span>
                <div class="log-actions">${editBtn}${delBtn}</div>
            </div>
            <div class="log-field"><strong>Assunto:</strong> ${escapeHtml(log.assunto)}</div>
            ${log.resposta ? `<div class="log-field"><strong>Resposta:</strong> ${escapeHtml(log.resposta)}</div>` : ''}
            ${log.proximosPassos ? `<div class="log-field"><strong>Próximos passos:</strong> ${escapeHtml(log.proximosPassos)}</div>` : ''}
        </div>`;
    }).join('');
}

function formatLogDate(dateStr) {
    if (!dateStr) return '-';
    try { return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR'); } catch { return dateStr; }
}

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escapeJs(str) {
    if (!str) return '';
    return str.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/\n/g,'\\n');
}

function toggleAddLogForm() {
    const form = document.getElementById('logForm');
    if (form.style.display === 'none') {
        if (!_cdDetailId) {
            api.upsertCompanyDetail({
                entityType: _cdEntityType,
                entityId: _cdEntityId,
                empresaIndex: _cdEmpresaIndex
            }).then(detail => {
                _cdDetailId = detail.id;
                renderCompanyDetailView(detail);
            }).catch(err => {
                Swal.fire({ icon: 'error', title: 'Erro', text: err.message });
                return;
            });
        }
        document.getElementById('logEditId').value = '';
        document.getElementById('logFormTitle').textContent = 'Novo Contato';
        document.getElementById('logInputData').value = new Date().toISOString().split('T')[0];
        document.getElementById('logInputAssunto').value = '';
        document.getElementById('logInputResposta').value = '';
        document.getElementById('logInputProximosPassos').value = '';
        form.style.display = '';
    } else {
        form.style.display = 'none';
    }
}

function cancelLogForm() {
    document.getElementById('logForm').style.display = 'none';
    document.getElementById('logEditId').value = '';
}

function editLog(id, data, assunto, resposta, proximosPassos) {
    document.getElementById('logEditId').value = id;
    document.getElementById('logFormTitle').textContent = 'Editar Contato';
    document.getElementById('logInputData').value = data;
    document.getElementById('logInputAssunto').value = assunto;
    document.getElementById('logInputResposta').value = resposta;
    document.getElementById('logInputProximosPassos').value = proximosPassos;
    document.getElementById('logForm').style.display = '';
    document.getElementById('logForm').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function saveLog() {
    const assunto = document.getElementById('logInputAssunto').value.trim();
    const data = document.getElementById('logInputData').value;
    if (!assunto || !data) {
        Swal.fire({ icon: 'warning', title: 'Campos obrigatórios', text: 'Preencha a data e o assunto.', confirmButtonText: 'OK' });
        return;
    }
    const payload = {
        data: data,
        assunto: assunto,
        resposta: document.getElementById('logInputResposta').value.trim() || null,
        proximosPassos: document.getElementById('logInputProximosPassos').value.trim() || null
    };
    const editId = document.getElementById('logEditId').value;
    try {
        if (editId) {
            await api.updateCompanyContactLog(parseInt(editId), payload);
        } else {
            if (!_cdDetailId) {
                Swal.fire({ icon: 'error', title: 'Erro', text: 'Dados da empresa ainda não foram inicializados.' });
                return;
            }
            await api.addCompanyContactLog(_cdDetailId, payload);
        }
        const detail = await api.getCompanyDetail(_cdEntityType, _cdEntityId, _cdEmpresaIndex);
        renderCompanyDetailView(detail);
        cancelLogForm();
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Contato salvo!', showConfirmButton: false, timer: 2000 });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Erro ao salvar contato', text: err.message });
    }
}

async function deleteLog(logId) {
    const result = await Swal.fire({
        title: 'Excluir este contato?',
        text: 'Esta ação não pode ser desfeita.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d32f2f',
        cancelButtonColor: '#757575',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });
    if (!result.isConfirmed) return;
    try {
        await api.deleteCompanyContactLog(logId);
        const detail = await api.getCompanyDetail(_cdEntityType, _cdEntityId, _cdEmpresaIndex);
        renderCompanyDetailView(detail);
        Swal.fire({ toast: true, position: 'top-end', icon: 'success', title: 'Contato excluído!', showConfirmButton: false, timer: 2000 });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Erro ao excluir', text: err.message });
    }
}

// Fechar modais ao clicar fora
window.addEventListener('click', function(event) {
    const createModal = document.getElementById('createModal');
    const editModal = document.getElementById('editModal');
    const viewModal = document.getElementById('viewModal');
    const companyDetailModal = document.getElementById('companyDetailModal');

    if (event.target === createModal) closeCreateModal();
    if (event.target === editModal) closeEditModal();
    if (event.target === viewModal) closeViewModal();
    if (event.target === companyDetailModal) closeCompanyDetailModal();
});
