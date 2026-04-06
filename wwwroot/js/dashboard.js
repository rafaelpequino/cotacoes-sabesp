// Dashboard.js - Carregar dados via API

async function loadDashboardData() {
    try {
        const summary = await api.getDashboardSummary();
        const stats = await api.getDashboardStatistics();

        if (summary) {
            // Atualizar contadores
            updateCardNumbers(summary);
            // Atualizar tabelas recentes
            updateRecentQuotations(summary.recentQuotations);
            updateRecentSuppliers(summary.recentSuppliers);
            updateRecentSpreadsheets(summary.recentSpreadsheets);
        }

        if (stats) {
            // Atualizar estatísticas se necessário
        }
    } catch (error) {
        showError('Erro ao carregar dados do dashboard');
    }
}

function updateCardNumbers(summary) {
    // Atualizar contadores de Cotações
    const quotationsCount = document.getElementById('quotationsCount');
    if (quotationsCount) {
        quotationsCount.textContent = summary.quotationsCount || 0;
    }

    // Atualizar contadores de Fornecedores
    const suppliersCount = document.getElementById('suppliersCount');
    if (suppliersCount) {
        suppliersCount.textContent = summary.suppliersCount || 0;
    }

    // Atualizar contadores de Planilhas
    const spreadsheetsCount = document.getElementById('spreadsheetsCount');
    if (spreadsheetsCount) {
        spreadsheetsCount.textContent = summary.spreadsheetsCount || 0;
    }
}

function updateRecentQuotations(quotations) {
    const tbody = document.querySelector('#quotationsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (quotations && quotations.length > 0) {
        quotations.forEach(quotation => {
            const row = document.createElement('tr');
            const date = new Date(quotation.createdAt).toLocaleDateString('pt-BR');
            row.innerHTML = `
                <td>${date}</td>
                <td>${quotation.item || 'N/A'}</td>
                <td>R$ ${quotation.precoAdotado ? quotation.precoAdotado.toFixed(2).replace('.', ',') : '0,00'}</td>
                <td>${quotation.responsibleName || 'Desconhecido'}</td>
            `;
            tbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="4" style="text-align: center; color: #999;">Nenhuma cotação ainda</td>';
        tbody.appendChild(row);
    }
}

function updateRecentSuppliers(suppliers) {
    const tbody = document.querySelector('#suppliersTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (suppliers && suppliers.length > 0) {
        suppliers.forEach(supplier => {
            const row = document.createElement('tr');
            const date = new Date(supplier.createdAt).toLocaleDateString('pt-BR');
            row.innerHTML = `
                <td>${date}</td>
                <td>${supplier.name || 'N/A'}</td>
                <td>${supplier.responsibleName || 'Desconhecido'}</td>
            `;
            tbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center; color: #999;">Nenhum fornecedor ainda</td>';
        tbody.appendChild(row);
    }
}

function updateRecentSpreadsheets(spreadsheets) {
    const tbody = document.querySelector('#spreadsheetsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (spreadsheets && spreadsheets.length > 0) {
        spreadsheets.forEach(spreadsheet => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${spreadsheet.name || 'Sem nome'}</td>
                <td>${spreadsheet.responsibleName || 'Desconhecido'}</td>
                <td>
                    <button class="download-btn" onclick="downloadSpreadsheet(${spreadsheet.id}, event)" title="Baixar planilha">
                        <span style="font-size: 16px;">⬇</span>
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center; color: #999;">Nenhuma planilha ainda</td>';
        tbody.appendChild(row);
    }
}

async function downloadSpreadsheet(spreadsheetId, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    try {
        // Primeiro, obter os dados da planilha para pegar o filePath
        const spreadsheet = await api.getSpreadsheet(spreadsheetId);
        if (spreadsheet && spreadsheet.filePath) {
            // Download do arquivo usando o filePath como fileKey
            const blob = await api.downloadFile(spreadsheet.filePath);
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = spreadsheet.name || 'planilha.xlsx';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSuccess('Planilha baixada com sucesso!');
        } else {
            showError('Arquivo não encontrado para esta planilha');
        }
    } catch (error) {
        showError('Erro ao baixar planilha: ' + error.message);
    }
}

function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.style.background = '#4caf50';
    notification.textContent = '✓ ' + message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

function showError(message) {
    const notification = document.createElement('div');
    notification.className = 'copy-notification';
    notification.style.background = '#d32f2f';
    notification.textContent = '✗ ' + message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Carregar dados quando a página carregar
document.addEventListener('DOMContentLoaded', loadDashboardData);

// Recarregar dados a cada 30 segundos
setInterval(loadDashboardData, 30000);

