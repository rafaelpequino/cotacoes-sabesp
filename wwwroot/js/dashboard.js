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
    const servicesTotalCount = document.getElementById('servicesTotalCount');
    if (servicesCount && servicesTotalCount) {
        servicesCount.textContent = summary.servicesCount || 0;
        servicesTotalCount.textContent = (summary.servicesCount || 0) * 3;
    }

    // Atualizar contadores de Insumos
    const inputsCount = document.getElementById('inputsCount');
    const inputsTotalCount = document.getElementById('inputsTotalCount');
    if (inputsCount && inputsTotalCount) {
        inputsCount.textContent = summary.inputsCount || 0;
        inputsTotalCount.textContent = (summary.inputsCount || 0) * 3;
    }

    // Atualizar contadores de Planilhas
    const spreadsheetsCount = document.getElementById('spreadsheetsCount');
    const spreadsheetsTotalCount = document.getElementById('spreadsheetsTotalCount');
    if (spreadsheetsCount && spreadsheetsTotalCount) {
        spreadsheetsCount.textContent = summary.spreadsheetsCount || 0;
        spreadsheetsTotalCount.textContent = (summary.spreadsheetsCount || 0) * 2;
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
                <td>⬇</td>
            `;
            tbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="3" style="text-align: center; color: #999;">Nenhuma planilha ainda</td>';
        tbody.appendChild(row);
    }
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

