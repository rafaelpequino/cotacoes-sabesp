# Clipboard Parser - Documentação

## Descrição
O `clipboard-parser.js` é um módulo JavaScript que converte dados copiados de uma planilha (no formato Excel/Sheets com separadores de tabulação) para valores que preenchem automaticamente o formulário de cotação.

## Formato Esperado de Dados

Os dados devem vir da planilha na seguinte ordem (separados por tabulação):

```
ID_ORIGINAL    ITEM    UNIDADE    PRECO_FORN    PRECO_MONT    (vazio)    PRECO_ADOTADO    (vazio)    MEDIA_ADOTADA    MEDIA_SANEADA    MENOR_VALOR    MEDIA_ARIT    MEDIANA    (vazio)    EMPRESA1    EMPRESA2    EMPRESA3    EMPRESA4    EMPRESA5    EMPRESA6    JUSTIFICATIVA    (vazio)    TEMPO_PASSADO    MES_ANTERIOR    INDICE_ANTERIOR    INDICE_ATUAL
```

### Exemplo Real:
```
10001	Item exemplo	Um	R$ 100,00	R$ 100,00		R$ 100,00		R$ 100,00	R$ 100,00	R$ 100,00	R$ 100,00	R$ 100,00		R$ 100,00	R$ 100,00	R$ 100,00	R$ 100,00	R$ 100,00		Justificativa		R$ 1,00	Dezembro	R$ 1,00	R$ 1,00
```

## Funções Disponíveis

### 1. `parseClipboardData(text)`
Converte uma string de dados brutos da clipboard em um objeto estruturado.

**Parâmetros:**
- `text` (string): Os dados brutos copiados da planilha

**Retorna:**
Um objeto com as seguintes propriedades:
```javascript
{
  idOriginal: string,
  item: string,
  unidade: string,
  precoFornCorrigido: string,        // Convertido de "R$ 100,00" para "100"
  precoMontagem: string,
  precoAdotado: string,
  mediaAdotada: string,
  mediaSaneada: string,
  menorValor: string,
  mediaAritmetica: string,
  mediana: string,
  empresa1: string,
  empresa2: string,
  empresa3: string,
  empresa4: string,
  empresa5: string,
  empresa6: string,
  justificativa: string,
  tempoPassado: string,
  mesAnterior: string,
  indiceAnterior: string,
  indiceAtual: string
}
```

### 2. `fillFormWithParsedData(modal, parsedData)`
Preenche todos os inputs do modal com os dados parseados.

**Parâmetros:**
- `modal` (HTMLElement): O elemento do modal que contém os inputs
- `parsedData` (object): O objeto retornado por `parseClipboardData()`

**Comportamento:**
- Localiza inputs pelos seus placeholders específicos
- Preenche inputs de texto (ID, Item, Unidade, Mês Anterior)
- Preenche inputs de número na ordem correta
- Preenche o textarea de justificativa

## Conversões Realizadas

### Valores Monetários
- Remove "R$" do início
- Substitui vírgula por ponto (conversão de formato brasileiro para inglês)
- Remove caracteres não numéricos
- Retorna valor em formato numérico válido

**Exemplos:**
- `"R$ 100,00"` → `"100"`
- `"R$ 1.234,56"` → `"1234.56"`
- `" R$ 50,00 "` → `"50"` (espaços também removidos)

### Texto Geral
- Remove espaços no início e fim (`trim()`)
- Mantém conteúdo como-está

## Uso nas Páginas

### insumos.cshtml
Quando o usuário clica no botão "📋 Colar dados da planilha":
1. A função `pasteFromClipboard()` é chamada
2. Os dados são lidos da clipboard
3. `parseClipboardData()` converte os dados
4. `fillFormWithParsedData()` preenche o formulário
5. Uma notificação de sucesso é exibida

### servicos.cshtml
Funciona exatamente igual à página de insumos.

## Tratamento de Erros

O parser valida:
- Se dados foram copiados (não vazio)
- Se há espaço suficiente nos inputs do formulário
- Se os dados podem ser parseados corretamente

Erros são exibidos em um alerta e também logados no console para debug.

## Requisitos

- Navegador com suporte a `navigator.clipboard.readText()` (Chrome, Firefox, Safari, Edge)
- Modal com inputs nos locais esperados (com placeholders específicos)

