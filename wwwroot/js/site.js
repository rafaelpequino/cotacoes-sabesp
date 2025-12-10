// Função para fazer logout
function logout(event) {
    event.preventDefault();
    
    // Você pode adicionar aqui a lógica de logout
    // Por exemplo, redirecionar para uma página de logout ou fazer uma requisição AJAX
    
    if (confirm('Tem certeza que deseja sair?')) {
        // Redirecionar para logout (ajuste a URL conforme necessário)
        window.location.href = '/logout'; // Ou configure a rota correta
    }
}

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

