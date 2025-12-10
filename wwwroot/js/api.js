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
            const response = await fetch(`${this.baseUrl}${endpoint}`, options);

            if (response.status === 401) {
                // Token expirado, redirecionar para login
                window.location.href = '/login';
                return null;
            }

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Erro na requisição');
            }

            return await response.json();
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
}

// Criar instância global
const api = new ApiClient();

// Função de logout
function logout(event) {
    if (event) event.preventDefault();

    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar cookies e session storage
        document.cookie = 'authToken=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        sessionStorage.clear();
        localStorage.clear();

        // Redirecionar para login
        window.location.href = '/login';
    }
}

