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
            Swal.fire({
                icon: 'warning',
                title: '⚠️ Nenhum dado',
                text: 'Nenhum dado encontrado na área de transferência!',
                confirmButtonText: 'OK'
            });
            return;
        }
        processBulkData(text);
    } catch (err) {
        Swal.fire({
            icon: 'error',
            title: '❌ Erro',
            text: 'Erro ao ler dados da área de transferência. Verifique as permissões do navegador.',
            confirmButtonText: 'OK'
        });
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

// Normaliza texto: maiúscula, sem acentos, ç → c
function normalizeTextForCotacao(value) {
    return (value || '').toString().trim()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ç/gi, 'c')
        .toUpperCase();
}

// Processar dados colados
function processBulkData(text) {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    
    if (lines.length < 2 || lines.length % 2 !== 0) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Formato inválido',
            text: 'Cada cotação deve ter 2 linhas (nomes das empresas + dados da cotação).',
            confirmButtonText: 'OK'
        });
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
                const nomeBruto = (lineNomes[j] || '').trim();
                const nome = normalizeTextForCotacao(nomeBruto);
                const valor = parseMoneyValue(lineDados[j]);
                if (nome || valor > 0) {
                    empresasTemp.push({ nome, valor });
                }
            }
            
            const cotacao = {
                id: `bulk_${Date.now()}_${i}`,
                sectorId: '',
                i0Original: normalizeTextForCotacao(lineDados[0]),
                item: normalizeTextForCotacao(lineDados[1]),
                unidade: normalizeTextForCotacao(lineDados[2]),
                adotada: parseMoneyValue(lineDados[3]),
                precoMontagem: parseMoneyValue(lineDados[4]),
                precoAdotado: parseMoneyValue(lineDados[6]),
                mediaAdotada: parseMoneyValue(lineDados[8]),
                mediaSaneada: parseMoneyValue(lineDados[9]),
                menorValor: parseMoneyValue(lineDados[10]),
                mediaAritmetica: parseMoneyValue(lineDados[11]),
                mediana: parseMoneyValue(lineDados[12]),
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
                supplier1Id: null,
                supplier2Id: null,
                supplier3Id: null,
                supplier4Id: null,
                supplier5Id: null,
                supplier6Id: null,
                justificativa: normalizeTextForCotacao((lineDados[20] || '').replace(/\r/g, '').trim()),
                attachments: []
            };

        bulkCotacoesData.push(cotacao);
    }

    if (bulkCotacoesData.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Nenhuma cotação',
            text: 'Nenhuma cotação válida foi encontrada!',
            confirmButtonText: 'OK'
        });
        return;
    }

    // Auto-match dos fornecedores ANTES de exibir preview
    autoMatchSuppliersForBulkData().then(() => {
        displayBulkPreview();
        loadSectorsForBulk();
    });
}

// Auto-match automático para todos os fornecedores colados
async function autoMatchSuppliersForBulkData() {
    try {
        const suppliers = await SupplierSelect.loadSuppliersGlobal();
        
        // Para cada cotação colada
        bulkCotacoesData.forEach((cotacao, cotacaoIndex) => {
            // Para cada empresa (1-6)
            for (let i = 1; i <= 6; i++) {
                const nomeField = `nomeEmpresa${i}`;
                const idField = `supplier${i}Id`;
                const nomeValue = cotacao[nomeField];
                
                // Se existe nome e ainda não tem supplier selecionado
                if (nomeValue && nomeValue.trim() && !cotacao[idField]) {
                    // Tentar encontrar fornecedor correspondente
                    const matchedSupplier = findSimilarSupplier(nomeValue, suppliers);
                    if (matchedSupplier) {
                        // Salvar automaticamente o supplier ID
                        cotacao[idField] = matchedSupplier.id;
                        console.log(`✓ Auto-match: "${nomeValue}" → ID ${matchedSupplier.id} (${matchedSupplier.nomeFantasia})`);
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erro ao fazer auto-match de fornecedores:', error);
    }
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
    Swal.fire({
        icon: 'warning',
        title: '⚠️ Remover cotação?',
        text: 'Deseja realmente remover esta cotação?',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d32f2f'
    }).then((result) => {
        if (result.isConfirmed) {
            bulkCotacoesData.splice(index, 1);
            if (bulkCotacoesData.length === 0) {
                resetBulkImport();
            } else {
                displayBulkPreview();
                loadSectorsForBulk();
            }
        }
    });
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
        Swal.fire({
            icon: 'error',
            title: '❌ Erro',
            text: 'Erro ao carregar setores',
            confirmButtonText: 'OK'
        });
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
let currentBulkCompaniesIndex = null;

function openBulkCompaniesModal(index) {
    const cotacao = bulkCotacoesData[index];
    const modal = document.getElementById('bulkCompaniesModal');
    const content = document.getElementById('bulkCompaniesContent');
    
    currentBulkCompaniesIndex = index;

    // Gerar HTML com 6 inputs (um por linha, full-width: 50% nome + 50% valor)
    let html = '<h3>📊 Empresas e Valores</h3>';
    
    // Empresas 1-6 (uma por linha, ocupando 100% da largura)
    for (let i = 1; i <= 6; i++) {
        const nomeField = `nomeEmpresa${i}`;
        const valorField = `empresa${i}`;
        const nomeValue = cotacao[nomeField] || '';
        const valorValue = cotacao[valorField] || 0;
        const uniqueId = `bulk-${index}-${i}`;
        
        html += `
            <div style="display: flex; gap: 20px; margin-bottom: 20px;">
                <div class="form-group" style="flex: 1 1 50%; min-width: 0;">
                    <label>Nome da Empresa ${i}</label>
                    <div class="searchable-supplier-select bulk-supplier" data-company-index="${i}" data-bulk-index="${index}">
                        <input 
                            type="text" 
                            class="supplier-search-input bulk-supplier-input" 
                            placeholder="🔍 Selecione ou procure..." 
                            autocomplete="off"
                            value="${nomeValue}"
                        />
                        <div class="supplier-dropdown" style="display: none;"></div>
                    </div>
                    <input 
                        type="hidden" 
                        id="bulkNomeEmpresa${uniqueId}"
                        name="${nomeField}" 
                        class="hidden-supplier-name bulk-hidden-supplier-name"
                        value="${nomeValue}"
                    />
                    <input 
                        type="hidden" 
                        id="bulkSupplier${uniqueId}Id"
                        name="supplier${i}Id" 
                        class="hidden-supplier-id bulk-hidden-supplier-id"
                        value=""
                    />
                </div>
                <div class="form-group" style="flex: 1 1 50%; min-width: 0;">
                    <label>Valor Empresa ${i}</label>
                    <input type="number" id="bulkValor${uniqueId}" name="${valorField}" class="bulk-supplier-value" placeholder="0,00" step="0.01" value="${valorValue || ''}" />
                </div>
            </div>
        `;
    }
    
    html += `
        <div style="margin-top: 20px; text-align: right;">
            <button type="button" class="btn-cancel" onclick="closeBulkCompaniesModal()">Cancelar</button>
            <button type="button" class="btn-submit" onclick="saveBulkCompaniesData()">Salvar Dados</button>
        </div>
    `;

    content.innerHTML = html;
    modal.style.display = 'block';
    
    // Inicializar SupplierSelect após renderizar o HTML
    setTimeout(() => {
        initializeSupplierSelectForBulkCompanies(index);
    }, 100);
}

function closeBulkCompaniesModal() {
    document.getElementById('bulkCompaniesModal').style.display = 'none';
    currentBulkCompaniesIndex = null;
}

// Inicializar SupplierSelect para o modal de empresas em bulk
async function initializeSupplierSelectForBulkCompanies(bulkIndex) {
    const suppliers = await SupplierSelect.loadSuppliersGlobal();
    
    for (let i = 1; i <= 6; i++) {
        const container = document.querySelector(`.searchable-supplier-select.bulk-supplier[data-company-index="${i}"][data-bulk-index="${bulkIndex}"]`);
        if (container) {
            const instance = new SupplierSelect(container, i);
            instance.setSuppliers(suppliers);
            
            // Armazenar a instância
            if (!window.bulkCompaniesSupplierInstances) {
                window.bulkCompaniesSupplierInstances = {};
            }
            window.bulkCompaniesSupplierInstances[`${bulkIndex}-${i}`] = instance;
            container._supplierSelectInstance = instance;
            
            // Restaurar valores salvos anteriormente ou fazer auto-match se for primeira vez
            const nomeValue = bulkCotacoesData[bulkIndex][`nomeEmpresa${i}`];
            const supplierIdValue = bulkCotacoesData[bulkIndex][`supplier${i}Id`];
            
            if (nomeValue && nomeValue.trim()) {
                if (supplierIdValue && supplierIdValue > 0) {
                    // Fornecedor já foi selecionado antes, restaurar exatamente
                    await instance.restore(nomeValue, supplierIdValue);
                } else {
                    // Primeira vez abrindo modal após colar dados, tentar auto-match
                    const matchedSupplier = findSimilarSupplier(nomeValue, suppliers);
                    if (matchedSupplier) {
                        // Pré-selecionar fornecedor encontrado
                        instance.select(matchedSupplier);
                        // IMPORTANTE: Salvar automaticamente em bulkCotacoesData mesmo sem clicar "Salvar Dados"
                        bulkCotacoesData[bulkIndex][`supplier${i}Id`] = matchedSupplier.id;
                    } else {
                        // Se não encontrar match no DB, marcar como texto customizado (avulso)
                        instance.selectCustom(nomeValue);
                    }
                }
            }
        }
    }
}

// Salvar dados das empresas editadas
function saveBulkCompaniesData() {
    if (currentBulkCompaniesIndex === null) return;
    
    const cotacao = bulkCotacoesData[currentBulkCompaniesIndex];
    const modal = document.getElementById('bulkCompaniesModal');
    
    // Salvar valores dos inputs - usar getValue() do SupplierSelect como em saveQuotation()
    for (let i = 1; i <= 6; i++) {
        const uniqueId = `bulk-${currentBulkCompaniesIndex}-${i}`;
        const valorInput = modal.querySelector(`#bulkValor${uniqueId}`);
        let nomeEmpresa = '';
        let supplierIdValue = null;
        
        // Primeiro, tentar obter dados da instância do SupplierSelect
        if (window.bulkCompaniesSupplierInstances && window.bulkCompaniesSupplierInstances[`${currentBulkCompaniesIndex}-${i}`]) {
            const instance = window.bulkCompaniesSupplierInstances[`${currentBulkCompaniesIndex}-${i}`];
            const value = instance.getValue();
            nomeEmpresa = value.nomeEmpresa || '';
            supplierIdValue = value.supplierId;
        }
        
        // Se não conseguiu dos hidden inputs diretos, tentar fallback
        if (!nomeEmpresa) {
            const nomeInput = modal.querySelector(`#bulkNomeEmpresa${uniqueId}`);
            if (nomeInput) {
                nomeEmpresa = nomeInput.value || '';
            }
        }
        
        if (!supplierIdValue) {
            const supplierIdInput = modal.querySelector(`#bulkSupplier${uniqueId}Id`);
            if (supplierIdInput && supplierIdInput.value) {
                supplierIdValue = parseInt(supplierIdInput.value);
            }
        }
        
        // Salvar sempre os dados capturados
        cotacao[`nomeEmpresa${i}`] = nomeEmpresa;
        cotacao[`supplier${i}Id`] = supplierIdValue || null;
        
        // Salvar valor numérico da empresa
        if (valorInput) {
            cotacao[`empresa${i}`] = parseFloat(valorInput.value || 0);
        }
    }
    
    closeBulkCompaniesModal();
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
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Campo obrigatório',
            text: 'Descrição é obrigatória!',
            confirmButtonText: 'OK'
        });
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
    Swal.fire({
        icon: 'warning',
        title: '⚠️ Remover anexo?',
        text: 'Deseja remover este anexo?',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d32f2f'
    }).then((result) => {
        if (result.isConfirmed) {
            bulkCotacoesData[cotacaoIndex].attachments.splice(attachmentIndex, 1);
            displayBulkAttachments(cotacaoIndex);
            updateAttachmentCount(cotacaoIndex);
        }
    });
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
// AUTO-CRIAR FORNECEDORES NÃO CADASTRADOS (bulk)
// ========================================
async function bulkAutoCreateMissingSuppliers(data) {
    let suppliers = await SupplierSelect.loadSuppliersGlobal();

    for (let i = 1; i <= 6; i++) {
        const nomeKey = `nomeEmpresa${i}`;
        const idKey = `supplier${i}Id`;
        const nome = (data[nomeKey] || '').trim();

        if (!nome || data[idKey]) continue;

        const normalizado = nome.toLowerCase();
        const existing = suppliers.find(s => (s.nomeFantasia || '').toLowerCase() === normalizado);

        if (existing) {
            data[idKey] = existing.id;
        } else {
            try {
                const token = document.cookie.split(';').map(c => c.trim())
                    .find(c => c.startsWith('authToken='))?.split('=')[1];
                const resp = await fetch('/api/suppliers', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
                    body: JSON.stringify({ nomeFantasia: nome })
                });
                if (resp.ok) {
                    const novoFornecedor = await resp.json();
                    data[idKey] = novoFornecedor.id;
                    suppliers.push(novoFornecedor);
                    SupplierSelect.suppliersCache = suppliers;
                    console.log(`✓ Fornecedor criado automaticamente (bulk): "${nome}" (ID ${novoFornecedor.id})`);
                }
            } catch (err) {
                console.warn(`Não foi possível criar fornecedor "${nome}":`, err);
            }
        }
    }
}

// ========================================
// SALVAR TODAS AS COTAÇÕES
// ========================================
async function saveBulkCotacoes() {
    // Validar setores
    const semSetor = bulkCotacoesData.filter(c => !c.sectorId || c.sectorId === '');
    if (semSetor.length > 0) {
        Swal.fire({
            icon: 'warning',
            title: '⚠️ Setor não definido',
            text: `${semSetor.length} cotação(ões) sem setor definido!`,
            confirmButtonText: 'OK'
        });
        return;
    }

    // Usar sempre o endpoint de cotações (Quotation)
    const entityType = 'Quotation';

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

    const toNumber = (val, def = null) => {
        if (!val || val === '') return def;
        const num = parseFloat(val);
        return isNaN(num) ? def : num;
    };

    for (const cotacao of bulkCotacoesData) {
        try {
            // Preparar dados para API - usando exatamente a mesma lógica do saveQuotation()
            const data = {
                sectorId: parseInt(cotacao.sectorId),
                originalId: cotacao.i0Original || '',
                item: cotacao.item || '',
                unit: cotacao.unidade || '',
                priceFornecedor: toNumber(cotacao.adotada, 0),
                precoMontagem: toNumber(cotacao.precoMontagem, 0),
                precoAdotado: toNumber(cotacao.precoAdotado, 0),
                mediaAdotada: cotacao.mediaAdotada || '',
                mediaSaneada: toNumber(cotacao.mediaSaneada),
                menorValor: toNumber(cotacao.menorValor),
                mediaAritmetica: toNumber(cotacao.mediaAritmetica),
                mediana: toNumber(cotacao.mediana),
                nomeEmpresa1: cotacao.nomeEmpresa1 || null,
                nomeEmpresa2: cotacao.nomeEmpresa2 || null,
                nomeEmpresa3: cotacao.nomeEmpresa3 || null,
                nomeEmpresa4: cotacao.nomeEmpresa4 || null,
                nomeEmpresa5: cotacao.nomeEmpresa5 || null,
                nomeEmpresa6: cotacao.nomeEmpresa6 || null,
                supplier1Id: cotacao.supplier1Id ? parseInt(cotacao.supplier1Id) : null,
                supplier2Id: cotacao.supplier2Id ? parseInt(cotacao.supplier2Id) : null,
                supplier3Id: cotacao.supplier3Id ? parseInt(cotacao.supplier3Id) : null,
                supplier4Id: cotacao.supplier4Id ? parseInt(cotacao.supplier4Id) : null,
                supplier5Id: cotacao.supplier5Id ? parseInt(cotacao.supplier5Id) : null,
                supplier6Id: cotacao.supplier6Id ? parseInt(cotacao.supplier6Id) : null,
                empresa1: toNumber(cotacao.empresa1),
                empresa2: toNumber(cotacao.empresa2),
                empresa3: toNumber(cotacao.empresa3),
                empresa4: toNumber(cotacao.empresa4),
                empresa5: toNumber(cotacao.empresa5),
                empresa6: toNumber(cotacao.empresa6),
                justificativa: cotacao.justificativa || '',
                status: 'Concluída'
            };

            // Criar cotação via API
            await bulkAutoCreateMissingSuppliers(data);
            const created = await api.createQuotation(data);

            // Upload de anexos
            if (cotacao.attachments && cotacao.attachments.length > 0) {
                for (const attachment of cotacao.attachments) {
                    await api.uploadAttachment(entityType, created.id, attachment.file, attachment.description);
                }
            }

            sucessos++;
        } catch (error) {
            console.error('Erro ao salvar cotação:', error);
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
        Swal.fire({
            icon: sucessos > 0 ? 'success' : 'error',
            title: sucessos > 0 ? '✅ Concluído!' : '❌ Erro!',
            html: `
                <p>✅ ${sucessos} cotação(ões) salva(s) com sucesso</p>
                ${erros > 0 ? `<p style="color: #dc3545;">❌ ${erros} erro(s)</p>` : ''}
            `,
            confirmButtonText: 'OK'
        });
    }

    if (sucessos > 0) {
        closeBulkImportModal();
        resetBulkImport();
        // Recarregar as cotações após salvar
        if (typeof loadQuotations === 'function') {
            loadQuotations();
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
