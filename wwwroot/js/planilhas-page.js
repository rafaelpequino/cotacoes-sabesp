// Página de Planilhas - CRUD funcional

let planilhasCrud = new CrudManager('spreadsheets');
let planilhasPageData = [];

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

document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOMContentLoaded - Carregando planilhas...');
    await loadPlanilhas();
    setupEventListeners();
});

async function loadPlanilhas() {
    try {
        console.log('Carregando planilhas da API...');
        planilhasPageData = await api.getSpreadsheets();
        console.log('Planilhas carregadas:', planilhasPageData);
        renderPlanilhasTable(planilhasPageData);
    } catch (error) {
        console.error('Erro ao carregar planilhas:', error);
        planilhasPageData = [];
        renderPlanilhasTable([]);
    }
}

function renderPlanilhasTable(planilhas) {
    const table = document.getElementById('planilhasTableElement');
    const emptyMessage = document.getElementById('emptyMessage');
    const tbody = table ? table.querySelector('tbody') : null;
    
    if (!table || !emptyMessage || !tbody) {
        console.error('Elementos não encontrados:', { table, emptyMessage, tbody });
        return;
    }

    tbody.innerHTML = '';

    if (!planilhas || planilhas.length === 0) {
        console.log('Planilhas vazio, mostrando mensagem');
        table.style.display = 'none';
        emptyMessage.style.display = 'block';
        return;
    }

    console.log('Planilhas encontradas:', planilhas.length);
    table.style.display = 'table';
    emptyMessage.style.display = 'none';

    planilhas.forEach(planilha => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${planilha.name || '-'}</td>
            <td>${new Date(planilha.createdAt).toLocaleDateString('pt-BR')}</td>
            <td>${planilha.description || '-'}</td>
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
    const description = form.querySelector('textarea')?.value || '';
    const fileInput = form.querySelector('input[type="file"]');
    
    console.log('Nome da planilha:', name);
    console.log('Descrição:', description);
    console.log('Arquivo:', fileInput?.files?.[0]?.name);
    
    if (!name) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo obrigatório',
            text: 'Por favor, preencha o nome da planilha'
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
        console.log('Fazendo upload do arquivo:', file.name);
        const uploadResult = await api.uploadFile(file);
        console.log('Upload bem-sucedido:', uploadResult);

        // Extrair a extensão do arquivo
        const fileExtension = fileName.split('.').pop() || 'unknown';

        // Criar a planilha no banco com o fileKey
        const data = {
            name: name,
            description: description || null,
            filePath: uploadResult.fileKey,  // Usar a chave gerada pelo servidor
            fileType: fileExtension,
            fileSize: file.size,
            isShared: false
        };

        console.log('Dados da planilha:', data);
        const result = await api.createSpreadsheet(data);
        console.log('Planilha criada com sucesso:', result);

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
        console.error('Erro ao salvar planilha:', error);
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
        console.log('Baixando planilha:', planilha.name);
        
        // Mostrar loading
        Swal.fire({
            title: 'Baixando arquivo...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

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
        console.error('Erro ao fazer download:', error);
        const mensagem = humanizeError(error.message);
        Swal.fire({
            icon: 'error',
            title: 'Erro ao Baixar',
            text: mensagem || 'Não foi possível fazer o download da planilha'
        });
    }
}

async function deletePlanilha(id) {
    console.log('Deletando planilha com ID:', id);
    try {
        const deleted = await planilhasCrud.delete(id);
        if (deleted) {
            console.log('Planilha deletada, recarregando lista...');
            await loadPlanilhas();
        }
    } catch (error) {
        console.error('Erro ao deletar planilha:', error);
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
