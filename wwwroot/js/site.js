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
        .toUpperCase()                    // maiúsculas
        .replace(/[^A-Z0-9 \-\/]/g, '');  // remove tudo que NÃO for letra, número, espaço, hífen ou barra
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
        if (target.closest('#createModal, #editModal, #intencaoModal')) {
            aplicarMaiuscula(target);
        }
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
