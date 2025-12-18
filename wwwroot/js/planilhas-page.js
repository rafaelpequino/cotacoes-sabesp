// Página de Planilhas - CRUD funcional

let planilhasCrud = new CrudManager('spreadsheets');
let planilhasPageData = [];
let sectorsData = [];

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
                option.textContent = sector.name;
                sectorSelect.appendChild(option);
            });
        }

        // Popular o select de filtro
        const filterSelect = document.getElementById('filterSelect');
        if (filterSelect && sectorsData && sectorsData.length > 0) {
            sectorsData.forEach(sector => {
                const option = document.createElement('option');
                option.value = sector.id;
                option.textContent = sector.name;
                filterSelect.appendChild(option);
            });
        }
    } catch (error) {
        sectorsData = [];
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    await loadSectors();
    await loadPlanilhas();
    setupEventListeners();
});

async function loadPlanilhas() {
    try {
        planilhasPageData = await api.getSpreadsheets();
        renderPlanilhasTable(planilhasPageData);
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
        const sectorName = sector ? sector.name : '-';
        
        row.innerHTML = `
            <td>${planilha.name || '-'}</td>
            <td>${new Date(planilha.createdAt).toLocaleDateString('pt-BR')}</td>
            <td>${sectorName}</td>
            <td>Você</td>
            <td>${planilha.fileSize ? (planilha.fileSize / 1024).toFixed(2) + ' KB' : '-'}</td>
            <td class="actions">
                <button class="action-btn" title="Download" onclick="downloadPlanilha(${planilha.id})">⬇️</button>
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

    // Filtro por setor dispara requisição automaticamente
    if (filterSelect) {
        filterSelect.addEventListener('change', applyFilters);
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
        planilhasPageData = await api.getSpreadsheets(search || null, sort || null, filter || null);
        renderPlanilhasTable(planilhasPageData);
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
    loadPlanilhas();
}

function openUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'flex';
    } else {
        alert('Funcionalidade de upload de planilhas em desenvolvimento');
    }
}

function closeUploadModal() {
    const modal = document.getElementById('uploadModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

async function savePlanilha() {
    const modal = document.getElementById('uploadModal');
    const form = modal.querySelector('form');
    
    // Buscar input pelo placeholder ou label
    const nameInput = form.querySelector('input[type="text"]');
    const name = nameInput?.value?.trim() || '';
    const sectorSelect = document.getElementById('sectorSelect');
    const sector = sectorSelect?.value || '';
    const description = form.querySelector('textarea')?.value || '';
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

    if (!fileInput || !fileInput.files.length) {
        Swal.fire({
            icon: 'warning',
            title: 'Arquivo obrigatório',
            text: 'Por favor, selecione um arquivo'
        });
        return;
    }

    const file = fileInput.files[0];
    
    // Validar extensão do arquivo
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xlsm') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
        Swal.fire({
            icon: 'warning',
            title: 'Arquivo inválido',
            text: 'Por favor, selecione um arquivo Excel (.xlsx, .xlsm, .xls) ou CSV (.csv)',
            confirmButtonColor: '#13d0ff'
        });
        return;
    }

    // Mostrar loading
    Swal.fire({
        title: 'Enviando arquivo...',
        text: 'Por favor, aguarde.',
        icon: 'info',
        allowOutsideClick: false,
        allowEscapeKey: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        // Fazer upload do arquivo
        const uploadResult = await api.uploadFile(file);

        // Extrair a extensão do arquivo
        const fileExtension = fileName.split('.').pop() || 'unknown';

        // Criar a planilha no banco com o fileKey
        const data = {
            name: name,
            sectorId: parseInt(sector),
            description: description || null,
            filePath: uploadResult.fileKey,  // Usar a chave gerada pelo servidor
            fileType: fileExtension,
            fileSize: file.size,
            isShared: false
        };

        const result = await api.createSpreadsheet(data);

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
