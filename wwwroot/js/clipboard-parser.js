/**
 * Parser para converter dados de planilha em valores para o formulário
 * Agora suporta 2 linhas: linha de nomes das empresas e linha de valores
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
        
        // Verificar se temos pelo menos 2 linhas (nomes das empresas + valores)
        let companyNames = [];
        let lastLine;
        
        if (lines.length >= 2) {
            // Primeira linha: nomes das empresas
            const firstLine = lines[lines.length - 2];
            const firstLineValues = firstLine.split('\t');
            
            // Os nomes das empresas estão NO FINAL da primeira linha
            // Vamos pegar os últimos valores não vazios antes da justificativa
            // Pela estrutura da planilha: [...valores...] [Nome1] [Nome2] [Nome3] [Nome4] [Nome5] [Nome6] [Justificativa]
            
            // Encontrar os últimos 6 valores antes do fim (ignorando a justificativa que é a última)
            const reversedValues = [...firstLineValues].reverse();
            const foundNames = [];
            
            // Pular o primeiro (justificativa) e pegar os próximos 6
            for (let i = 1; i < reversedValues.length && foundNames.length < 6; i++) {
                const value = reversedValues[i].trim();
                if (value !== '') {
                    foundNames.unshift(value); // Adicionar no início para manter a ordem
                }
            }
            
            // Preencher companyNames com os nomes encontrados
            // Se encontrou menos de 6, preencher o resto com vazios
            for (let i = 0; i < 6; i++) {
                companyNames.push(foundNames[i] || '');
            }
            
            // Segunda linha: valores
            lastLine = lines[lines.length - 1];
        } else {
            // Se há apenas 1 linha, usar comportamento antigo
            lastLine = lines[lines.length - 1];
            companyNames = ['', '', '', '', '', '']; // Sem nomes
        }
        
        const values = lastLine.split('\t');
        
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
            idOriginal: getValue(0),                      // 0. I0 Original (formato jan/00)
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
            
            // Nomes das empresas (dos últimos 6 valores da primeira linha)
            nomeEmpresa1: companyNames[0],                // Nome da Empresa 1
            nomeEmpresa2: companyNames[1],                // Nome da Empresa 2
            nomeEmpresa3: companyNames[2],                // Nome da Empresa 3
            nomeEmpresa4: companyNames[3],                // Nome da Empresa 4
            nomeEmpresa5: companyNames[4],                // Nome da Empresa 5
            nomeEmpresa6: companyNames[5],                // Nome da Empresa 6
            
            // Valores das empresas (da segunda linha)
            empresa1: getValue(14, true),                 // 14. Empresa 1 (pula a coluna 13)
            empresa2: getValue(15, true),                 // 15. Empresa 2
            empresa3: getValue(16, true),                 // 16. Empresa 3
            empresa4: getValue(17, true),                 // 17. Empresa 4
            empresa5: getValue(18, true),                 // 18. Empresa 5
            empresa6: getValue(19, true),                 // 19. Empresa 6
            
            justificativa: getValue(20)                   // 20. Justificativa
        };
    } catch (error) {
        console.error('Erro no parser:', error);
        throw error;
    }
}

/**
 * Preenche os inputs do modal com os dados parseados
 */
function fillFormWithParsedData(modal, parsedData) {
    try {
        // Selecionar inputs por tipo de placeholder (mais específico e confiável)
        const idOriginalInput = modal.querySelector('input[placeholder="Ex: jan/00"]');
        const itemInput = modal.querySelector('input[placeholder="Descrição do item"]');
        const unidadeInput = modal.querySelector('input[placeholder="Ex: Un., m², Kg"]');
        
        // Preencher inputs de texto
        if (idOriginalInput) idOriginalInput.value = parsedData.idOriginal;
        if (itemInput) itemInput.value = parsedData.item;
        if (unidadeInput) unidadeInput.value = parsedData.unidade;
        
        // Preencher textarea
        const textareaInputs = modal.querySelectorAll('textarea');
        if (textareaInputs[0]) textareaInputs[0].value = parsedData.justificativa;
        
        // Preencher inputs de número e texto (nomes das empresas)
        const numberInputs = modal.querySelectorAll('input[type="number"]');
        const textInputs = modal.querySelectorAll('input[type="text"]');
        
        if (numberInputs.length < 14) {
            throw new Error(`Não foram encontrados campos suficientes no formulário. Esperado: pelo menos 14, encontrado: ${numberInputs.length}`);
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
        
        // Preencher nomes e valores das empresas
        for (let i = 1; i <= 6; i++) {
            const nomeInput = modal.querySelector(`input[name="nomeEmpresa${i}"]`);
            const valorInput = numberInputs[idx];
            
            const nomeEmpresa = parsedData[`nomeEmpresa${i}`];
            const valorEmpresa = parsedData[`empresa${i}`];
            
            if (nomeInput && nomeEmpresa) {
                nomeInput.value = nomeEmpresa;
            }
            
            if (valorInput && valorEmpresa) {
                valorInput.value = valorEmpresa;
            }
            
            idx++;
        }
        
    } catch (error) {
        console.error('Erro ao preencher formulário:', error);
        throw error;
    }
}

