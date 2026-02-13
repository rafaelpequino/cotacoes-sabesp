// Gerenciamento de Anexos com Descrição
// Este arquivo gerencia upload, visualização e exclusão de anexos PDF com descrições

let pendingAttachments = []; // Array de { file, description }
let currentServiceAttachments = []; // Anexos existentes
let currentEntityType = ''; // Tipo da entidade (Service ou Input)
let currentEntityId = 0; // ID da entidade

// Inicializar handlers de anexos
function setupAttachmentHandlers() {
    const createInput = document.getElementById('createAttachmentInput');
    const editInput = document.getElementById('editAttachmentInput');
    
    if (createInput) {
        createInput.addEventListener('change', handleCreateAttachmentsChange);
    }
    
    if (editInput) {
        editInput.addEventListener('change', handleEditAttachmentsChange);
    }
}

async function handleCreateAttachmentsChange(event) {
    const files = Array.from(event.target.files);
    
    // Validar tipo de arquivo
    const invalidFiles = files.filter(f => !f.name.toLowerCase().endsWith('.pdf'));
    if (invalidFiles.length > 0) {
        await Swal.fire({
            icon: 'error',
            title: 'Arquivo Inválido',
            text: 'Somente arquivos PDF são permitidos',
            confirmButtonColor: '#d32f2f'
        });
        event.target.value = '';
        return;
    }
    
    // Solicitar descrição para cada arquivo
    for (const file of files) {
        const { value: description } = await Swal.fire({
            title: `Descrição do anexo`,
            html: `
                <p style="margin-bottom: 10px; color: #666;">Arquivo: <strong>${file.name}</strong></p>
                <input id="swal-input1" class="swal2-input" placeholder="Ex: Proposta comercial, Orçamento, etc." style="width: 90%; max-width: 100%; box-sizing: border-box;">
            `,
            width: '600px',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Adicionar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#13d0ff',
            cancelButtonColor: '#999',
            preConfirm: () => {
                const desc = document.getElementById('swal-input1').value;
                if (!desc || desc.trim() === '') {
                    Swal.showValidationMessage('A descrição é obrigatória');
                    return false;
                }
                return desc.trim();
            }
        });
        
        if (description) {
            // Verificar se já existe
            const exists = pendingAttachments.find(a => a.file.name === file.name && a.file.size === file.size);
            if (!exists) {
                pendingAttachments.push({ file, description });
            }
        }
    }
    
    renderPendingAttachments('create');
    event.target.value = '';
}

async function handleEditAttachmentsChange(event) {
    const files = Array.from(event.target.files);
    
    // Validar tipo de arquivo
    const invalidFiles = files.filter(f => !f.name.toLowerCase().endsWith('.pdf'));
    if (invalidFiles.length > 0) {
        await Swal.fire({
            icon: 'error',
            title: 'Arquivo Inválido',
            text: 'Somente arquivos PDF são permitidos',
            confirmButtonColor: '#d32f2f'
        });
        event.target.value = '';
        return;
    }
    
    // Solicitar descrição para cada arquivo
    for (const file of files) {
        const { value: description } = await Swal.fire({
            title: `Descrição do anexo`,
            html: `
                <p style="margin-bottom: 10px; color: #666;">Arquivo: <strong>${file.name}</strong></p>
                <input id="swal-input1" class="swal2-input" placeholder="Ex: Proposta comercial, Orçamento, etc." style="width: 90%; max-width: 100%; box-sizing: border-box;">
            `,
            width: '600px',
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Adicionar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#13d0ff',
            cancelButtonColor: '#999',
            preConfirm: () => {
                const desc = document.getElementById('swal-input1').value;
                if (!desc || desc.trim() === '') {
                    Swal.showValidationMessage('A descrição é obrigatória');
                    return false;
                }
                return desc.trim();
            }
        });
        
        if (description) {
            const exists = pendingAttachments.find(a => a.file.name === file.name && a.file.size === file.size);
            if (!exists) {
                pendingAttachments.push({ file, description });
            }
        }
    }
    
    renderEditAttachments();
    event.target.value = '';
}

function renderPendingAttachments(mode) {
    const listId = mode === 'create' ? 'createAttachmentsList' : 'editAttachmentsList';
    const list = document.getElementById(listId);
    
    if (!list) return;
    
    list.innerHTML = '';
    
    if (pendingAttachments.length === 0) {
        list.innerHTML = '<p style="color: #999; font-size: 14px; margin: 10px 0;">Nenhum arquivo selecionado</p>';
        return;
    }
    
    pendingAttachments.forEach((attachment, index) => {
        const item = document.createElement('div');
        item.className = 'attachment-item';
        item.style.cssText = 'display: flex; flex-direction: column; padding: 10px; background: #f5f5f5; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #13d0ff;';
        
        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                <span style="font-size: 14px; font-weight: 500;">📄 ${attachment.file.name}</span>
                <button type="button" onclick="removePendingAttachment(${index}, '${mode}')" style="background: #d32f2f; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remover</button>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666;">
                <span><strong>Descrição:</strong> ${attachment.description}</span>
                <span>${formatFileSize(attachment.file.size)}</span>
            </div>
        `;
        
        list.appendChild(item);
    });
}

function removePendingAttachment(index, mode) {
    pendingAttachments.splice(index, 1);
    if (mode === 'edit') {
        renderEditAttachments();
    } else {
        renderPendingAttachments(mode);
    }
}

async function loadAttachments(entityType, entityId) {
    try {
        const attachments = await api.getAttachments(entityType, entityId);
        currentServiceAttachments = attachments;
        currentEntityType = entityType;
        currentEntityId = entityId;
        return attachments;
    } catch (error) {
        console.error('Erro ao carregar anexos:', error);
        currentServiceAttachments = [];
        currentEntityType = '';
        currentEntityId = 0;
        return [];
    }
}

function renderEditAttachments() {
    const list = document.getElementById('editAttachmentsList');
    if (!list) return;
    
    let html = '';
    
    // Mostrar anexos existentes
    if (currentServiceAttachments.length > 0) {
        html += '<div style="margin-bottom: 12px;"><strong>Anexos existentes:</strong></div>';
        currentServiceAttachments.forEach(att => {
            html += `
                <div class="attachment-item" style="display: flex; flex-direction: column; padding: 10px; background: #e8f4f8; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #19d6ff;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 14px; font-weight: 500;">📄 ${att.originalFileName}</span>
                        <div>
                            <button type="button" onclick="downloadAttachment(${att.id}, '${att.originalFileName}')" style="background: #19d6ff; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px; margin-right: 4px;">Baixar</button>
                            ${att.canEdit ? `<button type="button" onclick="deleteAttachment(${att.id}, 'edit')" style="background: #d32f2f; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Excluir</button>` : ''}
                        </div>
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        <span><strong>Descrição:</strong> ${att.description}</span>
                        <span style="float: right;">${formatFileSize(att.fileSize)}</span>
                    </div>
                </div>
            `;
        });
    }
    
    // Mostrar arquivos pendentes
    if (pendingAttachments.length > 0) {
        html += '<div style="margin-top: 16px; margin-bottom: 12px;"><strong>Novos anexos a adicionar:</strong></div>';
        pendingAttachments.forEach((attachment, index) => {
            html += `
                <div class="attachment-item" style="display: flex; flex-direction: column; padding: 10px; background: #f5f5f5; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #13d0ff;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                        <span style="font-size: 14px; font-weight: 500;">📄 ${attachment.file.name}</span>
                        <button type="button" onclick="removePendingAttachment(${index}, 'edit')" style="background: #d32f2f; color: white; border: none; border-radius: 4px; padding: 4px 8px; cursor: pointer; font-size: 12px;">Remover</button>
                    </div>
                    <div style="font-size: 12px; color: #666;">
                        <span><strong>Descrição:</strong> ${attachment.description}</span>
                        <span style="float: right;">${formatFileSize(attachment.file.size)}</span>
                    </div>
                </div>
            `;
        });
    }
    
    if (currentServiceAttachments.length === 0 && pendingAttachments.length === 0) {
        html = '<p style="color: #999; font-size: 14px; margin: 10px 0;">Nenhum anexo</p>';
    }
    
    list.innerHTML = html;
}

function renderViewAttachments() {
    const list = document.getElementById('viewAttachmentsList');
    if (!list) return;
    
    if (currentServiceAttachments.length === 0) {
        list.innerHTML = '<p class="view-text" style="color: #999;">Nenhum anexo disponível</p>';
        return;
    }
    
    let html = '';
    
    // Botão "Baixar Tudo" se houver mais de 1 anexo
    if (currentServiceAttachments.length > 1) {
        html += `
            <div style="margin-bottom: 12px; text-align: right;">
                <button type="button" onclick="downloadAllAttachments()" style="background: #4caf50; color: white; border: none; border-radius: 4px; padding: 8px 16px; cursor: pointer; font-size: 14px; font-weight: 500;">
                    📦 Baixar Todos (${currentServiceAttachments.length})
                </button>
            </div>
        `;
    }
    
    currentServiceAttachments.forEach(att => {
        html += `
            <div class="attachment-item" style="display: flex; flex-direction: column; padding: 10px; background: #e8f4f8; border-radius: 4px; margin-bottom: 8px; border-left: 3px solid #19d6ff;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                    <span style="font-size: 14px; font-weight: 500;">📄 ${att.originalFileName}</span>
                    <div>
                        <button type="button" onclick="viewAttachmentInNewTab(${att.id})" style="background: #ff9800; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 13px; margin-right: 4px;">👁 Visualizar</button>
                        <button type="button" onclick="downloadAttachment(${att.id}, '${att.originalFileName}')" style="background: #19d6ff; color: white; border: none; border-radius: 4px; padding: 6px 12px; cursor: pointer; font-size: 13px;">⬇ Baixar</button>
                    </div>
                </div>
                <div style="font-size: 12px; color: #666;">
                    <span><strong>Descrição:</strong> ${att.description}</span>
                    <span style="float: right;">${formatFileSize(att.fileSize)}</span>
                </div>
            </div>
        `;
    });
    
    list.innerHTML = html;
}

async function downloadAttachment(id, filename) {
    try {
        await api.downloadAttachment(id, filename);
    } catch (error) {
        await Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro ao baixar anexo',
            confirmButtonColor: '#d32f2f'
        });
    }
}

async function deleteAttachment(id, mode) {
    const result = await Swal.fire({
        title: 'Excluir Anexo',
        text: 'Tem certeza que deseja excluir este anexo?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d32f2f',
        cancelButtonColor: '#999',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        try {
            await api.deleteAttachment(id);
            
            // Remover da lista local
            currentServiceAttachments = currentServiceAttachments.filter(a => a.id !== id);
            
            if (mode === 'edit') {
                renderEditAttachments();
            }
            
            await Swal.fire({
                icon: 'success',
                title: 'Sucesso',
                text: 'Anexo excluído com sucesso',
                confirmButtonColor: '#13d0ff',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            await Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Erro ao excluir anexo',
                confirmButtonColor: '#d32f2f'
            });
        }
    }
}

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

async function uploadPendingAttachments(entityType, entityId) {
    if (pendingAttachments.length === 0) {
        return;
    }
    
    try {
        for (const attachment of pendingAttachments) {
            await api.uploadAttachment(entityType, entityId, attachment.file, attachment.description);
        }
        pendingAttachments = [];
    } catch (error) {
        console.error('Erro ao fazer upload de anexos:', error);
        throw new Error('Erro ao fazer upload dos anexos: ' + error.message);
    }
}

// Validar se há anexos antes de salvar
function validateAttachments() {
    if (pendingAttachments.length === 0) {
        return {
            valid: false,
            message: 'Adicione pelo menos 1 arquivo PDF com descrição'
        };
    }
    return { valid: true };
}

// Visualizar anexo em nova aba
async function viewAttachmentInNewTab(id) {
    try {
        // Como PDFs precisam de autenticação, vamos fazer um fetch e abrir em nova aba
        const token = await api.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${api.baseUrl}/attachments/${id}/download`, {
            method: 'GET',
            headers
        });

        if (!response.ok) {
            throw new Error(`Erro ${response.status}`);
        }

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        
        // Liberar URL após um tempo (o navegador já carregou)
        setTimeout(() => {
            window.URL.revokeObjectURL(url);
        }, 1000);
    } catch (error) {
        await Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Erro ao visualizar anexo',
            confirmButtonColor: '#d32f2f'
        });
    }
}

// Baixar todos os anexos em um arquivo ZIP
async function downloadAllAttachments() {
    if (currentServiceAttachments.length === 0) {
        return;
    }
    
    if (!currentEntityType || !currentEntityId) {
        await Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: 'Informações da entidade não encontradas',
            confirmButtonColor: '#d32f2f'
        });
        return;
    }
    
    const result = await Swal.fire({
        title: 'Baixar Todos os Anexos',
        text: `Deseja baixar ${currentServiceAttachments.length} arquivo(s) em um arquivo ZIP?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#4caf50',
        cancelButtonColor: '#999',
        confirmButtonText: 'Sim, baixar ZIP',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        try {
            // Mostrar loading
            Swal.fire({
                title: 'Preparando arquivo ZIP...',
                text: 'Por favor aguarde',
                allowOutsideClick: false,
                allowEscapeKey: false,
                showConfirmButton: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });
            
            // Baixar ZIP com todos os anexos
            await api.downloadAllAttachments(currentEntityType, currentEntityId);
            
            Swal.close();
            
            await Swal.fire({
                icon: 'success',
                title: 'Sucesso!',
                text: `Arquivo ZIP com ${currentServiceAttachments.length} anexo(s) baixado com sucesso`,
                confirmButtonColor: '#4caf50',
                timer: 2000,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.close();
            await Swal.fire({
                icon: 'error',
                title: 'Erro',
                text: 'Erro ao criar arquivo ZIP: ' + (error.message || 'Erro desconhecido'),
                confirmButtonColor: '#d32f2f'
            });
        }
    }
}
