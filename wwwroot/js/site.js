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

