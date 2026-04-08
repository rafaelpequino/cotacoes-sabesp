// PATCH para cotacoes-page.js
// Substituir a função saveServico/saveInsumo pela versão corrigida abaixo:

async function saveServico() {
    const modal = document.getElementById('createModal');
    const form = modal.querySelector('form');
    
    // Obter sectorId
    const sectorSelect = form.querySelector('select[name="sectorId"]');
    const sectorId = sectorSelect ? parseInt(sectorSelect.value) : null;
    
    // Obter valores de forma mais precisa baseado na estrutura do HTML
    const originalId = form.querySelector('input[placeholder="Ex: JAN/00"]')?.value || '';
    const item = form.querySelector('input[placeholder="DESCRIÇÃO DO ITEM"]')?.value || '';
    const unit = form.querySelector('input[placeholder="Ex: Un., m², Kg"]')?.value || '';
    
    // Validação básica
    if (!sectorId || !originalId || !item || !unit) {
        await Swal.fire({
            icon: 'warning',
            title: 'Campos Obrigatórios',
            text: 'Por favor, preencha os campos obrigatórios (Setor, I0 Original, Item, Unidade)',
            confirmButtonColor: '#ff9800'
        });
        return;
    }
    
    // Validar anexos
    const attachmentValidation = validateAttachments();
    if (!attachmentValidation.valid) {
        await Swal.fire({
            icon: 'warning',
            title: 'Anexo Obrigatório',
            text: attachmentValidation.message,
            confirmButtonColor: '#ff9800'
        });
        return;
    }
    
    // Obter todos os inputs de número
    const numberInputs = form.querySelectorAll('input[type="number"]');
    
    // Helper para converter valor numérico
    const toNumber = (value, defaultValue = null) => {
        if (!value || value === '') return defaultValue;
        const num = parseFloat(value);
        return isNaN(num) ? defaultValue : num;
    };
    
    const data = {
        sectorId: sectorId,
        originalId: originalId,
        item: item,
        unit: unit,
        priceFornecedor: toNumber(numberInputs[0]?.value, 0),
        precoMontagem: toNumber(numberInputs[1]?.value, 0),
        precoAdotado: toNumber(numberInputs[2]?.value, 0),
        mediaAdotada: numberInputs[3]?.value || '',
        mediaSaneada: toNumber(numberInputs[4]?.value),
        menorValor: toNumber(numberInputs[5]?.value),
        mediaAritmetica: toNumber(numberInputs[6]?.value),
        mediana: toNumber(numberInputs[7]?.value),
        empresa1: toNumber(numberInputs[8]?.value),
        empresa2: toNumber(numberInputs[9]?.value),
        empresa3: toNumber(numberInputs[10]?.value),
        empresa4: toNumber(numberInputs[11]?.value),
        empresa5: toNumber(numberInputs[12]?.value),
        empresa6: toNumber(numberInputs[13]?.value),
        justificativa: form.querySelector('textarea')?.value || ''
    };

    try {
        // Mostrar loading
        Swal.fire({
            title: 'Salvando...',
            text: 'Aguarde enquanto salvamos sua cotação',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });
        
        const result = await api.createService(data);
        
        // Upload de anexos
        await uploadPendingAttachments('Service', result.id);
        
        Swal.close();
        
        await Swal.fire({
            icon: 'success',
            title: 'Sucesso!',
            text: 'Serviço criado com sucesso!',
            confirmButtonColor: '#13d0ff'
        });
        
        closeCreateModal();
        loadServicos();
        form.reset();
        
    } catch (error) {
        console.error('Erro ao salvar serviço:', error);
        Swal.close();
        
        await Swal.fire({
            icon: 'error',
            title: 'Erro ao Salvar',
            html: `
                <p>Não foi possível salvar a cotação.</p>
                <p style="color: #666; font-size: 14px; margin-top: 10px;">${error.message || 'Erro desconhecido'}</p>
            `,
            confirmButtonColor: '#d32f2f'
        });
    }
}
