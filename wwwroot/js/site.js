// =============================================
// Utilitários para forçar MAIÚSCULAS nos campos
// =============================================

/**
 * Normaliza um texto para maiúsculas sem acentos, sem pontuação.
 * Regras:
 *  - Acentos e cedilha removidos (á→A, ã→A, ç→C, etc.)
 *  - Tudo em maiúsculas
 *  - Apenas letras A-Z, dígitos 0-9, espaço e hífen são mantidos
 * @param {string} valor
 * @returns {string}
 */
function converterMaiuscula(valor) {
    return valor
        .normalize('NFD')                 // decompõe: "ç" → "c" + cedilha, "á" → "a" + acento
        .replace(/[\u0300-\u036f]/g, '')  // remove todos os diacríticos (acentos, cedilha, til, etc.)
        .replace(/ç/gi, 'c')
        .toUpperCase()                    // maiúsculas
        .replace(/Ç/g, 'C');              // trata ç maiúsculo
}

/**
 * Aplica a conversão de maiúscula diretamente num campo de input/textarea,
 * preservando a posição do cursor.
 * @param {HTMLElement} campo
 */
function aplicarMaiuscula(campo) {
    const inicio = campo.selectionStart;
    const fim = campo.selectionEnd;
    const novoValor = converterMaiuscula(campo.value);
    if (campo.value !== novoValor) {
        campo.value = novoValor;
        try { campo.setSelectionRange(inicio, fim); } catch (e) { /* campos sem seleção (ex: date) */ }
    }
}

/**
 * Listener global (document-level) para forçar maiúsculas em todos os
 * inputs de texto e textareas dentro dos modais de criar/editar.
 * Usa event delegation com closest() — funciona assim que o script carrega,
 * sem depender de DOMContentLoaded.
 */
document.addEventListener('input', function (e) {
    const target = e.target;
    if (
        (target.tagName === 'INPUT' && target.type === 'text') ||
        target.tagName === 'TEXTAREA'
    ) {
        // Aplicar regras de maiúscula nos campos de texto dos modais relevantes
        if (target.closest('#createModal, #editModal, #intencaoModal, #uploadModal')) {
            aplicarMaiuscula(target);
        }
    }
});

document.addEventListener('paste', function (e) {
    const target = e.target;
    if (
        (target.tagName === 'INPUT' && target.type === 'text') ||
        target.tagName === 'TEXTAREA'
    ) {
        // Aplicar regras de maiúscula nos campos de texto dos modais relevantes após paste
        if (target.closest('#createModal, #editModal, #intencaoModal, #uploadModal')) {
            setTimeout(() => aplicarMaiuscula(target), 0);
        }
    }
});

// =============================================
// Máscaras de entrada: CNPJ e Telefone
// =============================================

/**
 * Formata CNPJ enquanto o usuário digita.
 * Aceita somente dígitos e aplica o padrão 00.000.000/0000-00.
 */
function maskCNPJ(campo) {
    let v = campo.value.replace(/\D/g, '').substring(0, 14);
    if (v.length > 12) {
        v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})$/, '$1.$2.$3/$4-$5');
    } else if (v.length > 8) {
        v = v.replace(/^(\d{2})(\d{3})(\d{3})(\d{0,4})$/, '$1.$2.$3/$4');
    } else if (v.length > 5) {
        v = v.replace(/^(\d{2})(\d{3})(\d{0,3})$/, '$1.$2.$3');
    } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,3})$/, '$1.$2');
    }
    campo.value = v;
}

/**
 * Formata telefone enquanto o usuário digita.
 * Detecta automaticamente se é fixo (8 dígitos) ou celular (9 dígitos):
 *   Fixo:   (00) 0000-0000
 *   Celular:(00) 00000-0000
 */
function maskTelefone(campo) {
    let v = campo.value.replace(/\D/g, '').substring(0, 11);
    if (v.length > 10) {
        // celular: (00) 00000-0000
        v = v.replace(/^(\d{2})(\d{5})(\d{0,4})$/, '($1) $2-$3');
    } else if (v.length > 6) {
        // fixo intermediário ou celular ainda sendo digitado
        v = v.replace(/^(\d{2})(\d{4,5})(\d{0,4})$/, '($1) $2-$3');
    } else if (v.length > 2) {
        v = v.replace(/^(\d{2})(\d{0,5})$/, '($1) $2');
    } else if (v.length > 0) {
        v = v.replace(/^(\d{0,2})$/, '($1');
    }
    campo.value = v;
}

// Aplica as máscaras via event delegation para os campos do modal de empresa
document.addEventListener('input', function (e) {
    const target = e.target;
    if (!target.closest('#companyDetailModal')) return;

    if (target.id === 'cdeInputCNPJ') {
        maskCNPJ(target);
    } else if (target.id === 'cdeInputTelefone') {
        maskTelefone(target);
    }
});

// Fechar dropdown ao clicar fora
document.addEventListener('click', function(event) {
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userMenuDropdown = document.querySelector('.user-menu-dropdown');
    
    if (userMenuDropdown && !userMenuDropdown.contains(event.target)) {
        const dropdownMenu = userMenuDropdown.querySelector('.dropdown-menu');
        if (dropdownMenu && dropdownMenu.classList.contains('show')) {
            // Usar Bootstrap para fechar o dropdown
            const dropdown = new bootstrap.Dropdown(userMenuBtn);
            dropdown.hide();
        }
    }
});

// Menu hamburguer mobile
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.querySelector('.menu-toggle');
    const menu = document.querySelector('.menu');
    
    if (menuToggle && menu) {
        menuToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            menu.classList.toggle('active');
            
            // Animar ícone do hamburguer
            const icon = menuToggle.textContent;
            menuToggle.textContent = menu.classList.contains('active') ? '✕' : '☰';
        });
        
        // Fechar menu ao clicar em um item
        const menuItems = menu.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('click', function() {
                menu.classList.remove('active');
                menuToggle.textContent = '☰';
            });
        });
        
        // Fechar menu ao clicar fora
        document.addEventListener('click', function(event) {
            if (!menu.contains(event.target) && !menuToggle.contains(event.target)) {
                menu.classList.remove('active');
                menuToggle.textContent = '☰';
            }
        });
    }

    // Carregar dados do usuário e atualizar header
    updateUserHeader();
});

async function updateUserHeader() {
    try {
        const currentUser = await api.getCurrentUser();
        if (currentUser) {
            // Atualizar nome do usuário
            const userNameElement = document.querySelector('.user-name');
            if (userNameElement) {
                userNameElement.textContent = currentUser.name;
            }
            
            // Atualizar inicial do usuário
            const userIconElement = document.querySelector('.user-icon');
            if (userIconElement) {
                userIconElement.textContent = currentUser.initialLetter || currentUser.name.charAt(0).toUpperCase();
            }
            
            // Atualizar nome no dropdown
            const dropdownHeader = document.querySelector('.dropdown-header');
            if (dropdownHeader) {
                dropdownHeader.textContent = currentUser.name;
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}
