# CotacoesEPC - Sistema de Compartilhamento de Cotações

Sistema web para gerenciamento e compartilhamento de cotações de serviços e insumos.

## Requisitos

- .NET 8.0 SDK
- SQL Server (LocalDB ou Express)
- Node.js (opcional, para ferramentas front-end)

## Instalação

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd CotacoesEPC
```

### 2. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
# Database Configuration
ConnectionStrings__DefaultConnection=Server=(localdb)\mssqllocaldb;Database=CotacoesEPC;Trusted_Connection=true;

# JWT Configuration
Jwt__Key=sua-chave-secreta-com-no-minimo-32-caracteres-para-hs256
Jwt__Issuer=CotacoesEPC
Jwt__Audience=CotacoesEPCUsers
Jwt__ExpirationMinutes=1440

# Environment
ASPNETCORE_ENVIRONMENT=Development
```

### 3. Instalar dependências

```bash
dotnet restore
```

### 4. Criar e migrar banco de dados

```bash
# Atualizar Banco de Dados
dotnet ef database update
```

### 5. Executar a aplicação

```bash
dotnet run
```

## Estrutura do Projeto

```
CotacoesEPC/
├── Models/                 # Entidades de dados
│   ├── User.cs
│   ├── Service.cs
│   ├── Input.cs
│   └── Spreadsheet.cs
├── Controllers/            # API Controllers
│   ├── AuthController.cs
│   ├── ServicesController.cs
│   ├── InputsController.cs
│   ├── SpreadsheetsController.cs
│   └── DashboardController.cs
├── Services/              # Serviços de negócio
│   ├── IAuthService.cs
│   ├── AuthService.cs
│   ├── IJwtService.cs
│   └── JwtService.cs
├── Data/                  # Contexto do banco de dados
│   └── ApplicationDbContext.cs
├── Pages/                 # Páginas Razor
│   ├── Index.cshtml
│   ├── dashboard.cshtml
│   ├── servicos.cshtml
│   ├── insumos.cshtml
│   └── planilhas.cshtml
├── wwwroot/              # Arquivos estáticos
│   ├── css/
│   ├── js/
│   └── images/
└── appsettings.json      # Configurações da aplicação
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registrar novo usuário

### Serviços (Cotações)
- `GET /api/services` - Listar serviços
- `GET /api/services/{id}` - Obter serviço específico
- `POST /api/services` - Criar novo serviço
- `PUT /api/services/{id}` - Atualizar serviço
- `DELETE /api/services/{id}` - Deletar serviço

### Insumos
- `GET /api/inputs` - Listar insumos
- `GET /api/inputs/{id}` - Obter insumo específico
- `POST /api/inputs` - Criar novo insumo
- `PUT /api/inputs/{id}` - Atualizar insumo
- `DELETE /api/inputs/{id}` - Deletar insumo

### Planilhas
- `GET /api/spreadsheets` - Listar planilhas
- `GET /api/spreadsheets/{id}` - Obter planilha específica
- `POST /api/spreadsheets` - Criar nova planilha
- `PUT /api/spreadsheets/{id}` - Atualizar planilha
- `DELETE /api/spreadsheets/{id}` - Deletar planilha

### Dashboard
- `GET /api/dashboard/summary` - Resumo do dashboard
- `GET /api/dashboard/statistics` - Estatísticas

## Autenticação

A aplicação usa JWT (JSON Web Token) para autenticação. O token é armazenado em um cookie HTTP-only após o login e é enviado automaticamente em todas as requisições à API.

## Desenvolvimento

### Criar migrations do banco de dados

```bash
dotnet ef migrations add <NomeMigracao>
dotnet ef database update
```

### Reverter migração

```bash
dotnet ef database update <NomeMigracaoAnterior>
```

## Licença

MIT

## Suporte

Para reportar bugs ou sugerir melhorias, abra uma issue no repositório.

