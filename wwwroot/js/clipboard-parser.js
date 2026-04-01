/**
 * Parser para converter dados de planilha em valores para o formulário
 * LINHA 1: Contém os nomes das empresas NAS PRIMEIRAS COLUNAS (0-5)
 * LINHA 2: Contém TODOS os dados: I0, Item, Unidade, Preços, Nomes, Valores das empresas, Justificativa
 */

function parseClipboardData(text) {
    try {
        let lines = text.trim().split('\n');
        lines = lines.filter(line => line.trim().length > 0);
        
        if (lines.length < 2) {
            throw new Error('Cole exatamente 2 linhas');
        }
        
        const headerLine = lines[0].split('\t');  // NOMES DAS EMPRESAS
        const valuesLine = lines[1].split('\t');  // TODOS OS DADOS
        
        console.log('=== CLIPBOARD PARSER DEBUG ===');
        console.log('Linha 1 (Nomes):', headerLine);
        console.log('Linha 2 (Valores):', valuesLine);

        function parseMoneyValue(str) {
            if (!str || str.trim() === '') return '';
            let cleaned = str.replace(/R\$\s*/g, '').trim();
            
            // Remover separador de milhares (ponto) e converter vírgula em ponto decimal
            // Ex: "1.000,00" -> "1000.00"
            cleaned = cleaned.replace(/\./g, '');  // Remove TODOS os pontos
            cleaned = cleaned.replace(',', '.');   // Converte vírgula em ponto
            
            return cleaned || '';
        }

        function cleanText(str) {
            return (str || '').trim();
        }

        function cleanTextUpper(str) {
            return (str || '').trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/ç/gi, 'c')
                .toUpperCase()
                .replace(/Ç/g, 'C');
        }

        function getValue(index, isMonetary = false, isText = false) {
            if (index < valuesLine.length) {
                const val = valuesLine[index];
                if (isMonetary) return parseMoneyValue(val);
                if (isText) return cleanTextUpper(val);
                return cleanText(val);
            }
            return '';
        }

        // Os NOMES DAS EMPRESAS estão nas PRIMEIRAS COLUNAS da LINHA 1
        let companyNames = [];
        for (let i = 0; i < 6; i++) {
            companyNames[i] = cleanTextUpper(headerLine[i] || '');
            console.log(`Empresa ${i + 1}: "${companyNames[i]}"`);
        }

        // Os VALORES DAS EMPRESAS estão nas colunas 14-19 da LINHA 2
        // (porque as colunas 0-13 contêm os outros dados: I0, Item, Unidade, Preços, Médias)
        let empresaValues = [];
        for (let i = 0; i < 6; i++) {
            empresaValues[i] = getValue(14 + i, true);
            console.log(`Valor empresa ${i + 1}: ${empresaValues[i]}`);
        }

        console.log('Nomes finais:', companyNames);
        console.log('Valores finais:', empresaValues);

        return {
            idOriginal: getValue(0, false, true),
            item: getValue(1, false, true),
            unidade: getValue(2, false, true),
            precoFornCorrigido: getValue(3, true),
            precoMontagem: getValue(4, true),
            precoAdotado: getValue(6, true),
            mediaAdotada: getValue(8, false, true),
            mediaSaneada: getValue(9, true),
            menorValor: getValue(10, true),
            mediaAritmetica: getValue(11, true),
            mediana: getValue(12, true),
            nomeEmpresa1: companyNames[0],
            nomeEmpresa2: companyNames[1],
            nomeEmpresa3: companyNames[2],
            nomeEmpresa4: companyNames[3],
            nomeEmpresa5: companyNames[4],
            nomeEmpresa6: companyNames[5],
            empresa1: empresaValues[0],
            empresa2: empresaValues[1],
            empresa3: empresaValues[2],
            empresa4: empresaValues[3],
            empresa5: empresaValues[4],
            empresa6: empresaValues[5],
            justificativa: getValue(20, false, true)
        };

    } catch (error) {
        console.error('❌ Erro no parser:', error);
        throw error;
    }
}

/**
 * Preenche os inputs do modal com os dados parseados
 */
function fillFormWithParsedData(modal, parsedData) {
    try {
        // Preencher select de Setor (se obrigatório)
        const sectorSelect = modal.querySelector('select[name="sectorId"]');
        if (sectorSelect && !sectorSelect.value) {
            // Selecionar a primeira opção válida (não vazia)
            const options = sectorSelect.querySelectorAll('option');
            for (let option of options) {
                if (option.value && option.value !== '') {
                    sectorSelect.value = option.value;
                    break;
                }
            }
        }
        
        // Busca por placeholder novo (maiúsculo) com fallback para o antigo (minúsculo)
        const idOriginalInput = modal.querySelector('input[placeholder="Ex: JAN/00"]')
                             || modal.querySelector('input[placeholder="Ex: jan/00"]');
        const itemInput = modal.querySelector('input[placeholder="DESCRIÇÃO DO ITEM"]')
                       || modal.querySelector('input[placeholder="Descrição do item"]');
        const unidadeInput = modal.querySelector('input[placeholder="Ex: Un., m², Kg"]');
        
        // Função auxiliar para converter texto ao preencher programaticamente
        function upperVal(str) {
            return (str || '').trim()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/ç/gi, 'c')
                .toUpperCase()
                .replace(/[^A-Z0-9 \-\/]/g, '');
        }

        if (idOriginalInput) idOriginalInput.value = upperVal(parsedData.idOriginal);
        if (itemInput) itemInput.value = upperVal(parsedData.item);
        if (unidadeInput) unidadeInput.value = upperVal(parsedData.unidade);
        
        const textareaInputs = modal.querySelectorAll('textarea');
        if (textareaInputs[0]) textareaInputs[0].value = upperVal(parsedData.justificativa);
        
        // Busca inputs de texto para Média Adotada
        const allInputs = modal.querySelectorAll('input');
        let mediaAdotadaInput = null;
        
        for (let input of allInputs) {
            const label = input.parentElement?.querySelector('label')?.textContent || '';
            if (label.includes('Média adotada') && input.type === 'text') {
                mediaAdotadaInput = input;
            }
        }
        
        const numberInputs = modal.querySelectorAll('input[type="number"]');
        
        if (numberInputs.length < 13) {
            throw new Error(`Campos numéricos insuficientes. Esperado: 13, encontrado: ${numberInputs.length}`);
        }
        
        let idx = 0;
        
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.precoFornCorrigido;  // Preço de Fornecedor (corrigido)
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.precoMontagem;      // Preço de montagem/instalação
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.precoAdotado;       // Preço adotado
        
        // Preencher campo de texto para Média Adotada
        if (mediaAdotadaInput) mediaAdotadaInput.value = upperVal(parsedData.mediaAdotada);
        
        // Preencher campos de número (Média Saneada em diante)
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.mediaSaneada;
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.menorValor;
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.mediaAritmetica;
        if (idx < numberInputs.length) numberInputs[idx++].value = parsedData.mediana;
        
        for (let i = 1; i <= 6; i++) {
            const nomeInput = modal.querySelector(`input[name="nomeEmpresa${i}"]`);
            const valorInput = numberInputs[idx];
            
            if (nomeInput) {
                nomeInput.value = upperVal(parsedData[`nomeEmpresa${i}`] || '');
            }
            
            if (valorInput) {
                valorInput.value = parsedData[`empresa${i}`] || '';
            }
            
            idx++;
        }
        
        console.log('✅ Formulário preenchido com sucesso');
        
    } catch (error) {
        console.error('❌ Erro ao preencher formulário:', error);
        throw error;
    }
}
