// API Helper para comunicação com o backend
class ApiClient {
    constructor() {
        this.baseUrl = '/api';
    }

    async getToken() {
        const cookies = document.cookie.split(';').map(c => c.trim());
        const tokenCookie = cookies.find(c => c.startsWith('authToken='));
        return tokenCookie ? tokenCookie.split('=')[1] : null;
    }

    async request(endpoint, method = 'GET', body = null) {
        const token = await this.getToken();
        const headers = {
            'Content-Type': 'application/json'
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const options = {
            method,
            headers
        };

        if (body && (method === 'POST' || method === 'PUT')) {
            options.body = JSON.stringify(body);
        }

        try {
            console.log(`${method} ${this.baseUrl}${endpoint}`, body);
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);

            if (response.status === 401) {
                // Token expirado, redirecionar para login
                window.location.href = '/login';
                return null;
            }

            const responseText = await response.text();
            console.log(`Response ${response.status}:`, responseText);

            if (!response.ok) {
                let errorMessage = `Erro ${response.status}`;
                
                try {
                    if (responseText) {
                        const error = JSON.parse(responseText);
                        
                        // Tentar extrair mensagem de erro mais clara
                        if (error.message) {
                            errorMessage = error.message;
                            
                            // Se tem array de erros, adicionar
                            if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
                                const detailedErrors = error.errors.map(err => this.translateError(err)).join('; ');
                                errorMessage = detailedErrors;
                            }
                        } else if (error.error) {
                            errorMessage = this.translateError(error.error);
                        } else if (error.errors) {
                            // ModelState validation errors (formato dict)
                            if (Array.isArray(error.errors)) {
                                errorMessage = error.errors.map(err => this.translateError(err)).join('; ');
                            } else {
                                const errors = Object.values(error.errors).flat();
                                errorMessage = errors.map(err => this.translateError(err)).join('; ') || errorMessage;
                            }
                        }
                    }
                } catch (parseError) {
                    console.error('Erro ao fazer parse da resposta de erro:', parseError);
                }
                
                throw new Error(errorMessage);
            }

            // Se não há conteúdo (ex: DELETE com 204 No Content), retorna sucesso
            if (!responseText) {
                return { success: true, message: 'Operação realizada com sucesso' };
            }
            
            try {
                return JSON.parse(responseText);
            } catch (parseError) {
                console.error('Erro ao fazer parse do JSON:', responseText);
                // Retorna sucesso se conseguiu fazer a requisição mas não há JSON válido
                return { success: true, message: 'Operação realizada com sucesso' };
            }
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth endpoints
    async login(email, password) {
        return this.request('/auth/login', 'POST', { email, password });
    }

    async register(name, email, password) {
        return this.request('/auth/register', 'POST', { name, email, password });
    }

    // Services endpoints
    async getServices() {
        return this.request('/services');
    }

    async getService(id) {
        return this.request(`/services/${id}`);
    }

    async createService(data) {
        return this.request('/services', 'POST', data);
    }

    async updateService(id, data) {
        return this.request(`/services/${id}`, 'PUT', data);
    }

    async deleteService(id) {
        return this.request(`/services/${id}`, 'DELETE');
    }

    // Inputs endpoints
    async getInputs() {
        return this.request('/inputs');
    }

    async getInput(id) {
        return this.request(`/inputs/${id}`);
    }

    async createInput(data) {
        return this.request('/inputs', 'POST', data);
    }

    async updateInput(id, data) {
        return this.request(`/inputs/${id}`, 'PUT', data);
    }

    async deleteInput(id) {
        return this.request(`/inputs/${id}`, 'DELETE');
    }

    // Spreadsheets endpoints
    async getSpreadsheets() {
        return this.request('/spreadsheets');
    }

    async getSpreadsheet(id) {
        return this.request(`/spreadsheets/${id}`);
    }

    async createSpreadsheet(data) {
        return this.request('/spreadsheets', 'POST', data);
    }

    async updateSpreadsheet(id, data) {
        return this.request(`/spreadsheets/${id}`, 'PUT', data);
    }

    async deleteSpreadsheet(id) {
        return this.request(`/spreadsheets/${id}`, 'DELETE');
    }

    // Dashboard endpoints
    async getDashboardSummary() {
        return this.request('/dashboard/summary');
    }

    async getDashboardStatistics() {
        return this.request('/dashboard/statistics');
    }

    // Files endpoints
    async uploadFile(file) {
        const token = await this.getToken();
        const formData = new FormData();
        formData.append('file', file);

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            console.log('Fazendo upload do arquivo:', file.name);
            const response = await fetch(`${this.baseUrl}/files/upload`, {
                method: 'POST',
                headers,
                body: formData
            });

            const responseText = await response.text();
            console.log(`Response ${response.status}:`, responseText);

            if (!response.ok) {
                let errorMessage = `Erro ${response.status}`;
                try {
                    if (responseText) {
                        const error = JSON.parse(responseText);
                        errorMessage = error.message || errorMessage;
                    }
                } catch (e) {
                    console.error('Erro ao fazer parse:', e);
                }
                throw new Error(errorMessage);
            }

            if (!responseText) {
                throw new Error('Resposta vazia do servidor');
            }

            return JSON.parse(responseText);
        } catch (error) {
            console.error('Erro ao fazer upload:', error);
            throw error;
        }
    }

    async downloadFile(fileKey) {
        const token = await this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}/files/download/${fileKey}`, {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            return response.blob();
        } catch (error) {
            console.error('Erro ao fazer download:', error);
            throw error;
        }
    }

    // Traduzir erros para português
    translateError(error) {
        if (!error) return 'Erro desconhecido';

        const errorTranslations = {
            'field FileType must be a string with a maximum length of 50': 'Tipo de arquivo inválido. Tente novamente.',
            'must be a string with a maximum length of': 'Campo muito longo. Reduza o tamanho.',
            'is required': 'Campo obrigatório. Preencha todos os campos.',
            'must be a valid email address': 'Email inválido.',
            'must be a number': 'Deve ser um número.',
            'Ocorreu um erro ao processar': 'Houve um problema ao processar sua solicitação.',
            'already exists': 'Este item já existe.',
            'not found': 'Item não encontrado.'
        };

        // Procurar por padrões conhecidos
        for (const [pattern, translation] of Object.entries(errorTranslations)) {
            if (error.toLowerCase().includes(pattern.toLowerCase())) {
                return translation;
            }
        }

        // Retornar mensagem original se não encontrar tradução
        return error;
    }
}

// Criar instância global
const api = new ApiClient();

// Função de logout
async function logout(event) {
    if (event) event.preventDefault();

    try {
        // Chamar endpoint de logout para limpar o cookie no servidor
        await fetch('/api/auth/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    } finally {
        // Limpar localStorage e sessionStorage localmente
        sessionStorage.clear();
        localStorage.clear();

        // Redirecionar para a página inicial (login)
        window.location.href = '/';
    }
}

