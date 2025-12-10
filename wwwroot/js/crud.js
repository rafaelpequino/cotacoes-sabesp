// CRUD Manager para Serviços, Insumos e Planilhas

class CrudManager {
    constructor(entityType) {
        this.entityType = entityType; // 'services', 'inputs', 'spreadsheets'
        this.endpoint = `/${entityType}`; // Será combinado com baseUrl '/api' no api.request()
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
            console.log(`Criando novo ${this.entityType}...`, data);
            const result = await api.request(this.endpoint, 'POST', data);
            this.showNotification('✓ Criado com sucesso!', 'success');
            return result;
        } catch (error) {
            console.error(`Erro ao criar ${this.entityType}:`, error);
            const mensagem = this.humanizeError(error.message);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao Criar',
                text: mensagem,
                confirmButtonColor: '#13d0ff'
            });
            throw error;
        }
    }

    async update(id, data) {
        try {
            const result = await api.request(`${this.endpoint}/${id}`, 'PUT', data);
            this.showNotification('✓ Atualizado com sucesso!', 'success');
            return result;
        } catch (error) {
            console.error(`Erro ao atualizar ${this.entityType}:`, error);
            const mensagem = this.humanizeError(error.message);
            Swal.fire({
                icon: 'error',
                title: 'Erro ao Atualizar',
                text: mensagem,
                confirmButtonColor: '#13d0ff'
            });
            throw error;
        }
    }

    async delete(id) {
        // Usar SweetAlert2 para confirmação
        const result = await Swal.fire({
            title: 'Tem certeza?',
            text: 'Esta ação não pode ser desfeita!',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d32f2f',
            cancelButtonColor: '#757575',
            confirmButtonText: 'Sim, deletar!',
            cancelButtonText: 'Cancelar'
        });

        if (result.isConfirmed) {
            try {
                console.log(`Deletando ${this.entityType} com ID:`, id);
                const result = await api.request(`${this.endpoint}/${id}`, 'DELETE');
                console.log(`${this.entityType} deletado:`, result);
                this.showNotification('✓ Deletado com sucesso!', 'success');
                return true;
            } catch (error) {
                console.error(`Erro ao deletar ${this.entityType}:`, error);
                const mensagem = this.humanizeError(error.message);
                Swal.fire({
                    icon: 'error',
                    title: 'Erro ao Deletar',
                    text: mensagem,
                    confirmButtonColor: '#13d0ff'
                });
                return false;
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

    humanizeError(errorMessage) {
        // Traduzir e humanizar mensagens de erro comuns
        const errorMap = {
            'Ocorreu um erro ao processar sua requisição': 'Houve um problema ao processar sua solicitação. Tente novamente.',
            'não encontrado': 'O item não foi encontrado.',
            'já existe': 'Este item já existe no sistema.',
            'campo obrigatório': 'Verifique se todos os campos obrigatórios foram preenchidos.',
            'inválido': 'Os dados fornecidos são inválidos.',
            'Erro 400': 'Verifique os dados e tente novamente.',
            'Erro 401': 'Sua sessão expirou. Por favor, faça login novamente.',
            'Erro 403': 'Você não tem permissão para realizar esta ação.',
            'Erro 404': 'O recurso solicitado não foi encontrado.',
            'Erro 500': 'Erro no servidor. Tente novamente mais tarde.'
        };

        // Procurar por padrões conhecidos
        for (const [pattern, translation] of Object.entries(errorMap)) {
            if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
                return translation;
            }
        }

        // Se nenhum padrão for encontrado, usar a mensagem original
        return errorMessage || 'Ocorreu um erro desconhecido. Por favor, tente novamente.';
    }
}

// Instâncias para cada entidade
const serviceCrud = new CrudManager('services');
const inputCrud = new CrudManager('inputs');
const spreadsheetCrud = new CrudManager('spreadsheets');

