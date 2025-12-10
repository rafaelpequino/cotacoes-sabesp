// Dashboard.js - Carregar dados via API

async function loadDashboardData() {
    try {
        const summary = await api.getDashboardSummary();
        const stats = await api.getDashboardStatistics();

        if (summary) {
            // Atualizar contadores
            updateCardNumbers(summary);
            // Atualizar tabelas recentes
            updateRecentServices(summary.recentServices);
            updateRecentInputs(summary.recentInputs);
            updateRecentSpreadsheets(summary.recentSpreadsheets);
        }

        if (stats) {
            // Atualizar estatísticas se necessário
            console.log('Estatísticas:', stats);
        }
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        // Mostrar mensagem de erro ao usuário
        showError('Erro ao carregar dados do dashboard');
    }
}

function updateCardNumbers(summary) {
    // Atualizar contadores de Serviços
    const servicesCount = document.getElementById('servicesCount');
    if (servicesCount) {
        servicesCount.textContent = summary.servicesCount || 0;
    }

    // Atualizar contadores de Insumos
    const inputsCount = document.getElementById('inputsCount');
    if (inputsCount) {
        inputsCount.textContent = summary.inputsCount || 0;
    }

    // Atualizar contadores de Planilhas
    const spreadsheetsCount = document.getElementById('spreadsheetsCount');
    if (spreadsheetsCount) {
        spreadsheetsCount.textContent = summary.spreadsheetsCount || 0;
    }
}

function updateRecentServices(services) {
    const tbody = document.querySelector('#servicesTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (services && services.length > 0) {
        services.forEach(service => {
            const row = document.createElement('tr');
            const date = new Date(service.createdAt).toLocaleDateString('pt-BR');
            row.innerHTML = `
                <td>${date}</td>
                <td>${service.item || 'N/A'}</td>
                <td>${service.responsibleName || 'Desconhecido'}</td>
            `;
            tbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center; color: #999;">Nenhuma cotação ainda</td>';
        tbody.appendChild(row);
    }
}

function updateRecentInputs(inputs) {
    const tbody = document.querySelector('#inputsTable tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (inputs && inputs.length > 0) {
        inputs.forEach(input => {
            const row = document.createElement('tr');
            const date = new Date(input.createdAt).toLocaleDateString('pt-BR');
            row.innerHTML = `
                <td>${date}</td>
                <td>${input.item || 'N/A'}</td>
                <td>${input.responsibleName || 'Desconhecido'}</td>
            `;
            tbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center; color: #999;">Nenhuma cotação ainda</td>';
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
        console.error('Erro ao baixar planilha:', error);
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

