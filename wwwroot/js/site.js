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
});
