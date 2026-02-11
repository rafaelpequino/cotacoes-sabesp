// Página de Insumos - CRUD funcional
// Similar ao servicos-page.js mas para inputs

let insumosCrud = new CrudManager('inputs');
let insumosPageData = [];
let sectorsData = [];

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
    await loadInsumos();
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
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${insumo.originalId}</td>
            <td>${sectorName}</td>
            <td>${insumo.item}</td>
            <td>${insumo.unit}</td>
            <td>R$ ${parseFloat(insumo.precoAdotado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>R$ ${parseFloat(insumo.precoAdotado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>Você</td>
            <td class="actions">
                <button class="action-btn" title="Copiar dados" onclick="copyInsumo(${insumo.id})">📋</button>
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
        insumosPageData = await api.getInputs(search || null, sort || null, filter || null);
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
    document.getElementById('filterSelect').value = '';
    document.getElementById('searchIndicator').style.display = 'none';
    loadInsumos();
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

async function saveInsumo() {
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
        justificativa: form.querySelector('textarea')?.value || ''
    };

    try {
        const result = await api.createInput(data);
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Insumo criado com sucesso!',
            confirmButtonColor: '#13d0ff'
        }).then(() => {
            closeCreateModal();
            loadInsumos();
            form.reset();
        });
    } catch (error) {
    }
}

async function editInsumo(id) {
    const insumo = insumosPageData.find(i => i.id === id);
    if (!insumo) {
        alert('Insumo não encontrado');
        return;
    }

    const modal = document.getElementById('editModal');
    const form = modal.querySelector('form');
    
    // Popular dropdown de setores
    populateSectorSelect(modal);
    
    // Selecionar o setor correto
    const sectorSelect = form.querySelector('select[name="sectorId"]');
    if (sectorSelect) sectorSelect.value = insumo.sectorId;
    
    // Preencher campos de texto (I0, Item, Unidade)
    const textInputs = form.querySelectorAll('input[type="text"]:not([name^="nomeEmpresa"])');
    textInputs[0].value = insumo.originalId;
    textInputs[1].value = insumo.item;
    textInputs[2].value = insumo.unit;
    
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

    // Armazenar ID para update
    modal.dataset.insumoId = id;
    modal.style.display = 'flex';
}

async function updateInsumo() {
    const modal = document.getElementById('editModal');
    const insumoId = modal.dataset.insumoId;
    const form = modal.querySelector('form');
    
    if (!insumoId) {
        alert('ID do insumo não encontrado');
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
        justificativa: form.querySelector('textarea')?.value || ''
    };

    try {
        const result = await api.updateInput(insumoId, data);
        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Insumo atualizado com sucesso!',
            confirmButtonColor: '#13d0ff'
        }).then(() => {
            closeEditModal();
            loadInsumos();
        });
    } catch (error) {
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

    // Obter todos os elementos .view-value
    const viewValues = modal.querySelectorAll('.view-value');

    // Mapear valores aos elementos
    if (viewValues.length > 0) {
        let index = 0;
        
        // Informações Básicas
        if (viewValues[index]) viewValues[index++].textContent = insumo.originalId || '-';
        if (viewValues[index]) viewValues[index++].textContent = insumo.item || '-';
        if (viewValues[index]) viewValues[index++].textContent = insumo.unit || '-';
        if (viewValues[index]) viewValues[index++].textContent = 'Você'; // Responsável
        
        // Preços
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.priceFornecedor);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.precoMontagem);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.precoAdotado);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.mediaAdotada);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.mediaSaneada);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.menorValor);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.mediaAritmetica);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.mediana);
        
        // Preços das Empresas
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.empresa1);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.empresa2);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.empresa3);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.empresa4);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.empresa5);
        if (viewValues[index]) viewValues[index++].textContent = formatCurrency(insumo.empresa6);
        
        // Justificativa e Índices
        if (viewValues[index]) viewValues[index++].textContent = insumo.justificativa || '-';
        if (viewValues[index]) viewValues[index++].textContent = (insumo.tempoPassado || '0') + ' dias';
        if (viewValues[index]) viewValues[index++].textContent = insumo.mesAnterior || '-';
        if (viewValues[index]) viewValues[index++].textContent = (insumo.indiceAnterior || '0') + '%';
        if (viewValues[index]) viewValues[index++].textContent = (insumo.indiceAtual || '0') + '%';
    }
    
    // Atualizar nomes das empresas nos cards
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
        
        // Marcar como vazio se não houver valor
        if (card) {
            if (!companyValue && companyValue !== 0) {
                card.classList.add('empty');
            } else {
                card.classList.remove('empty');
            }
        }
    }

    // Armazenar o ID do insumo para ações futuras
    modal.dataset.insumoId = id;
    modal.style.display = 'flex';
}

function editFromView() {
    const viewModal = document.getElementById('viewModal');
    const insumoId = viewModal.dataset.insumoId;
    
    if (!insumoId) {
        alert('ID do insumo não encontrado');
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
