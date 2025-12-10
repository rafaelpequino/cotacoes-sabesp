// CRUD Manager para Serviços, Insumos e Planilhas

class CrudManager {
    constructor(entityType) {
        this.entityType = entityType; // 'services', 'inputs', 'spreadsheets'
        this.endpoint = `/api/${entityType}`;
    }

    async loadAll() {
        try {
            const data = await api.request(this.endpoint);
            return data || [];
        } catch (error) {
            console.error(`Erro ao carregar ${this.entityType}:`, error);
            return [];
        }
    }

    async create(data) {
        try {
            const result = await api.request(this.endpoint, 'POST', data);
            this.showNotification('✓ Criado com sucesso!', 'success');
            return result;
        } catch (error) {
            this.showNotification(`✗ Erro ao criar: ${error.message}`, 'error');
            throw error;
        }
    }

    async update(id, data) {
        try {
            const result = await api.request(`${this.endpoint}/${id}`, 'PUT', data);
            this.showNotification('✓ Atualizado com sucesso!', 'success');
            return result;
        } catch (error) {
            this.showNotification(`✗ Erro ao atualizar: ${error.message}`, 'error');
            throw error;
        }
    }

    async delete(id) {
        if (confirm('Tem certeza que deseja deletar?')) {
            try {
                await api.request(`${this.endpoint}/${id}`, 'DELETE');
                this.showNotification('✓ Deletado com sucesso!', 'success');
                return true;
            } catch (error) {
                this.showNotification(`✗ Erro ao deletar: ${error.message}`, 'error');
                throw error;
            }
        }
        return false;
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = 'copy-notification';
        notification.style.background = type === 'error' ? '#d32f2f' : type === 'success' ? '#4caf50' : '#19d6ff';
        notification.textContent = message;
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
}

// Instâncias para cada entidade
const serviceCrud = new CrudManager('services');
const inputCrud = new CrudManager('inputs');
const spreadsheetCrud = new CrudManager('spreadsheets');

