// Página de Serviços - CRUD funcional

let servicosCrud = new CrudManager('services');
let servicosPageData = [];
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

// Carregar dados ao iniciar página
document.addEventListener('DOMContentLoaded', async () => {
    await loadSectors();
    await loadUsers();
    await loadServicos();
    setupEventListeners();
    setupIntencaoServicoForm();
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

async function loadServicos() {
    try {
        servicosPageData = await api.getServices();
        renderServicosTable(servicosPageData);
    } catch (error) {
        servicosPageData = [];
        renderServicosTable([]);
    }
}

function renderServicosTable(servicos) {
    const table = document.getElementById('servicosTableElement');
    const emptyMessage = document.getElementById('emptyMessage');
    const tbody = table ? table.querySelector('tbody') : null;
    
    if (!table || !emptyMessage || !tbody) {
        return;
    }

    tbody.innerHTML = '';

    if (!servicos || servicos.length === 0) {
        table.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyMessage.style.display = 'none';

    servicos.forEach(servico => {
        const sectorName = sectorsData.find(s => s.id === servico.sectorId)?.name || 'N/A';
        const responsibleUser = usersData.find(u => u.id === servico.userId);
        const responsibleName = responsibleUser ? responsibleUser.name : 'N/A';
        const isOwner = currentUserId === servico.userId;
        const row = document.createElement('tr');
        
        // Badge de status + botão de ação (apenas para o dono)
        const statusKey = (servico.status || 'Concluída').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const statusLabel = servico.status || 'Concluída';
        const isCancelada = statusLabel === 'Cancelada';
        let statusHtml;
        if (isOwner) {
            if (isCancelada) {
                statusHtml = `<span class="status-badge cancelada">${statusLabel}</span> <button class="action-btn-status" title="Reativar cotação" onclick="changeStatusServico(${servico.id}, 'reativar', this)">↩</button>`;
            } else {
                statusHtml = `<span class="status-badge ${statusKey}">${statusLabel}</span> <button class="action-btn-status btn-cancelar-status" title="Cancelar cotação" onclick="changeStatusServico(${servico.id}, 'Cancelada', this)">🚫</button>`;
            }
        } else {
            statusHtml = `<span class="status-badge ${statusKey}">${statusLabel}</span>`;
        }

        // Botões de editar e deletar apenas aparecem se for o dono
        const editDeleteButtons = isOwner ? `
                <button class="action-btn" title="Editar" onclick="editServico(${servico.id})">✏️</button>
                <button class="action-btn" title="Excluir" onclick="deleteServico(${servico.id})">🗑</button>
            ` : '';

        // Ocultar preços para itens com status Pendente
        const isPendente = servico.status === 'Pendente';
        const precoMontagemTd = isPendente ? '-' : `R$ ${parseFloat(servico.precoMontagem || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        const precoAdotadoTd  = isPendente ? '-' : `R$ ${parseFloat(servico.precoAdotado || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

        row.innerHTML = `
            <td>${servico.originalId || '-'}</td>
            <td>${sectorName}</td>
            <td>${servico.item}</td>
            <td>${servico.unit || '-'}</td>
            <td>${precoMontagemTd}</td>
            <td>${precoAdotadoTd}</td>
            <td>${responsibleName}</td>
            <td>${statusHtml}</td>
            <td class="actions">
                <button class="action-btn" title="Copiar dados" onclick="copyServico(${servico.id})">📋</button>
                <button class="action-btn" title="Visualizar" onclick="viewServico(${servico.id})">👁</button>
                ${editDeleteButtons}
            </td>
        `;
        tbody.appendChild(row);
    });
}

function setupEventListeners() {
    const btnNovaCotacao = document.querySelector('.btn-criar-individual');
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
    const search = document.getElementById('searchInput')?.value || '';
    const sort = document.getElementById('sortSelect')?.value || '';
    const sectorId = document.getElementById('sectorFilterSelect')?.value || '';
    const responsibleId = document.getElementById('responsibleFilterSelect')?.value || '';

    try {
        // Filtrar localmente por setor se selecionado
        let filteredData = await api.getServices(search || null, sort || null, null);
        
        if (sectorId) {
            filteredData = filteredData.filter(item => item.sectorId === parseInt(sectorId));
        }

        if (responsibleId) {
            filteredData = filteredData.filter(item => item.userId === parseInt(responsibleId));
        }
        
        servicosPageData = filteredData;
        renderServicosTable(servicosPageData);
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
    loadServicos();
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

async function saveServico() {
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
        const result = await api.createService(data);
        
        // Fazer upload dos anexos pendentes
        if (typeof uploadPendingAttachments !== 'undefined' && typeof pendingAttachments !== 'undefined' && pendingAttachments.length > 0) {
            try {
                await uploadPendingAttachments('Service', result.id);
            } catch (uploadError) {
                console.error('Erro ao fazer upload de anexos:', uploadError);
                // Continua mesmo se houver erro no upload
            }
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Serviço criado com sucesso!',
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
            // Recarregar serviços após fechar modal
            loadServicos();
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: humanizeError(error.message || 'Erro ao criar serviço'),
            confirmButtonColor: '#d32f2f'
        });
    }
}

function editServico(id) {
    const servico = servicosPageData.find(s => s.id === id);
    if (!servico) return;

    const modal = document.getElementById('editModal');
    const form = modal.querySelector('form');

    // Popular dropdown de setores
    populateSectorSelect(modal);
    
    // Selecionar o setor correto
    const sectorSelect = form.querySelector('select[name="sectorId"]');
    if (sectorSelect) sectorSelect.value = servico.sectorId;

    // Preencher campos de texto (I0, Item, Unidade) — via placeholder para evitar problemas de índice
    const io0Input = form.querySelector('input[placeholder="Ex: JAN/00"]');
    const itemInput = form.querySelector('input[placeholder="DESCRIÇÃO DO ITEM"]');
    const unitInput = form.querySelector('input[placeholder="Ex: Un., m², Kg"]');
    if (io0Input) io0Input.value = servico.originalId || '';
    if (itemInput) itemInput.value = servico.item || '';
    if (unitInput) unitInput.value = servico.unit || '';
    
    // Preencher nomes das empresas
    form.querySelector('input[name="nomeEmpresa1"]').value = servico.nomeEmpresa1 || '';
    form.querySelector('input[name="nomeEmpresa2"]').value = servico.nomeEmpresa2 || '';
    form.querySelector('input[name="nomeEmpresa3"]').value = servico.nomeEmpresa3 || '';
    form.querySelector('input[name="nomeEmpresa4"]').value = servico.nomeEmpresa4 || '';
    form.querySelector('input[name="nomeEmpresa5"]').value = servico.nomeEmpresa5 || '';
    form.querySelector('input[name="nomeEmpresa6"]').value = servico.nomeEmpresa6 || '';
    
    // Preencher campos de número
    const numberInputs = form.querySelectorAll('input[type="number"]');
    numberInputs[0].value = servico.priceFornecedor;
    numberInputs[1].value = servico.precoMontagem;
    numberInputs[2].value = servico.precoAdotado;
    numberInputs[3].value = servico.mediaAdotada || '';
    numberInputs[4].value = servico.mediaSaneada || '';
    numberInputs[5].value = servico.menorValor || '';
    numberInputs[6].value = servico.mediaAritmetica || '';
    numberInputs[7].value = servico.mediana || '';
    numberInputs[8].value = servico.empresa1 || '';
    numberInputs[9].value = servico.empresa2 || '';
    numberInputs[10].value = servico.empresa3 || '';
    numberInputs[11].value = servico.empresa4 || '';
    numberInputs[12].value = servico.empresa5 || '';
    numberInputs[13].value = servico.empresa6 || '';
    
    // Preencher textarea
    const textarea = form.querySelector('textarea');
    if (textarea) textarea.value = servico.justificativa || '';

    // Preencher Status (checkbox de cancelar + badge informativo)
    const cancelarCheck = document.getElementById('editCancelarCheck');
    const statusDisplay = document.getElementById('editStatusDisplay');
    if (cancelarCheck) {
        cancelarCheck.checked = servico.status === 'Cancelada';
    }
    if (statusDisplay) {
        const sk = (servico.status || 'Pendente').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        statusDisplay.innerHTML = `<span class="status-badge ${sk}">${servico.status || 'Pendente'}</span>`;
    }

    // Armazenar ID para update
    modal.dataset.servicoId = id;
    modal.style.display = 'flex';
    
    // Carregar e renderizar anexos
    if (typeof loadAttachments !== 'undefined' && typeof renderEditAttachments !== 'undefined') {
        loadAttachments('Service', id).then(() => {
            pendingAttachments = [];
            renderEditAttachments();
        });
    }
}

async function updateServico() {
    const modal = document.getElementById('editModal');
    const servicoId = modal.dataset.servicoId;
    const form = modal.querySelector('form');
    
    if (!servicoId) {
        Swal.fire({
            icon: 'error',
            title: '❌ Erro',
            text: 'ID do serviço não encontrado',
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
        const result = await api.updateService(servicoId, data);
        
        // Fazer upload dos anexos pendentes
        if (typeof uploadPendingAttachments !== 'undefined' && typeof pendingAttachments !== 'undefined' && pendingAttachments.length > 0) {
            try {
                await uploadPendingAttachments('Service', servicoId);
            } catch (uploadError) {
                console.error('Erro ao fazer upload de anexos:', uploadError);
                // Continua mesmo se houver erro no upload
            }
        }
        
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Serviço atualizado com sucesso!',
            confirmButtonColor: '#13d0ff'
        }).then(() => {
            closeEditModal();
            // Limpar anexos pendentes
            if (typeof pendingAttachments !== 'undefined') {
                pendingAttachments = [];
            }
            // Recarregar serviços após fechar modal
            loadServicos();
        });
    } catch (error) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: humanizeError(error.message || 'Erro ao atualizar serviço'),
            confirmButtonColor: '#d32f2f'
        });
    }
}

async function deleteServico(id) {
    try {
        const deleted = await servicosCrud.delete(id);
        if (deleted) {
            await loadServicos();
        }
    } catch (error) {
    }
}

async function copyServico(id) {
    const servico = servicosPageData.find(s => s.id === id);
    if (!servico) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Serviço não encontrado'
        });
        return;
    }

    try {
        // PRIMEIRA LINHA: Nomes das empresas
        const companyNamesLine = [
            '', '', '', '', '', '', '', '', '', '', '', '', '', '', // 0-13: vazias
            (servico.nomeEmpresa1 || ''),  // 14
            (servico.nomeEmpresa2 || ''),  // 15
            (servico.nomeEmpresa3 || ''),  // 16
            (servico.nomeEmpresa4 || ''),  // 17
            (servico.nomeEmpresa5 || ''),  // 18
            (servico.nomeEmpresa6 || ''),  // 19
            ''  // 20: Justificativa (vazia)
        ].join('\t');
        
        // SEGUNDA LINHA: Valores
        const valuesLine = [
            servico.originalId,                    // 0. I0 Original (JAN/00)
            servico.item,                          // 1. ITEM
            servico.unit,                          // 2. Unidade
            servico.priceFornecedor || '',         // 3. Preço Fornecedor
            servico.precoMontagem || '',           // 4. Preço Montagem
            '',                                    // 5. COLUNA VAZIA
            servico.precoAdotado || '',            // 6. Preço Adotado
            '',                                    // 7. COLUNA VAZIA
            servico.mediaAdotada || '',            // 8. Média Adotada
            servico.mediaSaneada || '',            // 9. Média Saneada
            servico.menorValor || '',              // 10. Menor Valor
            servico.mediaAritmetica || '',         // 11. Média Aritmética
            servico.mediana || '',                 // 12. Mediana
            '',                                    // 13. COLUNA VAZIA
            servico.empresa1 || '',                // 14. EMPRESA 1
            servico.empresa2 || '',                // 15. EMPRESA 2
            servico.empresa3 || '',                // 16. EMPRESA 3
            servico.empresa4 || '',                // 17. EMPRESA 4
            servico.empresa5 || '',                // 18. EMPRESA 5
            servico.empresa6 || '',                // 19. EMPRESA 6
            servico.justificativa || ''            // 20. Justificativa
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

function viewServico(id) {
    const servico = servicosPageData.find(s => s.id === id);
    if (!servico) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Serviço não encontrado'
        });
        return;
    }

    // Preencher modal de visualização com os dados do serviço
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
        infoValues[0].textContent = servico.originalId || '-';  // I0 Original
        infoValues[1].textContent = servico.item || '-';        // Item
        infoValues[2].textContent = servico.unit || '-';        // Unidade
        infoValues[3].textContent = formatCurrency(servico.priceFornecedor);  // Adotada
        infoValues[4].textContent = formatCurrency(servico.precoMontagem);    // Preço Montagem
    }
    
    // Preço Adotado (price-main)
    const priceMain = modal.querySelector('.price-main');
    if (priceMain) {
        priceMain.textContent = formatCurrency(servico.precoAdotado);
    }
    
    // Preencher estatísticas
    const statValues = modal.querySelectorAll('.stat-value');
    if (statValues.length >= 5) {
        statValues[0].textContent = formatCurrency(servico.mediaAdotada);      // Média Adotada
        statValues[1].textContent = formatCurrency(servico.mediaSaneada);      // Média Saneada
        statValues[2].textContent = formatCurrency(servico.menorValor);        // Menor Valor
        statValues[3].textContent = formatCurrency(servico.mediaAritmetica);   // Média Aritmética
        statValues[4].textContent = formatCurrency(servico.mediana);           // Mediana
    }
    
    // Atualizar nomes e valores das empresas nos cards
    for (let i = 1; i <= 6; i++) {
        const nameLabel = modal.querySelector(`#company-name-${i}`);
        const valueLabel = modal.querySelector(`#company-value-${i}`);
        const card = modal.querySelector(`#company-card-${i}`);
        
        const companyName = servico[`nomeEmpresa${i}`];
        const companyValue = servico[`empresa${i}`];
        
        if (nameLabel) {
            nameLabel.textContent = companyName || `Empresa ${i}`;
        }
        
        if (valueLabel) {
            valueLabel.textContent = formatCurrency(companyValue);
        }
        
        // Marcar como vazio se não houver valor ou se for 0
        if (card) {
            if (!companyValue || companyValue === 0 || companyValue === '0') {
                card.classList.add('empty');
            } else {
                card.classList.remove('empty');
            }
        }
    }
    
    // Preencher justificativa
    const justificationText = modal.querySelector('.justification-text');
    if (justificationText) {
        justificationText.textContent = servico.justificativa || '-';
    }

    // Armazenar o ID do serviço para ações futuras
    modal.dataset.servicoId = id;
    modal.style.display = 'flex';
    
    // Carregar e renderizar anexos
    if (typeof loadAttachments !== 'undefined' && typeof renderViewAttachments !== 'undefined') {
        loadAttachments('Service', id).then(() => {
            renderViewAttachments();
        });
    }
}

function editFromView() {
    const viewModal = document.getElementById('viewModal');
    const servicoId = viewModal.dataset.servicoId;
    
    if (!servicoId) {
        Swal.fire({
            icon: 'error',
            title: '❌ Erro',
            text: 'ID do serviço não encontrado',
            confirmButtonText: 'OK'
        });
        return;
    }
    
    // Fechar modal de visualização
    closeViewModal();
    
    // Abrir modal de edição com os dados do serviço
    editServico(parseInt(servicoId));
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
async function changeStatusServico(id, novoStatus, btnEl) {
    const servico = servicosPageData.find(s => s.id === id);
    if (!servico) return;

    // "reativar" → recalcular automaticamente
    if (novoStatus === 'reativar') {
        novoStatus = calcularAutoStatus(servico, null);
    }

    try {
        await api.updateServiceStatus(id, novoStatus);

        // Atualizar dado local
        servico.status = novoStatus;

        // Atualizar células da linha sem recarregar a página
        const row = btnEl.closest('tr');
        if (row) {
            const statusKey = novoStatus.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
            const isCancelada = novoStatus === 'Cancelada';
            const isPendente = novoStatus === 'Pendente';

            // Atualizar célula de status (índice 7)
            const cells = row.querySelectorAll('td');
            if (cells[7]) {
                if (isCancelada) {
                    cells[7].innerHTML = `<span class="status-badge cancelada">${novoStatus}</span> <button class="action-btn-status" title="Reativar cotação" onclick="changeStatusServico(${id}, 'reativar', this)">↩</button>`;
                } else {
                    cells[7].innerHTML = `<span class="status-badge ${statusKey}">${novoStatus}</span> <button class="action-btn-status btn-cancelar-status" title="Cancelar cotação" onclick="changeStatusServico(${id}, 'Cancelada', this)">🚫</button>`;
                }
            }

            // Atualizar células de preço (índices 4 e 5)
            const formatCurrency = v => `R$ ${parseFloat(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            if (cells[4]) cells[4].textContent = isPendente ? '-' : formatCurrency(servico.precoMontagem);
            if (cells[5]) cells[5].textContent = isPendente ? '-' : formatCurrency(servico.precoAdotado);
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
function setupIntencaoServicoForm() {
    const form = document.getElementById('intencaoForm');
    if (!form) return;

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
        await saveIntencaoServico();
    });
}

async function saveIntencaoServico() {
    const sectorId = parseInt(document.getElementById('intencaoSectorSelect')?.value || '0');
    const item = document.getElementById('intencaoItem')?.value?.trim() || '';

    if (!sectorId || !item) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Campos obrigatórios',
            text: 'Preencha o Setor e a DESCRIÇÃO DO ITEM.',
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
        await api.createService(data);
        Swal.fire({
            icon: 'success',
            title: 'Intenção registrada!',
            text: 'A cotação foi salva com status Pendente.',
            confirmButtonColor: '#f57f17'
        }).then(() => {
            document.getElementById('intencaoModal').style.display = 'none';
            document.getElementById('intencaoForm').reset();
            loadServicos();
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

