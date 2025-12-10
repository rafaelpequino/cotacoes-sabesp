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
    // Atualizar o primeiro card (Serviços)
    const firstCard = document.querySelector('.cards .card:nth-child(1) .numbers h3');
    if (firstCard) {
        firstCard.innerHTML = `${summary.servicesCount} <span>/${summary.servicesCount * 3}</span>`;
    }

    // Atualizar o segundo card (Insumos)
    const secondCard = document.querySelector('.cards .card:nth-child(2) .numbers h3');
    if (secondCard) {
        secondCard.innerHTML = `${summary.inputsCount} <span>/${summary.inputsCount * 3}</span>`;
    }

    // Atualizar o terceiro card (Planilhas)
    const thirdCard = document.querySelector('.cards .card:nth-child(3) .numbers h3');
    if (thirdCard) {
        thirdCard.innerHTML = `${summary.spreadsheetsCount} <span>/${summary.spreadsheetsCount * 2}</span>`;
    }
}

function updateRecentServices(services) {
    const tbody = document.querySelector('.servicos-table table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    services.forEach(service => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${service.originalId}</td>
            <td>${new Date(service.createdAt).toLocaleDateString('pt-BR')}</td>
            <td>${service.item}</td>
            <td>${service.responsibleName}</td>
            <td>⬇</td>
        `;
        tbody.appendChild(row);
    });

    if (services.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="5" style="text-align: center; color: #999;">Nenhuma cotação de serviço ainda</td>';
        tbody.appendChild(row);
    }
}

function updateRecentSpreadsheets(spreadsheets) {
    const tbody = document.querySelectorAll('.servicos-table table tbody')[1];
    if (!tbody) return;

    tbody.innerHTML = '';

    spreadsheets.forEach(spreadsheet => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${spreadsheet.name}</td>
            <td>${spreadsheet.responsibleName}</td>
            <td>⬇</td>
        `;
        tbody.appendChild(row);
    });

    if (spreadsheets.length === 0) {
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

