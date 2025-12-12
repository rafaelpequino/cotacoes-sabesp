// Página de Insumos - CRUD funcional
// Similar ao servicos-page.js mas para inputs

let insumosCrud = new CrudManager('inputs');
let insumosPageData = [];

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
    console.log('DOMContentLoaded - Carregando insumos...');
    await loadInsumos();
    setupEventListeners();
});

async function loadInsumos() {
    try {
        console.log('Carregando insumos da API...');
        insumosPageData = await api.getInputs();
        console.log('Insumos carregados:', insumosPageData);
        renderInsumosTable(insumosPageData);
    } catch (error) {
        console.error('Erro ao carregar insumos:', error);
        insumosPageData = [];
        renderInsumosTable([]);
    }
}

function renderInsumosTable(insumos) {
    const table = document.getElementById('insumosTableElement');
    const emptyMessage = document.getElementById('emptyMessage');
    const tbody = table ? table.querySelector('tbody') : null;
    
    if (!table || !emptyMessage || !tbody) {
        console.error('Elementos não encontrados:', { table, emptyMessage, tbody });
        return;
    }

    tbody.innerHTML = '';

    if (!insumos || insumos.length === 0) {
        console.log('Insumos vazio, mostrando mensagem');
        table.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    console.log('Insumos encontrados:', insumos.length);
    table.style.display = 'table';
    emptyMessage.style.display = 'none';

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
}

function openCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) modal.style.display = 'flex';
}

function closeCreateModal() {
    const modal = document.getElementById('createModal');
    if (modal) modal.style.display = 'none';
}

async function saveInsumo() {
    const modal = document.getElementById('createModal');
    const form = modal.querySelector('form');
    
    // Obter valores de forma mais precisa baseado na estrutura do HTML
    const originalId = form.querySelector('input[placeholder="Ex: 00001"]')?.value || '';
    const item = form.querySelector('input[placeholder="Descrição do item"]')?.value || '';
    const unit = form.querySelector('input[placeholder="Ex: Un., m², Kg"]')?.value || '';
    
    // Validação básica
    if (!originalId || !item || !unit) {
        alert('Por favor, preencha os campos obrigatórios (ID, Item, Unidade)');
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
        justificativa: form.querySelector('textarea')?.value || '',
        tempoPassado: toNumber(numberInputs[14]?.value),
        mesAnterior: form.querySelectorAll('input[type="text"]')[3]?.value || '',
        indiceAnterior: toNumber(numberInputs[15]?.value),
        indiceAtual: toNumber(numberInputs[16]?.value)
    };

    console.log('Dados a enviar:', data);

    try {
        const result = await api.createInput(data);
        console.log('Insumo criado com sucesso:', result);
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
        console.error('Erro ao salvar insumo:', error);
        // Erro já é tratado pelo CrudManager.create()
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
    
    // Preencher campos de texto
    const textInputs = form.querySelectorAll('input[type="text"]');
    textInputs[0].value = insumo.originalId;
    textInputs[1].value = insumo.item;
    textInputs[2].value = insumo.unit;
    if (textInputs[3]) textInputs[3].value = insumo.mesAnterior || '';
    
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
    numberInputs[14].value = insumo.tempoPassado || '';
    numberInputs[15].value = insumo.indiceAnterior || '';
    numberInputs[16].value = insumo.indiceAtual || '';
    
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
    
    // Obter valores de forma mais precisa baseado na estrutura do HTML
    const originalId = form.querySelector('input[placeholder="Ex: 00001"]')?.value || '';
    const item = form.querySelector('input[placeholder="Descrição do item"]')?.value || '';
    const unit = form.querySelector('input[placeholder="Ex: Un., m², Kg"]')?.value || '';
    
    // Validação básica
    if (!originalId || !item || !unit) {
        alert('Por favor, preencha os campos obrigatórios (ID, Item, Unidade)');
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
        justificativa: form.querySelector('textarea')?.value || '',
        tempoPassado: toNumber(numberInputs[14]?.value),
        mesAnterior: form.querySelectorAll('input[type="text"]')[3]?.value || '',
        indiceAnterior: toNumber(numberInputs[15]?.value),
        indiceAtual: toNumber(numberInputs[16]?.value)
    };

    console.log('Dados a atualizar:', { id: insumoId, ...data });

    try {
        const result = await api.updateInput(insumoId, data);
        console.log('Insumo atualizado com sucesso:', result);
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
        console.error('Erro ao atualizar insumo:', error);
        // Erro já é tratado pelo CrudManager.update()
    }
}

async function deleteInsumo(id) {
    console.log('Deletando insumo com ID:', id);
    try {
        const deleted = await insumosCrud.delete(id);
        if (deleted) {
            console.log('Insumo deletado, recarregando lista...');
            await loadInsumos();
        }
    } catch (error) {
        console.error('Erro ao deletar insumo:', error);
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
        // Dados na ordem exata das colunas da planilha
        // COLUNAS 6, 8, 14 E 22 DEVEM FICAR VAZIAS
        const values = [
            insumo.originalId,                    // 1. ID original
            insumo.item,                          // 2. ITEM
            insumo.unit,                          // 3. Unidade
            insumo.priceFornecedor || '',         // 4. Preço Fornecedor
            insumo.precoMontagem || '',           // 5. Preço Montagem
            '',                                   // 6. COLUNA VAZIA
            insumo.precoAdotado || '',            // 7. Preço Adotado
            '',                                   // 8. COLUNA VAZIA
            insumo.mediaAdotada || '',            // 9. Média Adotada
            insumo.mediaSaneada || '',            // 10. Média Saneada
            insumo.menorValor || '',              // 11. Menor Valor
            insumo.mediaAritmetica || '',         // 12. Média Aritmética
            insumo.mediana || '',                 // 13. Mediana
            '',                                   // 14. COLUNA VAZIA
            insumo.empresa1 || '',                // 15. EMPRESA 1
            insumo.empresa2 || '',                // 16. EMPRESA 2
            insumo.empresa3 || '',                // 17. EMPRESA 3
            insumo.empresa4 || '',                // 18. EMPRESA 4
            insumo.empresa5 || '',                // 19. EMPRESA 5
            insumo.empresa6 || '',                // 20. EMPRESA 6
            insumo.justificativa || '',           // 21. Justificativa
            '',                                   // 22. COLUNA VAZIA
            insumo.tempoPassado || '',            // 23. Tempo Passado
            insumo.mesAnterior || '',             // 24. Mês Anterior
            insumo.indiceAnterior || '',          // 25. Índice Anterior
            insumo.indiceAtual || ''              // 26. Índice Atual
        ].join('\t');

        await navigator.clipboard.writeText(values);
        showCopyNotification();
    } catch (error) {
        console.error('Erro ao copiar dados:', error);
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

    console.log('Abrindo visualização do insumo:', insumo);

    // Preencher modal de visualização com os dados do insumo
    const modal = document.getElementById('viewModal');
    
    if (!modal) {
        console.error('Modal de visualização não encontrado!');
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
    console.log('Elementos .view-value encontrados:', viewValues.length);

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
        
        console.log('Preenchidos', index, 'campos');
    }

    // Armazenar o ID do insumo para ações futuras
    modal.dataset.insumoId = id;
    modal.style.display = 'flex';
    console.log('Modal aberto com sucesso');
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
