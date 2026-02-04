// Página de Serviços - CRUD funcional

let servicosCrud = new CrudManager('services');
let servicosPageData = [];
let sectorsData = [];
let pendingAttachments = []; // Arquivos selecionados para upload
let currentServiceAttachments = []; // Anexos existentes do serviço sendo editado/visualizado

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
    await loadServicos();
    setupEventListeners();
});

async function loadSectors() {
    try {
        sectorsData = await api.getSectors();
    } catch (error) {
        sectorsData = [];
        console.error('Erro ao carregar setores:', error);
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
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${servico.originalId}</td>
            <td>${sectorName}</td>
            <td>${servico.item}</td>
            <td>${servico.unit}</td>
            <td>R$ ${parseFloat(servico.precoAdotado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>R$ ${parseFloat(servico.precoAdotado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>Você</td>
            <td class="actions">
                <button class="action-btn" title="Copiar dados" onclick="copyServico(${servico.id})">📋</button>
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

    // Configurar filtros
    setupFilterListeners();
}

function setupFilterListeners() {
    const searchInput = document.getElementById('searchInput');
    const sortSelect = document.getElementById('sortSelect');
    const filterSelect = document.getElementById('filterSelect');
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

    // Permitir busca ao digitar (Enter)
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                applyFilters();
            }
        });
    }
}

async function applyFilters() {
    const search = document.getElementById('searchInput')?.value || '';
    const sort = document.getElementById('sortSelect')?.value || '';
    const filter = document.getElementById('filterSelect')?.value || '';

    try {
        servicosPageData = await api.getServices(search || null, sort || null, filter || null);
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
    document.getElementById('filterSelect').value = '';
    document.getElementById('searchIndicator').style.display = 'none';
    loadServicos();
}

function openCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) {
        populateSectorSelect(modal);
        modal.style.display = 'flex';
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
    const originalId = form.querySelector('input[placeholder="Ex: jan/00"]')?.value || '';
    const item = form.querySelector('input[placeholder="Descrição do item"]')?.value || '';
    const unit = form.querySelector('input[placeholder="Ex: Un., m², Kg"]')?.value || '';
    
    // Validação básica
    if (!sectorId || !originalId || !item || !unit) {
        alert('Por favor, preencha os campos obrigatórios (Setor, I0 Original, Item, Unidade)');
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
        empresa1: toNumber(numberInputs[8]?.value),
        empresa2: toNumber(numberInputs[9]?.value),
        empresa3: toNumber(numberInputs[10]?.value),
        empresa4: toNumber(numberInputs[11]?.value),
        empresa5: toNumber(numberInputs[12]?.value),
        empresa6: toNumber(numberInputs[13]?.value),
        justificativa: form.querySelector('textarea')?.value || ''
    };

    try {
        const result = await api.createService(data);
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Serviço criado com sucesso!',
            confirmButtonColor: '#13d0ff'
        }).then(() => {
            closeCreateModal();
            loadServicos();
            form.reset();
        });
    } catch (error) {
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

    // Preencher campos de texto
    const textInputs = form.querySelectorAll('input[type="text"]');
    textInputs[0].value = servico.originalId;
    textInputs[1].value = servico.item;
    textInputs[2].value = servico.unit;
    
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

    // Armazenar ID para update
    modal.dataset.servicoId = id;
    modal.style.display = 'flex';
}

async function updateServico() {
    const modal = document.getElementById('editModal');
    const servicoId = modal.dataset.servicoId;
    const form = modal.querySelector('form');
    
    if (!servicoId) {
        alert('ID do serviço não encontrado');
        return;
    }
    
    // Obter sectorId
    const sectorSelect = form.querySelector('select[name="sectorId"]');
    const sectorId = sectorSelect ? parseInt(sectorSelect.value) : null;
    
    // Obter valores de forma mais precisa baseado na estrutura do HTML
    const originalId = form.querySelector('input[placeholder="Ex: jan/00"]')?.value || '';
    const item = form.querySelector('input[placeholder="Descrição do item"]')?.value || '';
    const unit = form.querySelector('input[placeholder="Ex: Un., m², Kg"]')?.value || '';
    
    // Validação básica
    if (!sectorId || !originalId || !item || !unit) {
        alert('Por favor, preencha os campos obrigatórios (Setor, I0 Original, Item, Unidade)');
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
        empresa1: toNumber(numberInputs[8]?.value),
        empresa2: toNumber(numberInputs[9]?.value),
        empresa3: toNumber(numberInputs[10]?.value),
        empresa4: toNumber(numberInputs[11]?.value),
        empresa5: toNumber(numberInputs[12]?.value),
        empresa6: toNumber(numberInputs[13]?.value),
        justificativa: form.querySelector('textarea')?.value || ''
    };

    try {
        const result = await api.updateService(servicoId, data);
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Serviço atualizado com sucesso!',
            confirmButtonColor: '#13d0ff'
        }).then(() => {
            closeEditModal();
            loadServicos();
        });
    } catch (error) {
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
        // Dados na ordem exata das colunas da planilha
        // COLUNAS 6, 8, 14 DEVEM FICAR VAZIAS
        const values = [
            servico.originalId,                    // 1. I0 Original (jan/00)
            servico.item,                          // 2. ITEM
            servico.unit,                          // 3. Unidade
            servico.priceFornecedor || '',         // 4. Preço Fornecedor
            servico.precoMontagem || '',           // 5. Preço Montagem
            '',                                    // 6. COLUNA VAZIA
            servico.precoAdotado || '',            // 7. Preço Adotado
            '',                                    // 8. COLUNA VAZIA
            servico.mediaAdotada || '',            // 9. Média Adotada
            servico.mediaSaneada || '',            // 10. Média Saneada
            servico.menorValor || '',              // 11. Menor Valor
            servico.mediaAritmetica || '',         // 12. Média Aritmética
            servico.mediana || '',                 // 13. Mediana
            '',                                    // 14. COLUNA VAZIA
            servico.empresa1 || '',                // 15. EMPRESA 1
            servico.empresa2 || '',                // 16. EMPRESA 2
            servico.empresa3 || '',                // 17. EMPRESA 3
            servico.empresa4 || '',                // 18. EMPRESA 4
            servico.empresa5 || '',                // 19. EMPRESA 5
            servico.empresa6 || '',                // 20. EMPRESA 6
            servico.justificativa || ''            // 21. Justificativa
        ].join('\t');

        await navigator.clipboard.writeText(values);
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

    // Obter todos os elementos .view-value
    const viewValues = modal.querySelectorAll('.view-value');

    // Mapear valores aos elementos
    if (viewValues.length > 0) {
        let index = 0;
        
        // Informações Básicas
        if (viewValues[index]) viewValues[index++].textContent = servico.originalId || '-';
        if (viewValues[index]) viewValues[index++].textContent = servico.item || '-';
        if (viewValues[index]) viewValues[index++].textContent = servico.unit || '-';
        if (viewValues[index]) viewValues[index++].textContent = 'Você'; // Responsável
        
        // Preços
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.priceFornecedor);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.precoMontagem);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.precoAdotado);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.mediaAdotada);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.mediaSaneada);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.menorValor);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.mediaAritmetica);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.mediana);
        
        // Preços das Empresas
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.empresa1);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.empresa2);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.empresa3);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.empresa4);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.empresa5);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(servico.empresa6);
        
        // Justificativa e Índices
        if (viewValues[index]) viewValues[index++].textContent = servico.justificativa || '-';
        if (viewValues[index]) viewValues[index++].textContent = (servico.tempoPassado || '0') + ' dias';
        if (viewValues[index]) viewValues[index++].textContent = servico.mesAnterior || '-';
        if (viewValues[index]) viewValues[index++].textContent = (servico.indiceAnterior || '0') + '%';
        if (viewValues[index]) viewValues[index++].textContent = (servico.indiceAtual || '0') + '%';
    }

    // Armazenar o ID do serviço para ações futuras
    modal.dataset.servicoId = id;
    modal.style.display = 'flex';
}

function editFromView() {
    const viewModal = document.getElementById('viewModal');
    const servicoId = viewModal.dataset.servicoId;
    
    if (!servicoId) {
        alert('ID do serviço não encontrado');
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

