// ========================================
// BULK IMPORT - IMPORTAÇÃO EM MASSA
// ========================================

let bulkCotacoesData = [];
let currentViewAttachmentsIndex = null;

// Abrir modal de importação em massa
function openBulkImportModal() {
    const modal = document.getElementById('bulkImportModal');
    if (modal) {
        modal.style.display = 'block';
        loadSectorsForBulk();
    }
}

// Fechar modal de importação em massa
function closeBulkImportModal() {
    const modal = document.getElementById('bulkImportModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// Reset completo
function resetBulkImport() {
    bulkCotacoesData = [];
    currentViewAttachmentsIndex = null;
    document.getElementById('bulkPasteArea').innerHTML = `
        <button onclick="bulkPasteFromClipboard()" class="btn btn-primary">
            📋 Colar do Excel
        </button>
    `;
    document.getElementById('bulkPreviewArea').innerHTML = '';
}

// Colar do clipboard
async function bulkPasteFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        if (!text || text.trim() === '') {
            alert('⚠️ Nenhum dado encontrado na área de transferência!');
            return;
        }
        processBulkData(text);
    } catch (err) {
        alert('❌ Erro ao ler dados da área de transferência. Verifique as permissões do navegador.');
    }
}

// Função para limpar valores monetários
function parseMoneyValue(value) {
    if (!value || value === '') return 0;
    const cleaned = value.toString()
        .replace(/R\$/g, '')
        .replace(/\./g, '')
        .replace(/,/g, '.')
        .trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

// Processar dados colados
function processBulkData(text) {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    
    if (lines.length < 2 || lines.length % 2 !== 0) {
        alert('⚠️ Formato inválido! Cada cotação deve ter 2 linhas (nomes das empresas + dados da cotação).');
        return;
    }

    bulkCotacoesData = [];
    
    // Processar pares de linhas
    for (let i = 0; i < lines.length; i += 2) {
        const lineNomes = lines[i].split('\t');
        const lineDados = lines[i + 1].split('\t');
        
        if (lineDados.length < 21) {
            continue;
        }

            // Coletar apenas empresas que existem (posições 14-18 para NOMES e VALORES)
            const empresasTemp = [];
            for (let j = 14; j <= 18; j++) {
                const nome = (lineNomes[j] || '').trim();
                const valor = parseMoneyValue(lineDados[j]);
                if (nome || valor > 0) {
                    empresasTemp.push({ nome, valor });
                }
            }
            
            const cotacao = {
                id: `bulk_${Date.now()}_${i}`,
                sectorId: '',
                i0Original: (lineDados[0] || '').trim(),
                item: (lineDados[1] || '').trim(),
                unidade: (lineDados[2] || '').trim(),
                adotada: parseMoneyValue(lineDados[3]),
                precoMontagem: parseMoneyValue(lineDados[4]),
                precoAdotado: parseMoneyValue(lineDados[6]),
                mediaAdotada: parseMoneyValue(lineDados[9]),
                mediaSaneada: parseMoneyValue(lineDados[8]),
                menorValor: parseMoneyValue(lineDados[9]),
                mediaAritmetica: parseMoneyValue(lineDados[10]),
                mediana: parseMoneyValue(lineDados[11]),
                empresa1: empresasTemp[0]?.valor || 0,
                empresa2: empresasTemp[1]?.valor || 0,
                empresa3: empresasTemp[2]?.valor || 0,
                empresa4: empresasTemp[3]?.valor || 0,
                empresa5: empresasTemp[4]?.valor || 0,
                empresa6: empresasTemp[5]?.valor || 0,
                nomeEmpresa1: empresasTemp[0]?.nome || '',
                nomeEmpresa2: empresasTemp[1]?.nome || '',
                nomeEmpresa3: empresasTemp[2]?.nome || '',
                nomeEmpresa4: empresasTemp[3]?.nome || '',
                nomeEmpresa5: empresasTemp[4]?.nome || '',
                nomeEmpresa6: empresasTemp[5]?.nome || '',
                justificativa: (lineDados[20] || '').trim().replace(/\r/g, ''),
                attachments: []
            };

        bulkCotacoesData.push(cotacao);
    }

    if (bulkCotacoesData.length === 0) {
        alert('⚠️ Nenhuma cotação válida foi encontrada!');
        return;
    }

    displayBulkPreview();
    loadSectorsForBulk();
}

// Exibir pré-visualização
function displayBulkPreview() {
    const previewArea = document.getElementById('bulkPreviewArea');
    const pasteArea = document.getElementById('bulkPasteArea');
    
    pasteArea.innerHTML = ''; // Limpar área de colagem

    const count = bulkCotacoesData.length;
    const plural = count === 1 ? 'cotação' : 'cotações';

    let html = `
        <div class="bulk-preview-header">
            <div class="bulk-preview-header-left">
                <span class="bulk-count">${count} ${plural}</span>
                <div class="bulk-sector-all">
                    <label>Definir setor para todos:</label>
                    <select id="bulkSectorAll" onchange="applyBulkSectorToAll()">
                        <option value="">Selecione...</option>
                    </select>
                </div>
                <button onclick="clearBulkData()" class="btn btn-secondary btn-limpar-bulk">
                    Limpar e recomeçar
                </button>
            </div>
        </div>

        <div class="bulk-table-container">
            <table class="bulk-table">
                <thead>
                    <tr>
                        <th>Setor</th>
                        <th>I0 Original</th>
                        <th>Item</th>
                        <th>Unidade</th>
                        <th>Preços</th>
                        <th>Empresas</th>
                        <th>Anexos</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
    `;

    bulkCotacoesData.forEach((cotacao, index) => {
        const empresasCount = [
            cotacao.nomeEmpresa1,
            cotacao.nomeEmpresa2,
            cotacao.nomeEmpresa3,
            cotacao.nomeEmpresa4,
            cotacao.nomeEmpresa5,
            cotacao.nomeEmpresa6
        ].filter(n => n && n.trim() !== '').length;

        const attachCount = cotacao.attachments?.length || 0;

        html += `
            <tr>
                <td>
                    <select class="bulk-sector-select" data-index="${index}">
                        <option value="">Selecione...</option>
                    </select>
                </td>
                <td>${cotacao.i0Original}</td>
                <td>${cotacao.item}</td>
                <td>${cotacao.unidade}</td>
                <td>
                    <button class="btn-action btn-view-prices" onclick="openBulkPricesModal(${index})">
                        Ver preços
                    </button>
                </td>
                <td>
                    <button class="btn-action btn-view-companies" onclick="openBulkCompaniesModal(${index})">
                        Ver empresas (${empresasCount})
                    </button>
                </td>
                <td>
                    <button class="btn-action btn-view-attachments" onclick="openBulkViewAttachmentsModal(${index})">
                        ${attachCount > 0 ? `${attachCount} anexo(s)` : 'Nenhum anexo'}
                    </button>
                </td>
                <td>
                    <button class="btn-remove" onclick="removeBulkItem(${index})" title="Remover cotação">🗑️</button>
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>

        <div style="margin-top: 20px; text-align: right;">
            <button onclick="saveBulkCotacoes()" class="btn btn-primary">
                Salvar todas as cotações
            </button>
        </div>
    `;

    previewArea.innerHTML = html;
}

// Atualizar contador de anexos
function updateAttachmentCount(index) {
    const cotacao = bulkCotacoesData[index];
    const count = cotacao.attachments?.length || 0;
    const btn = document.querySelector(`button[onclick="openBulkViewAttachmentsModal(${index})"]`);
    if (btn) {
        btn.textContent = count > 0 ? `📎 ${count} anexo(s)` : '📎 Nenhum anexo';
    }
}

// Remover item da lista
function removeBulkItem(index) {
    if (confirm('Deseja realmente remover esta cotação?')) {
        bulkCotacoesData.splice(index, 1);
        if (bulkCotacoesData.length === 0) {
            resetBulkImport();
        } else {
            displayBulkPreview();
            loadSectorsForBulk();
        }
    }
}

// Carregar setores
async function loadSectorsForBulk() {
    try {
        const sectors = await api.getSectors();

        // Preencher dropdown global
        const globalSelect = document.getElementById('bulkSectorAll');
        if (globalSelect) {
            globalSelect.innerHTML = '<option value="">Selecione...</option>';
            sectors.forEach(sector => {
                globalSelect.innerHTML += `<option value="${sector.id}">${sector.name}</option>`;
            });
        }

        // Preencher dropdowns individuais
        const individualSelects = document.querySelectorAll('.bulk-sector-select');
        individualSelects.forEach((select, idx) => {
            select.innerHTML = '<option value="">Selecione...</option>';
            sectors.forEach(sector => {
                const selected = bulkCotacoesData[idx]?.sectorId === sector.id ? 'selected' : '';
                select.innerHTML += `<option value="${sector.id}" ${selected}>${sector.name}</option>`;
            });
            
            select.addEventListener('change', (e) => {
                const index = parseInt(e.target.dataset.index);
                bulkCotacoesData[index].sectorId = e.target.value;
            });
        });

    } catch (error) {
        alert('❌ Erro ao carregar setores');
    }
}

// Aplicar setor a todos
function applyBulkSectorToAll() {
    const globalSelect = document.getElementById('bulkSectorAll');
    const sectorId = globalSelect.value;
    
    if (!sectorId) return;

    bulkCotacoesData.forEach(cotacao => {
        cotacao.sectorId = sectorId;
    });

    document.querySelectorAll('.bulk-sector-select').forEach(select => {
        select.value = sectorId;
    });
}

// ========================================
// MODAL: VER EMPRESAS
// ========================================
function openBulkCompaniesModal(index) {
    const cotacao = bulkCotacoesData[index];
    const modal = document.getElementById('bulkCompaniesModal');
    const content = document.getElementById('bulkCompaniesContent');

    const empresas = [
        { nome: cotacao.nomeEmpresa1, valor: cotacao.empresa1 },
        { nome: cotacao.nomeEmpresa2, valor: cotacao.empresa2 },
        { nome: cotacao.nomeEmpresa3, valor: cotacao.empresa3 },
        { nome: cotacao.nomeEmpresa4, valor: cotacao.empresa4 },
        { nome: cotacao.nomeEmpresa5, valor: cotacao.empresa5 },
        { nome: cotacao.nomeEmpresa6, valor: cotacao.empresa6 }
    ].filter(e => e.nome && e.nome.trim() !== '');

    let html = '<h3>📊 Cotações das Empresas</h3><div class="bulk-companies-grid">';

    empresas.forEach((emp, i) => {
        html += `
            <div class="bulk-company-item">
                <strong>${emp.nome || `EMPRESA ${i+1}`}</strong>
                <span>R$ ${emp.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
        `;
    });

    html += '</div>';
    content.innerHTML = html;
    modal.style.display = 'block';
}

function closeBulkCompaniesModal() {
    document.getElementById('bulkCompaniesModal').style.display = 'none';
}

// ========================================
// MODAL: VER PREÇOS
// ========================================
function openBulkPricesModal(index) {
    const cotacao = bulkCotacoesData[index];
    const modal = document.getElementById('bulkPricesModal');
    const content = document.getElementById('bulkPricesContent');

    const precos = [
        { label: '💰 Preço Adotado', valor: cotacao.precoAdotado, highlight: true },
        { label: '📊 Média Saneada', valor: cotacao.mediaSaneada, highlight: true },
        { label: '📉 Menor Valor', valor: cotacao.menorValor },
        { label: '📈 Média Aritmética', valor: cotacao.mediaAritmetica },
        { label: '📊 Mediana', valor: cotacao.mediana },
        { label: '🔧 Adotada - Preço Forn.', valor: cotacao.adotada },
        { label: '⚙️ Preço de Montagem', valor: cotacao.precoMontagem }
    ];

    let html = '<h3>💰 Preços e Médias</h3><div class="bulk-prices-list">';

    precos.forEach(p => {
        const highlightClass = p.highlight ? 'highlight' : '';
        html += `
            <div class="bulk-price-item ${highlightClass}">
                <span>${p.label}</span>
                <strong>R$ ${p.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
            </div>
        `;
    });

    html += '</div>';
    content.innerHTML = html;
    modal.style.display = 'block';
}

function closeBulkPricesModal() {
    document.getElementById('bulkPricesModal').style.display = 'none';
}

// ========================================
// MODAL: VER/ADICIONAR ANEXOS
// ========================================
let pendingBulkFiles = null;
let pendingBulkFileInput = null;

function openBulkViewAttachmentsModal(index) {
    currentViewAttachmentsIndex = index;
    const modal = document.getElementById('bulkViewAttachmentsModal');
    modal.style.display = 'block';
    displayBulkAttachments(index);
}

function closeBulkViewAttachmentsModal() {
    document.getElementById('bulkViewAttachmentsModal').style.display = 'none';
    currentViewAttachmentsIndex = null;
}

function handleBulkFileUpload(e) {
    const files = Array.from(e.target.files);
    if (files.length === 0 || currentViewAttachmentsIndex === null) return;

    // Armazenar os arquivos e o input para processar depois
    pendingBulkFiles = files;
    pendingBulkFileInput = e.target;
    
    // Abrir modal de descrição
    openBulkAttachmentDescriptionModal();
}

// Modal de descrição do anexo
function openBulkAttachmentDescriptionModal() {
    const modal = document.getElementById('bulkAttachmentDescriptionModal');
    const input = document.getElementById('bulkAttachmentDescription');
    input.value = '';
    modal.style.display = 'block';
    
    // Focar no input
    setTimeout(() => input.focus(), 100);
    
    // Permitir Enter para confirmar
    input.onkeypress = function(e) {
        if (e.key === 'Enter') {
            confirmBulkAttachmentDescription();
        }
    };
}

function closeBulkAttachmentDescriptionModal() {
    const modal = document.getElementById('bulkAttachmentDescriptionModal');
    modal.style.display = 'none';
    
    // Limpar arquivos pendentes
    if (pendingBulkFileInput) {
        pendingBulkFileInput.value = '';
    }
    pendingBulkFiles = null;
    pendingBulkFileInput = null;
}

function confirmBulkAttachmentDescription() {
    const descricao = document.getElementById('bulkAttachmentDescription').value.trim();
    
    if (!descricao) {
        alert('⚠️ Descrição é obrigatória!');
        return;
    }

    if (pendingBulkFiles && currentViewAttachmentsIndex !== null) {
        const cotacao = bulkCotacoesData[currentViewAttachmentsIndex];
        
        pendingBulkFiles.forEach(file => {
            cotacao.attachments.push({
                file: file,
                description: descricao,
                filename: file.name
            });
        });

        if (pendingBulkFileInput) {
            pendingBulkFileInput.value = '';
        }
        
        displayBulkAttachments(currentViewAttachmentsIndex);
        updateAttachmentCount(currentViewAttachmentsIndex);
    }
    
    closeBulkAttachmentDescriptionModal();
}

function displayBulkAttachments(index) {
    const cotacao = bulkCotacoesData[index];
    const container = document.getElementById('bulkViewAttachmentsList');

    if (!cotacao.attachments || cotacao.attachments.length === 0) {
        container.innerHTML = '<p>Nenhum anexo adicionado.</p>';
        return;
    }

    let html = '';
    cotacao.attachments.forEach((att, attIndex) => {
        html += `
            <div class="bulk-view-attachment-item">
                <div>
                    <strong>📎 ${att.filename}</strong>
                    <p>${att.description}</p>
                </div>
                <button class="btn-remove" onclick="removeBulkAttachment(${index}, ${attIndex})">❌</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

function removeBulkAttachment(cotacaoIndex, attachmentIndex) {
    if (confirm('Deseja remover este anexo?')) {
        bulkCotacoesData[cotacaoIndex].attachments.splice(attachmentIndex, 1);
        displayBulkAttachments(cotacaoIndex);
        updateAttachmentCount(cotacaoIndex);
    }
}

// ========================================
// LIMPAR DADOS
// ========================================
function clearBulkData() {
    if (typeof Swal === 'undefined') {
        if (confirm('⚠️ Deseja realmente limpar todos os dados e recomeçar?')) {
            resetBulkImport();
        }
        return;
    }

    Swal.fire({
        title: '⚠️ Limpar tudo?',
        text: 'Todos os dados serão perdidos. Deseja continuar?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, limpar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            resetBulkImport();
        }
    });
}

// ========================================
// SALVAR TODAS AS COTAÇÕES
// ========================================
async function saveBulkCotacoes() {
    // Validar setores
    const semSetor = bulkCotacoesData.filter(c => !c.sectorId || c.sectorId === '');
    if (semSetor.length > 0) {
        alert(`⚠️ ${semSetor.length} cotação(ões) sem setor definido!`);
        return;
    }

    // Loading
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: 'Salvando...',
            text: 'Por favor, aguarde...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    let sucessos = 0;
    let erros = 0;

    for (const cotacao of bulkCotacoesData) {
        try {
            // Preparar dados para API
            const serviceData = {
                sectorId: parseInt(cotacao.sectorId),
                i0Original: cotacao.i0Original,
                item: cotacao.item,
                unidade: cotacao.unidade,
                adotada: cotacao.adotada,
                precoMontagem: cotacao.precoMontagem,
                precoAdotado: cotacao.precoAdotado,
                mediaAdotada: cotacao.mediaAdotada,
                mediaSaneada: cotacao.mediaSaneada,
                menorValor: cotacao.menorValor,
                mediaAritmetica: cotacao.mediaAritmetica,
                mediana: cotacao.mediana,
                empresa1: cotacao.empresa1,
                empresa2: cotacao.empresa2,
                empresa3: cotacao.empresa3,
                empresa4: cotacao.empresa4,
                empresa5: cotacao.empresa5,
                empresa6: cotacao.empresa6,
                nomeEmpresa1: cotacao.nomeEmpresa1,
                nomeEmpresa2: cotacao.nomeEmpresa2,
                nomeEmpresa3: cotacao.nomeEmpresa3,
                nomeEmpresa4: cotacao.nomeEmpresa4,
                nomeEmpresa5: cotacao.nomeEmpresa5,
                nomeEmpresa6: cotacao.nomeEmpresa6,
                justificativa: cotacao.justificativa
            };

            // Criar serviço
            const createdService = await api.createService(serviceData);

            // Upload de anexos
            if (cotacao.attachments && cotacao.attachments.length > 0) {
                for (const attachment of cotacao.attachments) {
                    const formData = new FormData();
                    formData.append('file', attachment.file);
                    formData.append('description', attachment.description);
                    formData.append('entityType', 'Service');
                    formData.append('entityId', createdService.id);

                    await api.uploadAttachment(formData);
                }
            }

            sucessos++;
        } catch (error) {
            erros++;
        }
    }

    // Feedback final
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            title: sucessos > 0 ? '✅ Concluído!' : '❌ Erro!',
            html: `
                <p>✅ ${sucessos} cotação(ões) salva(s) com sucesso</p>
                ${erros > 0 ? `<p>❌ ${erros} erro(s)</p>` : ''}
            `,
            icon: sucessos > 0 ? 'success' : 'error'
        });
    } else {
        alert(`✅ ${sucessos} cotação(ões) salva(s)\n${erros > 0 ? `❌ ${erros} erro(s)` : ''}`);
    }

    if (sucessos > 0) {
        closeBulkImportModal();
        resetBulkImport();
        if (typeof loadServices === 'function') {
            loadServices();
        } else if (typeof loadInsumos === 'function') {
            loadInsumos();
        }
    }
}

// ========================================
// EXPOR FUNÇÕES GLOBALMENTE
// ========================================
window.openBulkImportModal = openBulkImportModal;
window.closeBulkImportModal = closeBulkImportModal;
window.resetBulkImport = resetBulkImport;
window.bulkPasteFromClipboard = bulkPasteFromClipboard;
window.processBulkData = processBulkData;
window.displayBulkPreview = displayBulkPreview;
window.removeBulkItem = removeBulkItem;
window.loadSectorsForBulk = loadSectorsForBulk;
window.applyBulkSectorToAll = applyBulkSectorToAll;
window.openBulkCompaniesModal = openBulkCompaniesModal;
window.closeBulkCompaniesModal = closeBulkCompaniesModal;
window.openBulkPricesModal = openBulkPricesModal;
window.closeBulkPricesModal = closeBulkPricesModal;
window.openBulkViewAttachmentsModal = openBulkViewAttachmentsModal;
window.closeBulkViewAttachmentsModal = closeBulkViewAttachmentsModal;
window.handleBulkFileUpload = handleBulkFileUpload;
window.displayBulkAttachments = displayBulkAttachments;
window.removeBulkAttachment = removeBulkAttachment;
window.clearBulkData = clearBulkData;
window.saveBulkCotacoes = saveBulkCotacoes;
window.openBulkAttachmentDescriptionModal = openBulkAttachmentDescriptionModal;
window.closeBulkAttachmentDescriptionModal = closeBulkAttachmentDescriptionModal;
window.confirmBulkAttachmentDescription = confirmBulkAttachmentDescription;
