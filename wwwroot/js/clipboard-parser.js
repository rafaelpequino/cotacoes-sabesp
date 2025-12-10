/**
 * Parser para converter dados de planilha em valores para o formulário
 */

function parseClipboardData(text) {
    try {
        // Split por tab e remove linhas vazias
        let lines = text.trim().split('\n');
        
        // Filtrar linhas vazias ou que contenham apenas espaços
        lines = lines.filter(line => line.trim().length > 0);
        
        if (lines.length === 0) {
            throw new Error('Nenhum dado foi encontrado na área de transferência');
        }
        
        // Pegar apenas a última linha (que contém os dados)
        // Isso evita problemas com cabeçalhos da planilha
        const lastLine = lines[lines.length - 1];
        const values = lastLine.split('\t');
        
        console.log('Dados parseados:', values);
        console.log('Total de colunas:', values.length);

        // Função para limpar e converter valores monetários
        function parseMoneyValue(str) {
            if (!str || str.trim() === '') return '';
            
            // Remove "R$" e espaços
            let cleaned = str.replace(/R\$\s*/g, '').trim();
            
            // Converte vírgula decimal em ponto
            cleaned = cleaned.replace(',', '.');
            
            // Remove qualquer caractere não numérico (exceto ponto)
            cleaned = cleaned.replace(/[^0-9.]/g, '');
            
            return cleaned || '';
        }

        // Função para limpar texto geral
        function cleanText(str) {
            return (str || '').trim();
        }

        // Função auxiliar para pegar valor seguro
        function getValue(index, isMonetary = false) {
            if (index < values.length) {
                const val = values[index];
                return isMonetary ? parseMoneyValue(val) : cleanText(val);
            }
            return '';
        }

        return {
            // Campos de texto
            idOriginal: getValue(0),                      // 0. ID Original
            item: getValue(1),                            // 1. Item
            unidade: getValue(2),                         // 2. Unidade
            
            // Campos de preço
            precoFornCorrigido: getValue(3, true),        // 3. Adotada - Preço Forn. (corrigido)
            precoMontagem: getValue(4, true),             // 4. Preço montagem / instalação
            precoAdotado: getValue(6, true),              // 6. Preço adotado (pula a coluna 5)
            mediaAdotada: getValue(8, true),              // 8. Média adotada (pula a coluna 7)
            mediaSaneada: getValue(9, true),              // 9. Média Saneada
            menorValor: getValue(10, true),               // 10. Menor Valor
            mediaAritmetica: getValue(11, true),          // 11. Média Aritmética
            mediana: getValue(12, true),                  // 12. Mediana
            empresa1: getValue(14, true),                 // 14. Empresa 1 (pula a coluna 13)
            empresa2: getValue(15, true),                 // 15. Empresa 2
            empresa3: getValue(16, true),                 // 16. Empresa 3
            empresa4: getValue(17, true),                 // 17. Empresa 4
            empresa5: getValue(18, true),                 // 18. Empresa 5
            empresa6: getValue(19, true),                 // 19. Empresa 6
            
            justificativa: getValue(20),                  // 20. Justificativa
            tempoPassado: getValue(22),                   // 22. Tempo passado (pula a coluna 21)
            mesAnterior: getValue(23),                    // 23. Mês anterior
            indiceAnterior: getValue(24, true),           // 24. Índice anterior
            indiceAtual: getValue(25, true)               // 25. Índice atual
        };
    } catch (error) {
        console.error('Erro ao fazer parse dos dados:', error);
        throw error;
    }
}

/**
 * Preenche os inputs do modal com os dados parseados
 */
function fillFormWithParsedData(modal, parsedData) {
    try {
        // Selecionar inputs por tipo de placeholder (mais específico e confiável)
        const idOriginalInput = modal.querySelector('input[placeholder="Ex: 00001"]');
        const itemInput = modal.querySelector('input[placeholder="Descrição do item"]');
        const unidadeInput = modal.querySelector('input[placeholder="Ex: Un., m², Kg"]');
        const mesAnteriorInput = modal.querySelector('input[placeholder="Ex: Janeiro"]');
        
        // Preencher inputs de texto
        if (idOriginalInput) idOriginalInput.value = parsedData.idOriginal;
        if (itemInput) itemInput.value = parsedData.item;
        if (unidadeInput) unidadeInput.value = parsedData.unidade;
        if (mesAnteriorInput) mesAnteriorInput.value = parsedData.mesAnterior;
        
        // Preencher textarea
        const textareaInputs = modal.querySelectorAll('textarea');
        if (textareaInputs[0]) textareaInputs[0].value = parsedData.justificativa;
        
        // Preencher inputs de número - precisa ser ordenado cuidadosamente
        const numberInputs = modal.querySelectorAll('input[type="number"]');
        
        if (numberInputs.length < 17) {
            throw new Error(`Não foram encontrados campos suficientes no formulário. Esperado: 17, encontrado: ${numberInputs.length}`);
        }
        
        // Mapear cada campo de preço para o seu input correspondente
        let idx = 0;
        
        // Primeira linha de preços
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.precoFornCorrigido;          // Adotada - Preço Forn.
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.precoMontagem;              // Preço montagem
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.precoAdotado;               // Preço adotado
        
        // Segunda linha de preços
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.mediaAdotada;               // Média adotada
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.mediaSaneada;               // Média Saneada
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.menorValor;                 // Menor Valor
        
        // Terceira linha de preços
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.mediaAritmetica;            // Média Aritmética
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.mediana;                    // Mediana
        
        // Seção de preços das empresas
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.empresa1;                   // Empresa 1
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.empresa2;                   // Empresa 2
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.empresa3;                   // Empresa 3
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.empresa4;                   // Empresa 4
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.empresa5;                   // Empresa 5
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.empresa6;                   // Empresa 6
        
        // Última seção de valores
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.tempoPassado;               // Tempo passado
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.indiceAnterior;             // Índice anterior
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.indiceAtual;                // Índice atual
        
    } catch (error) {
        console.error('Erro ao preencher formulário:', error);
        throw error;
    }
}

