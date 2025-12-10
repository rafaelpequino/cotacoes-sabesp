# Sistema de Registro com Validação

## 📋 Estrutura Implementada

### Entidades
1. **User** (Modificada)
   - Adicionada coluna `Registration` (obrigatória)
   - Relacionamento com `AllowedRegistration`

2. **AllowedRegistration** (Nova)
   - `RegistrationNumber` (único)
   - `IsUsed` (booleano)
   - `UsedByUserId` (FK para User)
   - `UsedAt` (data de uso)

### Fluxo de Registro

```
1. Usuário acessa /register
   ↓
2. Insere número de registro
   ↓
3. JavaScript valida via POST /api/auth/verify-registration
   ↓
4. Se válido → Habilita resto do formulário
   ↓
5. Preenche Nome, Email, Senha
   ↓
6. Clica "Criar Conta"
   ↓
7. POST /api/auth/register com todos os dados
   ↓
8. Backend valida:
   - Email não existe
   - Registration é válido
   - Registration não foi usado
   ↓
9. Se OK → Cria usuário + marca registration como usado
   ↓
10. Retorna JWT token
   ↓
11. Frontend armazena token e redireciona para /dashboard
```

## 🔑 Números de Registro Permitidos

Os seguintes números de registro podem ser usados para cadastro:

```
REG001
REG002
REG003
REG004
REG005
REG006
REG007
REG008
REG009
REG010
```

Esses são gerados automaticamente via seed quando você rodar `Update-Database`.

## 📝 Próximos Passos

### 1. Criar nova Migração

```bash
dotnet ef migrations add AddRegistrationAndAllowedRegistrations
```

### 2. Aplicar ao Banco de Dados

```bash
dotnet ef database update
```

Isso irá:
- Adicionar coluna `Registration` na tabela `Users`
- Criar tabela `AllowedRegistrations`
- Inserir os 10 registros permitidos

### 3. Testar o Sistema

1. Execute `dotnet run`
2. Acesse `/register`
3. Digite um dos números acima (ex: REG001)
4. Verifique se valida (deve mostrar "✓ Registro válido!")
5. Preencha nome, email e senha
6. Clique "Criar Conta"
7. Será redirecionado para `/dashboard`

### 4. Adicionar Mais Registros Permitidos

Se quiser adicionar mais registros permitidos no banco:

```sql
INSERT INTO AllowedRegistrations (RegistrationNumber, IsUsed, CreatedAt)
VALUES ('REG011', 0, GETUTCDATE());
```

Ou via código C#:

```csharp
var registration = new AllowedRegistration 
{ 
    RegistrationNumber = "REG011", 
    IsUsed = false 
};
dbContext.AllowedRegistrations.Add(registration);
await dbContext.SaveChangesAsync();
```

## 🔒 Validações Implementadas

✅ Número de registro deve estar na lista de permitidos
✅ Número de registro só pode ser usado UMA VEZ
✅ Email deve ser único
✅ Senha mínimo 6 caracteres
✅ Senhas devem ser iguais (confirmar senha)
✅ Frontend valida registro em tempo real
✅ Backend revalida para segurança

## 📱 Página de Registro

- Link na página de login: `/register`
- Validação em tempo real do número de registro
- Campo de senha com toggle de visibilidade
- Notifications de sucesso/erro
- Responsivo e bonito 😊

## 🎯 Endpoints Utilizados

### Verificar Registro Permitido
```
POST /api/auth/verify-registration
Body: { "registration": "REG001" }
Response: { "isAllowed": true/false }
```

### Criar Nova Conta
```
POST /api/auth/register
Body: {
  "name": "João Silva",
  "email": "joao@email.com",
  "password": "senha123",
  "registration": "REG001"
}
Response: {
  "success": true,
  "message": "Usuário registrado com sucesso",
  "user": { "id": 1, "name": "João Silva", "email": "joao@email.com" },
  "token": "eyJhbGc..."
}
```

## 🚀 Pronto para Usar!

Após rodar `Update-Database`, o sistema estará 100% funcional:

1. Página de login em `/`
2. Link para registrar em `/register`
3. Validação de registro em tempo real
4. Proteção de páginas com JWT
5. CRUD completo funcionando

Bom cadastro! 🎉

