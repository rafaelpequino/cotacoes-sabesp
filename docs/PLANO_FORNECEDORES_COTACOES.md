# Plano de Alteração: Integração de Fornecedores em Cotações

## 📋 Objetivo Geral

Substituir os campos de texto simples para "Nome da Empresa" por componentes Select com busca de fornecedores, permitindo que o usuário escolha fornecedores cadastrados ou digite um valor customizado se não encontrar.

---

## ✅ Status de Existência de Recursos

| Recurso | Status | Localização |
|---------|--------|-------------|
| API `/api/suppliers` (GET) | ✅ EXISTE | `SuppliersController.cs` - linha 21 |
| Modelo `Supplier` | ✅ EXISTE | `Models/Supplier.cs` |
| Campos `Supplier1Id-6Id` | ✅ EXISTE | `Models/Quotation.cs` (linhas 81-86) |
| Campos `NomeEmpresa1-6` | ✅ EXISTE | `Models/Quotation.cs` (linhas 52-77) |
| Modal HTML criar | ✅ EXISTE | `Pages/cotacoes.cshtml` |
| Modal HTML editar | ✅ EXISTE | `Pages/cotacoes.cshtml` |

**Observação:** A estrutura do banco já suporta tanto `NomeEmpresa` (texto) quanto `SupplierId`. Precisamos apenas implementar a interface do usuário.

---

## 🏗️ Escopo da Alteração

### Funcionalidades Novas

1. **Select com Busca (Searchable Select)**
   - 6 campos de empresa (Empresa 1 a 6) nos modais de criação/edição (NÃO em visualizar)
   - Campo de input de texto para buscar por nome do fornecedor
   - Opção "Outro..." para digitar valor customizado
   - Visualização em tempo real dos fornecedores filtrados
   - Busca ampla: substring matching (ex: "VIZCA" traz "VIZCA", "VIZCA Brasil", "Brasil LTDA")

2. **Integração com Fornecedores**
   - Usar endpoint GET `/api/suppliers` (já existe)
   - Retorna objeto: `{ id, nomeFantasia, cnpj, telefone, endereco, dataCadastro, updatedAt }`
   - Filtrar client-side em tempo real (sem chamadas API repetidas)
   - Armazenar ID do fornecedor (se selecionado) OU texto livre (se "Outro")

3. **Integração com Colagem de Excel**
   - Quando colar dados, o texto do Excel vai para o campo de input (busca)
   - Se encontrar fornecedor com nome similar, pré-seleciona
   - Se não encontrar, mantém como texto livre (modo "Outro")
   - Exemplo: Usuário cola "VIZCA", campo busca encontra e seleciona fornecedor "VIZCA"

4. **Modal de Visualização (Melhorias)**
   - Se empresa foi de fornecedor: mostrar botão "Ver Detalhes do Fornecedor"
   - Botão leva para página/modal com dados completos do fornecedor (CNPJ, telefone, endereço, etc.)
   - Se empresa foi texto livre: não mostrar botão

---

## 📊 Arquitetura Técnica

### 1. **Banco de Dados (SEM ALTERAÇÕES)**

**Tabela: `Quotations` (já pronta)**
```sql
- NomeEmpresa1-6: varchar(200) - Nome da empresa (texto ou nome do fornecedor)
- Supplier1Id-6: int (nullable) - FK para Supplier (pode ser null se texto livre)
```

**Fluxo:**
- Se user seleciona fornecedor: preenche `NomeEmpresa1` + `Supplier1Id`
- Se user digita texto livre: preenche apenas `NomeEmpresa1`, `Supplier1Id` = null

### 2. **Frontend - Componente Searchable Select**

**Arquivo a criar:** `wwwroot/js/searchable-supplier-select.js`

```
Estrutura do componente:
├── HTML (dentro dos modais)
│   ├── Input de busca (type="text", required)
│   ├── Div com lista de opções (dropdown)
│   ├── Opção "Outro..." no final
│   └── Input hidden para armazenar SupplierId (nullable)
├── JavaScript
│   ├── SupplierSelect class
│   │   ├── init() - Inicializa o componente
│   │   ├── loadSuppliers() - Busca do API
│   │   ├── filter(searchTerm) - Faz substring match
│   │   ├── render() - Renderiza dropdown
│   │   ├── select(supplier) - Seleciona fornecedor
│   │   ├── selectCustom(text) - Ativa modo "Outro"
│   │   └── getValue() - Retorna {nomeEmpresa, supplierId}
│   └── Event listeners (input, blur, keydown)
└── CSS (adicionar em dashboard.css)
    ├── Estilos do input de busca
    ├── Estilos do dropdown
    └── Estados (hover, focus, selected, disabled)
```

**Dados do Fornecedor:**
```javascript
{
  id: 1,
  nomeFantasia: "VIZCA",
  cnpj: "00.000.000/0001-00",
  telefone: "(11) 99999-9999",
  endereco: "Rua X, nº 100, São Paulo",
  dataCadastro: "2026-01-15T10:30:00Z"
}
```

### 3. **Backend - API de Fornecedores (JÁ EXISTE)**

**Endpoint:** `GET /api/suppliers?search=VIZCA&sort=nome`
- ✅ Já retorna lista de fornecedores com busca
- ✅ Usa substring matching no NomeFantasia, CNPJ, Telefone, Endereco
- ✅ Suporta sorting: "recentes", "antigos", "nome"

**Response:**
```json
[
  {
    "id": 1,
    "nomeFantasia": "VIZCA",
    "cnpj": "00.000.000/0001-00",
    "telefone": "(11) 99999-9999",
    "endereco": "Rua X, nº 100",
    "dataCadastro": "2026-01-15T10:30:00Z",
    "updatedAt": null
  },
  { ... }
]
```

### 4. **Mudanças no Modal de Criação/Edição**

**Arquivo:** `Pages/cotacoes.cshtml` (modais `createModal` e `editModal`)

**Antes (HTML atual):**
```html
<div class="form-group">
  <label>Nome da Empresa 1</label>
  <input type="text" name="nomeEmpresa1" placeholder="Ex: SABESP" />
</div>
```

**Depois (novo HTML):**
```html
<div class="form-group">
  <label>Nome da Empresa 1*</label>
  <div class="searchable-supplier-select" data-company-index="1">
    <input 
      type="text" 
      class="supplier-search-input" 
      placeholder="Buscar fornecedor ou digitar nome..." 
      autocomplete="off"
      required
    />
    <div class="supplier-dropdown" style="display: none;"></div>
  </div>
  <input 
    type="hidden" 
    name="nomeEmpresa1" 
    class="hidden-supplier-name"
    value=""
    required
  />
  <input 
    type="hidden" 
    name="supplier1Id" 
    class="hidden-supplier-id"
    value=""
  />
</div>
```

**Repetir para:** `empresa2` até `empresa6` (ajustar data-company-index, names e classes)

### 5. **Modal de Visualização (MUDANÇAS MÍNIMAS)**

**Arquivo:** `Pages/cotacoes.cshtml` (modal `viewModal`)

**Seção de empresas:**
```html
<div class="company-card" id="company-card-1">
  <span class="company-label" id="company-name-1">Empresa 1</span>
  <span class="company-value" id="company-value-1">-</span>
  
  <!-- NOVO: Botão para ver detalhes do fornecedor -->
  <button 
    class="btn-supplier-details" 
    id="btn-supplier-details-1"
    title="Ver detalhes do fornecedor"
    onclick="viewSupplierDetails(1)"
    style="display: none;"
  >
    📋 Detalhes
  </button>
  
  <!-- Botão antigo: detalhes da empresa (em cotação) -->
  <button 
    class="btn-company-detail" 
    title="Ver / editar dados da empresa" 
    onclick="openCompanyDetailModal('Quotation', 1)"
  >
    ℹ️ Contatos
  </button>
</div>
```

---

## 🔄 Fluxos de Dados

### Fluxo 1: Criar Nova Cotação

```
1. Página carrega
2. JavaScript: SupplierSelect.loadSuppliers() → Carrega lista (1 vez)
3. Usuário clica em campo de empresa 1
4. JavaScript: Mostra dropdown com todos fornecedores
5. Usuário digita "VIZ"
6. JavaScript: .filter("VIZ") → Substring match → "VIZCA", "VIZCA Brasil"
7. Usuário clica em "VIZCA"
8. JavaScript: .select(supplier)
   └─ nomeEmpresa1 = "VIZCA"
   └─ supplier1Id = 1
9. Usuário clica em "Salvar"
10. Controller recebe: { ..., nomeEmpresa1: "VIZCA", supplier1Id: 1 }
11. Salva ambos os campos no banco
```

### Fluxo 2: Digitar Valor Customizado

```
1. Usuário digita "Fornecedor XYZ Ltda" (não existe)
2. JavaScript: .filter() → Sem resultados
3. Mostra opção "Outro... (usar 'Fornecedor XYZ Ltda')"
4. Usuário clica em "Outro..."
5. JavaScript: .selectCustom("Fornecedor XYZ Ltda")
   └─ nomeEmpresa1 = "Fornecedor XYZ Ltda"
   └─ supplier1Id = null (ou vazio)
6. Usuário salva
7. Controller recebe: { ..., nomeEmpresa1: "Fornecedor XYZ Ltda", supplier1Id: null }
8. Salva nomeEmpresa1, deixa supplier1Id como null
```

### Fluxo 3: Colar do Excel

```
1. Usuário clica "Colar dados da planilha"
2. JavaScript: pasteFromClipboard() em clipboard-parser.js
3. Para cada nomeEmpresa (ex: "VIZCA"):
   └─ Preenche input de busca: "VIZCA"
   └─ SupplierSelect: .filter("VIZCA") → encontra fornecedor
   └─ Auto-seleciona: .select(supplier)
   └─ nomeEmpresa1 = "VIZCA", supplier1Id = 1
4. Campos ficam preenchidos e prontos para edição
5. Usuário pode clicar salvar sem alterar
```

### Fluxo 4: Editar Cotação Existente

```
1. Usuário clica em "Editar"
2. Modal abre vazio
3. JavaScript: Preenche com dados salvos:
   └─ Se supplier1Id não é null: procura supplier na lista
   └─ Se encontra: .select(supplier) → mostra input = "VIZCA"
   └─ Se não encontra (deletado): .selectCustom(nomeEmpresa1) → mostra input = "VIZCA"
   └─ Se supplier1Id é null: .selectCustom(nomeEmpresa1) → entrada livre
4. Usuário pode alterar ou confirmar
```

### Fluxo 5: Visualizar Cotação

```
1. Usuário clica "Visualizar"
2. Modal de view abre
3. Para cada empresa:
   └─ Se supplier1Id não é null (vem do banco):
       ├─ Mostra nome do fornecedor: "VIZCA"
       ├─ Mostra botão "📋 Detalhes" (ver detalhes do fornecedor)
       └─ onclick -> viewSupplierDetails(supplierId) -> modal com dados do fornecedor
   └─ Se supplier1Id é null:
       ├─ Mostra nome da empresa: "Fornecedor XYZ Ltda"
       └─ Oculta botão "📋 Detalhes"
       └─ Mostra apenas botão "ℹ️ Contatos" (dados de contato da empresa)
```

---

## 🛠️ Modificações Necessárias

### 1. **wwwroot/js/searchable-supplier-select.js** (NOVO)
- Classe `SupplierSelect` com init, load, filter, render, select, etc.
- Suportar múltiplas instâncias (uma por empresa 1-6)
- Usar cache de fornecedores em memória
- Evento: quando seleciona, preenche hidden inputs

### 2. **wwwroot/js/clipboard-parser.js** (MODIFICAR)
- Ao colar dados: não apenas preencher input de texto
- Integração com `SupplierSelect`: chamar `.filter()` para tentar encontrar
- Se encontrar: `.select(supplier)`
- Se não encontrar: `.selectCustom(text)`

### 3. **wwwroot/js/cotacoes-page.js** (MODIFICAR)
- Função `editQuotation()`: 
  - Recuperar dados salvos (nomeEmpresa e supplierId)
  - Para cada campo, chamar SupplierSelect².restore() ou similar
- Função `saveQuotation()` / `updateQuotation()`:
  - Capturar valores dos SupplierSelect (nomeEmpresa + supplierId)
  - Enviar para controller
- Função `viewQuotation()`:
  - Se supplierId não é null: mostrar botão "Detalhes"
  - Ao clicar: chamar `viewSupplierDetails(supplierId)`

### 4. **Pages/cotacoes.cshtml** (MODIFICAR)
- **Modal createModal**: Substituir 6 inputs de nomeEmpresa por SupplierSelect
- **Modal editModal**: Substituir 6 inputs de nomeEmpresa por SupplierSelect
- **Modal viewModal**: Adicionar botão "📋 Detalhes" para cada empresa (com modal de supplier details)
- Adicionar import: `<script src="~/js/searchable-supplier-select.js"></script>`

### 5. **wwwroot/css/dashboard.css** (ADICIONAR)
- `.searchable-supplier-select-container` - wrapper
- `.searchable-supplier-select` - container do select
- `.supplier-search-input` - input de busca
- `.supplier-dropdown` - container do dropdown
- `.supplier-option` - cada opção
- `.supplier-option:hover` - hover
- `.supplier-option.selected` - selected
- `.supplier-option.no-results` - sem resultados
- `.supplier-option.outro` - opção "Outro"

### 6. **Controllers/QuotationsController** (VERIFICAR)
- Verificar se aceita `supplier1Id` até `supplier6Id` nos requests
- Se SIM: ok
- Se NÃO: adicionar aos DTOs (request model)

---

## 📱 Considerações de UX

### Validação
- ✅ Campo sempre tem um valor (obrigatório: type="text" com required)
- ✅ Se usuário seleciona: nomeEmpresa1 = nome do fornecedor (obrigatório)
- ✅ Se usuário digita livre: nomeEmpresa1 = texto digitado (obrigatório)
- ✅ supplier1Id é nullable

### Acessibilidade
- ✅ Input com label associado (htmlFor)
- ✅ Opções com ARIA roles
- ✅ Navegação com setas (cima/baixo) e Enter
- ✅ Escape fecha dropdown

### Performance
- ✅ Cache de fornecedores em memória (1 fetch ao carregar página)
- ✅ Filtro client-side (sem chamadas API repetidas)
- ✅ Substring matching rápido

### Edgecases
1. **Fornecedor deletado após criar cotação**
   - Solução: Ao editar, se supplierId não encontra fornecedor, mostrar nomeEmpresa como texto livre
   
2. **Busca ampla**: Usuário digita "VIZCA Brasil" → traz "VIZCA", "VIZCA Brasil", "Brasil LTDA"
   - Solução: Split por espaço e fazer OR (contains any word)
   
3. **Múltiplas empresas com mesmo nome**: 
   - Solução: Permitir (cada uma com seu próprio ID de fornecedor)

4. **Sem fornecedores cadastrados**:
   - Dropdown mostra apenas "Outro..." → usuário sempre consegue digitar

---

## ✅ Checklist de Implementação

- [ ] Verificar estrutura de Response do `/api/suppliers`
- [ ] Verificar se `QuotationsController` aceita `supplierId` nos DTOs
- [ ] Criar `searchable-supplier-select.js` com classe SupplierSelect
- [ ] Atualizar HTML dos modais createModal e editModal (6 campos cada)
- [ ] Atualizar HTML do modal viewModal (adicionar botão "Detalhes")
- [ ] Adicionar estilos em `dashboard.css`
- [ ] Modificar `clipboard-parser.js` para integrar com SupplierSelect
- [ ] Modificar `cotacoes-page.js` (edit, save, update, view)
- [ ] Testar: Criar nova cotação (selecionar fornecedor)
- [ ] Testar: Criar nova cotação (texto customizado "Outro")
- [ ] Testar: Colar do Excel (com fornecedor)
- [ ] Testar: Colar do Excel (sem fornecedor)
- [ ] Testar: Editar cotação (com supplierId)
- [ ] Testar: Editar cotação (sem supplierId)
- [ ] Testar: Visualizar cotação + botão "Detalhes"
- [ ] Testar: Modal com detalhes do fornecedor
- [ ] Testar: Responsividade do dropdown
- [ ] Testar: Navegação com teclado (setas, Enter, Escape)

---

## 📝 Notas Adicionais

### Compatibilidade
- ✅ Mudanças são backward-compatible
- ✅ Banco de dados já tem campos preparados
- ✅ Dados antigos continuam funcionando normalmente (supplierId = null)

### Manutenção Futura
- Considerar adicionar autocomplete no backend se lista crescer muito (> 1000)
- Possível otimização: carregar cached de fornecedores via sessionStorage

### Possíveis Melhorias (Fase 2)
1. Autocomplete avançado (fuzzy matching)
2. Favorite suppliers (pinned/recently used)
3. Ícone/logo do fornecedor
4. Filtro por categoria de fornecedor
5. Importação em massa de fornecedores

