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

        if (body && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            options.body = JSON.stringify(body);
        }

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);

            if (response.status === 401) {
                // Token expirado, redirecionar para login
                window.location.href = '/login';
                return null;
            }

            const responseText = await response.text();

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
                // Retorna sucesso se conseguiu fazer a requisição mas não há JSON válido
                return { success: true, message: 'Operação realizada com sucesso' };
            }
        } catch (error) {
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
    async getServices(search = null, sort = null, filter = null) {
        let endpoint = '/services';
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (sort) params.append('sort', sort);
        if (filter) params.append('filter', filter);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        return this.request(endpoint);
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

    async updateServiceStatus(id, status) {
        return this.request(`/services/${id}/status`, 'PATCH', { status });
    }

    // Inputs endpoints
    async getInputs(search = null, sort = null, filter = null) {
        let endpoint = '/inputs';
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (sort) params.append('sort', sort);
        if (filter) params.append('filter', filter);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        return this.request(endpoint);
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

    async updateInputStatus(id, status) {
        return this.request(`/inputs/${id}/status`, 'PATCH', { status });
    }

    // Sectors endpoints
    async getSectors() {
        return this.request('/sectors');
    }

    async getSector(id) {
        return this.request(`/sectors/${id}`);
    }

    // Users endpoints
    async getUsers() {
        return this.request('/users');
    }

    async getCurrentUser() {
        return this.request('/users/current');
    }

    // Spreadsheets endpoints
    async getSpreadsheets(search = null, sort = null, filter = null) {
        let endpoint = '/spreadsheets';
        const params = new URLSearchParams();
        
        if (search) params.append('search', search);
        if (sort) params.append('sort', sort);
        if (filter) params.append('filter', filter);
        
        if (params.toString()) {
            endpoint += '?' + params.toString();
        }
        
        return this.request(endpoint);
    }

    async getSpreadsheetSectors() {
        return this.request('/spreadsheets/sectors');
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
            const response = await fetch(`${this.baseUrl}/files/upload`, {
                method: 'POST',
                headers,
                body: formData
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = `Erro ${response.status}`;
                try {
                    if (responseText) {
                        const error = JSON.parse(responseText);
                        errorMessage = error.message || errorMessage;
                    }
                } catch (e) {
                }
                throw new Error(errorMessage);
            }

            if (!responseText) {
                throw new Error('Resposta vazia do servidor');
            }

            return JSON.parse(responseText);
        } catch (error) {
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
            throw error;
        }
    }

    // Attachments endpoints
    async getAttachments(entityType, entityId) {
        return this.request(`/attachments?entityType=${entityType}&entityId=${entityId}`);
    }

    async uploadAttachment(entityType, entityId, file, description) {
        const token = await this.getToken();
        const formData = new FormData();
        formData.append('entityType', entityType);
        formData.append('entityId', entityId);
        formData.append('file', file);
        formData.append('description', description);

        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}/attachments/upload`, {
                method: 'POST',
                headers,
                body: formData
            });

            const responseText = await response.text();

            if (!response.ok) {
                let errorMessage = `Erro ${response.status}`;
                try {
                    if (responseText) {
                        const error = JSON.parse(responseText);
                        errorMessage = error.message || errorMessage;
                    }
                } catch (e) {
                }
                throw new Error(errorMessage);
            }

            if (!responseText) {
                throw new Error('Resposta vazia do servidor');
            }

            return JSON.parse(responseText);
        } catch (error) {
            throw error;
        }
    }

    async downloadAttachment(id, filename) {
        const token = await this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}/attachments/${id}/download`, {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            throw error;
        }
    }

    async deleteAttachment(id) {
        return this.request(`/attachments/${id}`, 'DELETE');
    }

    async downloadAllAttachments(entityType, entityId) {
        const token = await this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(`${this.baseUrl}/attachments/download-all?entityType=${entityType}&entityId=${entityId}`, {
                method: 'GET',
                headers
            });

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Extrair nome do arquivo do header ou usar padrão
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `anexos_${entityType}_${entityId}.zip`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            throw error;
        }
    }

    // ── Company Details endpoints ──────────────────────────────────────────
    async getCompanyDetail(entityType, entityId, empresaIndex) {
        return this.request(`/company-details?entityType=${entityType}&entityId=${entityId}&empresaIndex=${empresaIndex}`);
    }

    async upsertCompanyDetail(data) {
        return this.request('/company-details', 'POST', data);
    }

    async addCompanyContactLog(companyDetailId, data) {
        return this.request(`/company-details/${companyDetailId}/logs`, 'POST', data);
    }

    async updateCompanyContactLog(logId, data) {
        return this.request(`/company-details/logs/${logId}`, 'PUT', data);
    }

    async deleteCompanyContactLog(logId) {
        return this.request(`/company-details/logs/${logId}`, 'DELETE');
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
    } finally {
        // Limpar localStorage e sessionStorage localmente
        sessionStorage.clear();
        localStorage.clear();

        // Redirecionar para a página inicial (login)
        window.location.href = '/';
    }
}

