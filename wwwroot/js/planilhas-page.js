// Página de Planilhas - CRUD funcional

let planilhasCrud = new CrudManager('spreadsheets');
let planilhasPageData = [];
let sectorsData = [];
let usersData = [];
let currentUserId = null;

// Mapa de meses em português
const monthsMap = {
    1: 'Jan', 2: 'Fev', 3: 'Mar', 4: 'Abr', 5: 'Mai', 6: 'Jun',
    7: 'Jul', 8: 'Ago', 9: 'Set', 10: 'Out', 11: 'Nov', 12: 'Dez'
};

// Função para humanizar erros (cópia do método em crud.js)
function humanizeError(errorMessage) {
    // Se já começa com uma mensagem clara, retornar
    if (errorMessage && !errorMessage.includes('Erro')) {
        return errorMessage;
    }

    const errorMap = {
        'Ocorreu um erro ao processar sua requisição': 'Houve um problema ao processar sua solicitação. Tente novamente.',
        'não encontrado': 'O item não foi encontrado.',
        'já existe': 'Este item já existe no sistema.',
        'campo obrigatório': 'Verifique se todos os campos obrigatórios foram preenchidos.',
        'inválido': 'Os dados fornecidos são inválidos.',
        'Erro 400': 'Verifique os dados fornecidos. Pode haver um problema com o arquivo ou campos vazios.',
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

async function loadSectors() {
    try {
        sectorsData = await api.getSectors();
        
        // Popular o select de setor no formulário de upload
        const sectorSelect = document.getElementById('sectorSelect');
        if (sectorSelect && sectorsData && sectorsData.length > 0) {
            sectorsData.forEach(sector => {
                const option = document.createElement('option');
                option.value = sector.id;
                option.textContent = converterMaiuscula(sector.name);
                sectorSelect.appendChild(option);
            });
        }

        // Popular o select de filtro
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect && sectorsData && sectorsData.length > 0) {
            sectorsData.forEach(sector => {
                const option = document.createElement('option');
                option.value = sector.id;
                option.textContent = converterMaiuscula(sector.name);
                filterSelect.appendChild(option);
            });
        }
    } catch (error) {
        sectorsData = [];
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
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadSectors();
    await loadUsers();
    await loadPlanilhas();
    setupEventListeners();
});

async function loadPlanilhas() {
    try {
        const searchValue = document.getElementById('searchInput')?.value || '';
        const sectorId = document.getElementById('filterSelect')?.value || '';
        const i0StartMonth = document.getElementById('i0StartMonth')?.value || '';
        const i0StartYear = document.getElementById('i0StartYear')?.value || '';
        const i0EndMonth = document.getElementById('i0EndMonth')?.value || '';
        const i0EndYear = document.getElementById('i0EndYear')?.value || '';
        
        planilhasPageData = await api.getSpreadsheets(searchValue, sectorId, i0StartMonth, i0StartYear, i0EndMonth, i0EndYear);
        renderPlanilhasTable(planilhasPageData);
        updateSearchIndicator(searchValue);
    } catch (error) {
        planilhasPageData = [];
        renderPlanilhasTable([]);
    }
}

function renderPlanilhasTable(planilhas) {
    const table = document.getElementById('planilhasTableElement');
    const emptyMessage = document.getElementById('emptyMessage');
    const tbody = table ? table.querySelector('tbody') : null;
    
    if (!table || !emptyMessage || !tbody) {
        return;
    }

    tbody.innerHTML = '';

    if (!planilhas || planilhas.length === 0) {
        table.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyMessage.style.display = 'none';

    planilhas.forEach(planilha => {
        const row = document.createElement('tr');
        
        // Procurar o nome do setor
        const sector = sectorsData.find(s => s.id === planilha.sectorId);
        const sectorName = sector ? converterMaiuscula(sector.name) : '-';
        
        // Procurar o nome do usuário
        const owner = usersData.find(u => u.id === planilha.userId);
        const ownerName = owner ? converterMaiuscula(owner.name) : 'N/A';
        
        // Formatear I0
        const i0Display = planilha.i0Month && planilha.i0Year 
            ? `${monthsMap[planilha.i0Month] || ''}/${String(planilha.i0Year).slice(-2)}`
            : '-';
        
        // Verificar se é o proprietário
        const isOwner = currentUserId === planilha.userId;
        
        // Botões de editar e deletar apenas aparecem se for o dono
        const editDeleteButtons = isOwner ? `
                <button class="action-btn" title="Editar" onclick="editPlanilha(${planilha.id})">✏️</button>
                <button class="action-btn" title="Deletar" onclick="deletePlanilha(${planilha.id})">🗑</button>
            ` : '';
        
        row.innerHTML = `
            <td>${converterMaiuscula(planilha.name) || '-'}</td>
            <td>${i0Display}</td>
            <td>${sectorName}</td>
            <td>${new Date(planilha.createdAt).toLocaleDateString('pt-BR')}</td>
            <td>${ownerName}</td>
            <td>${planilha.fileSize ? (planilha.fileSize / 1024).toFixed(2) + ' KB' : '-'}</td>
            <td class="actions">
                <button class="action-btn" title="Download" onclick="downloadPlanilha(${planilha.id})">⬇️</button>
                ${editDeleteButtons}
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

    // Form de criar
    const createForm = document.getElementById('uploadModal')?.querySelector('form');
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await savePlanilha();
        });
    }

    // Configurar filtros
    setupFilterListeners();
}

function setupFilterListeners() {
    const searchInput = document.getElementById('searchInput');
    const filterSelect = document.getElementById('filterSelect');
    const i0StartMonth = document.getElementById('i0StartMonth');
    const i0StartYear = document.getElementById('i0StartYear');
    const i0EndMonth = document.getElementById('i0EndMonth');
    const i0EndYear = document.getElementById('i0EndYear');
    const btnFiltrar = document.getElementById('btnFiltrar');
    const btnLimpar = document.getElementById('btnLimpar');

    if (btnFiltrar) {
        btnFiltrar.addEventListener('click', loadPlanilhas);
    }

    if (btnLimpar) {
        btnLimpar.addEventListener('click', clearFilters);
    }

    // Filtro por setor dispara requisição automaticamente
    if (filterSelect) {
        filterSelect.addEventListener('change', loadPlanilhas);
    }

    // Filtros de I0 disparam requisição automaticamente
    if (i0StartMonth) {
        i0StartMonth.addEventListener('change', loadPlanilhas);
    }
    if (i0StartYear) {
        i0StartYear.addEventListener('change', loadPlanilhas);
    }
    if (i0EndMonth) {
        i0EndMonth.addEventListener('change', loadPlanilhas);
    }
    if (i0EndYear) {
        i0EndYear.addEventListener('change', loadPlanilhas);
    }

    // Permitir busca ao digitar (Enter)
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loadPlanilhas();
            }
        });
    }
}

async function applyFilters() {
    await loadPlanilhas();
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
    document.getElementById('filterSelect').value = '';
    document.getElementById('i0StartMonth').value = '';
    document.getElementById('i0StartYear').value = '';
    document.getElementById('i0EndMonth').value = '';
    document.getElementById('i0EndYear').value = '';
    document.getElementById('searchIndicator').style.display = 'none';
    loadPlanilhas();
}

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        // Resetar para modo de criação
        modal.dataset.isEditing = 'false';
        delete modal.dataset.planilhaId;
        const title = document.getElementById('uploadModalTitle');
        const submitButton = document.getElementById('uploadModalSubmitButton');
        if (title) title.textContent = 'Nova Planilha';
        if (submitButton) submitButton.textContent = 'Enviar Planilha';
        const form = modal.querySelector('form');
        if (form) form.reset();
        modal.style.display = 'flex';
    } else {
        Swal.fire({
            icon: 'info',
            title: 'ℹ️ Em desenvolvimento',
            text: 'Funcionalidade de upload de planilhas em desenvolvimento',
            confirmButtonText: 'OK'
        });
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
        modal.dataset.isEditing = 'false';
        delete modal.dataset.planilhaId;
    }
}

async function savePlanilha() {
    const modal = document.getElementById('uploadModal');
    const form = modal.querySelector('form');
    const isEditing = modal.dataset.isEditing === 'true';
    const planilhaId = modal.dataset.planilhaId;
    
    // Buscar input de nome da planilha
    const nameInput = document.getElementById('planilhaNameInput') || form.querySelector('input[type="text"]');
    let name = nameInput?.value?.trim() || '';
    // Aplicar mesma padronização de texto usada nas cotações (maiúsculas, sem acentos/caracteres especiais)
    if (typeof converterMaiuscula === 'function') {
        name = converterMaiuscula(name);
        if (nameInput) nameInput.value = name;
    }
    const sectorSelect = document.getElementById('sectorSelect');
    const sector = sectorSelect?.value || '';
    const i0Month = document.getElementById('i0Month')?.value || '';
    const i0Year = document.getElementById('i0Year')?.value || '';
    const fileInput = form.querySelector('input[type="file"]');
    
    if (!name) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, preencha o nome da planilha'
        });
        return;
    }

    if (!sector) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, selecione um setor'
        });
        return;
    }

    if (!i0Month) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, selecione o mês do I0'
        });
        return;
    }

    if (!i0Year) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, selecione o ano do I0'
        });
        return;
    }

    // Se não está editando, arquivo é obrigatório
    if (!isEditing) {
        if (!fileInput || !fileInput.files.length) {
            Swal.fire({
                icon: 'warning',
                title: 'Arquivo obrigatório',
                text: 'Por favor, selecione um arquivo'
            });
            return;
        }
    }

    // Mostrar loading
    Swal.fire({
        title: isEditing ? 'Atualizando planilha...' : 'Enviando arquivo...',
        text: 'Por favor, aguarde.',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        let filePath = null;
        let fileType = null;
        let fileSize = null;

        // Se há um arquivo novo, fazer upload
        if (fileInput && fileInput.files.length) {
            const file = fileInput.files[0];
            const fileName = file.name.toLowerCase();
            
            // Validar extensão do arquivo
            if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xlsm') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Arquivo inválido',
                    text: 'Por favor, selecione um arquivo Excel (.xlsx, .xlsm, .xls) ou CSV (.csv)',
                    confirmButtonColor: '#13d0ff'
                });
                return;
            }

            const uploadResult = await api.uploadFile(file);
            filePath = uploadResult.fileKey;
            fileType = fileName.split('.').pop() || 'unknown';
            fileSize = file.size;
        }

        if (isEditing) {
            // Modo de edição - atualizar planilha
            const data = {
                name: name,
                sectorId: sector ? parseInt(sector) : null,
                i0Month: i0Month ? parseInt(i0Month) : null,
                i0Year: i0Year ? parseInt(i0Year) : null,
                // Todas as planilhas são compartilhadas
                isShared: true
            };

            // Adicionar dados do arquivo apenas se houver novo arquivo
            if (filePath) {
                data.filePath = filePath;
                data.fileType = fileType;
                data.fileSize = fileSize;
            }

            await api.updateSpreadsheet(planilhaId, data);

            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Planilha atualizada com sucesso!',
                confirmButtonColor: '#13d0ff'
            }).then(() => {
                closeUploadModal();
                loadPlanilhas();
                form.reset();
                modal.dataset.isEditing = 'false';
                delete modal.dataset.planilhaId;
            });
        } else {
            // Modo de criação - criar nova planilha
            const data = {
                name: name,
                sectorId: sector ? parseInt(sector) : null,
                i0Month: i0Month ? parseInt(i0Month) : null,
                i0Year: i0Year ? parseInt(i0Year) : null,
                filePath: filePath,
                fileType: fileType,
                fileSize: fileSize,
                // Todas as planilhas são compartilhadas
                isShared: true
            };

            await api.createSpreadsheet(data);

            Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: 'Planilha enviada e criada com sucesso!',
                confirmButtonColor: '#13d0ff'
            }).then(() => {
                closeUploadModal();
                loadPlanilhas();
                form.reset();
            });
        }
    } catch (error) {
        const mensagem = humanizeError(error.message);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao Salvar',
            text: mensagem,
            confirmButtonColor: '#d32f2f'
        });
    }
}

async function downloadPlanilha(id) {
    const planilha = planilhasPageData.find(p => p.id === id);
    if (!planilha) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Planilha não encontrada'
        });
        return;
    }

    if (!planilha.filePath) {
        Swal.fire({
            icon: 'warning',
            title: 'Arquivo não disponível',
            text: 'O arquivo desta planilha não está disponível para download'
        });
        return;
    }

    try {
        // Fazer download do arquivo
        const blob = await api.downloadFile(planilha.filePath);
        
        // Criar link e fazer download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = planilha.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        // Fechar o loading
        Swal.close();

        Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: `Arquivo "${planilha.name}" baixado com sucesso!`,
            confirmButtonColor: '#13d0ff'
        });
    } catch (error) {
        const mensagem = humanizeError(error.message);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao Baixar',
            text: mensagem || 'Não foi possível fazer o download da planilha'
        });
    }
}

async function editPlanilha(id) {
    const planilha = planilhasPageData.find(p => p.id === id);
    if (!planilha) {
        Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Planilha não encontrada'
        });
        return;
    }

    // Verificar se é o proprietário
    if (currentUserId !== planilha.userId) {
        Swal.fire({
            icon: 'warning',
            title: 'Não permitido',
            text: 'Você só pode editar planilhas que você criou'
        });
        return;
    }

    // Abrir modal de edição (reutilizando o modal de upload)
    const modal = document.getElementById('uploadModal');
    const form = modal.querySelector('form');

    // Ajustar título e botão
    const title = document.getElementById('uploadModalTitle');
    const submitButton = document.getElementById('uploadModalSubmitButton');
    if (title) title.textContent = 'Editar Planilha';
    if (submitButton) submitButton.textContent = 'Atualizar';

    // Popular campos
    const nameInput = document.getElementById('planilhaNameInput');
    const sectorSelect = document.getElementById('sectorSelect');
    const isSharedCheckbox = document.getElementById('isSharedCheckbox');

    if (nameInput) nameInput.value = planilha.name || '';
    if (sectorSelect) sectorSelect.value = planilha.sectorId || '';
    if (isSharedCheckbox) isSharedCheckbox.checked = planilha.isShared || false;

    // Armazenar ID para update
    modal.dataset.planilhaId = id;
    modal.dataset.isEditing = 'true';

    modal.style.display = 'flex';
}

async function deletePlanilha(id) {
    try {
        const deleted = await planilhasCrud.delete(id);
        if (deleted) {
            await loadPlanilhas();
        }
    } catch (error) {
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
