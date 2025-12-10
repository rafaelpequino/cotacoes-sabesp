# Setup do Projeto CotacoesEPC

## ✅ Passo 1: Arquivo .env (JÁ CRIADO)

O arquivo `.env` já foi criado na raiz do projeto com todas as configurações necessárias.

**Arquivo**: `.env`

```env
ConnectionStrings__DefaultConnection=Server=(localdb)\mssqllocaldb;Database=CotacoesEPC;Trusted_Connection=true;
Jwt__Key=your-super-secret-key-that-is-at-least-32-characters-long-for-hs256
Jwt__Issuer=CotacoesEPC
Jwt__Audience=CotacoesEPCUsers
Jwt__ExpirationMinutes=1440
ASPNETCORE_ENVIRONMENT=Development
```

## ✅ Passo 2: Pacotes NuGet (JÁ INSTALADOS)

Os seguintes pacotes foram adicionados e instalados:

- `Microsoft.EntityFrameworkCore` (8.0.0)
- `Microsoft.EntityFrameworkCore.SqlServer` (8.0.0)
- `Microsoft.EntityFrameworkCore.Tools` (8.0.0)
- `Microsoft.AspNetCore.Authentication.JwtBearer` (8.0.0)
- `Microsoft.AspNetCore.Identity.EntityFrameworkCore` (8.0.0)
- `System.IdentityModel.Tokens.Jwt` (7.1.2)
- `Microsoft.IdentityModel.Tokens` (7.1.2)
- `DotNetEnv` (2.3.0)

## ✅ Passo 3: Migração do Banco de Dados (JÁ CRIADA)

A migração inicial foi criada com todas as entidades:

- **Users** - Tabela de usuários
- **Services** - Tabela de cotações de serviços
- **Inputs** - Tabela de cotações de insumos
- **Spreadsheets** - Tabela de planilhas

**Status**: Migração criada e pronta para aplicar

## ⏭️ Passo 4: PRÓXIMOS PASSOS (VOCÊ PRECISA FAZER)

### 4.1 Criar o Banco de Dados no LocalDB

Execute no SQL Server Management Studio ou via PowerShell:

```bash
sqllocaldb create "CotacoesEPC"
sqllocaldb start "CotacoesEPC"
```

### 4.2 Aplicar a Migração

Execute o comando no terminal:

```bash
dotnet ef database update
```

Isso irá:
- Criar todas as tabelas
- Configurar as relações entre tabelas
- Aplicar as constraints e índices

### 4.3 Verificar a Criação

Conecte ao LocalDB e verifique se as tabelas foram criadas:

```bash
sqllocaldb info "CotacoesEPC"
```

## 🏃 Passo 5: Executar a Aplicação

Após aplicar a migração, execute:

```bash
dotnet run
```

A aplicação estará disponível em `https://localhost:7000`

## 📋 Estrutura Implementada

### Models (Entidades)
- ✅ `User.cs` - Usuários do sistema
- ✅ `Service.cs` - Cotações de serviços
- ✅ `Input.cs` - Cotações de insumos
- ✅ `Spreadsheet.cs` - Planilhas

### Controllers (APIs)
- ✅ `AuthController.cs` - Login e autenticação
- ✅ `ServicesController.cs` - CRUD de serviços
- ✅ `InputsController.cs` - CRUD de insumos
- ✅ `SpreadsheetsController.cs` - CRUD de planilhas
- ✅ `DashboardController.cs` - Dados do dashboard

### Services
- ✅ `AuthService.cs` - Lógica de autenticação
- ✅ `JwtService.cs` - Geração e validação de JWT

### Data
- ✅ `ApplicationDbContext.cs` - Contexto do Entity Framework

### Frontend
- ✅ `api.js` - Cliente HTTP para comunicação com API
- ✅ `dashboard.js` - Scripts do dashboard
- ✅ Menu dropdown com logout

## 🔐 Autenticação

A aplicação usa **JWT (JSON Web Token)** para autenticação:

1. Login via `/api/auth/login`
2. Token armazenado em cookie HTTP-only
3. Enviado automaticamente em todas as requisições
4. Validação em todos os endpoints protegidos

## 🚀 Endpoints Disponíveis

### Auth
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/register` - Registrar novo usuário (se implementar)

### Services
- `GET /api/services` - Listar serviços
- `POST /api/services` - Criar serviço
- `GET /api/services/{id}` - Obter serviço
- `PUT /api/services/{id}` - Atualizar serviço
- `DELETE /api/services/{id}` - Deletar serviço

### Inputs
- `GET /api/inputs` - Listar insumos
- `POST /api/inputs` - Criar insumo
- `GET /api/inputs/{id}` - Obter insumo
- `PUT /api/inputs/{id}` - Atualizar insumo
- `DELETE /api/inputs/{id}` - Deletar insumo

### Spreadsheets
- `GET /api/spreadsheets` - Listar planilhas
- `POST /api/spreadsheets` - Criar planilha
- `GET /api/spreadsheets/{id}` - Obter planilha
- `PUT /api/spreadsheets/{id}` - Atualizar planilha
- `DELETE /api/spreadsheets/{id}` - Deletar planilha

### Dashboard
- `GET /api/dashboard/summary` - Resumo do dashboard
- `GET /api/dashboard/statistics` - Estatísticas

## 📝 Notas

- Todos os endpoints estão protegidos com JWT
- Os tokens expiram em 1440 minutos (24 horas)
- As senhas são hasheadas com SHA256
- Os dados de cada usuário são isolados (não veem dados de outros usuários)
- CORS habilitado para requisições do frontend

## 🐛 Troubleshooting

### Erro "Database already exists"
Se o banco de dados já existe, execute:
```bash
dotnet ef database drop --force
dotnet ef database update
```

### Erro "Connection string not found"
Verifique se o arquivo `.env` está na raiz do projeto e se contém a chave `ConnectionStrings__DefaultConnection`

### Erro "JWT key too short"
Certifique-se de que a chave JWT tem no mínimo 32 caracteres

---

**Status**: ✅ Backend pronto para `Update-Database`

