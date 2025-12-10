using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CotacoesEPC.Pages
{
    public class IndexModel : PageModel
    {
        private readonly ILogger<IndexModel> _logger;

        public string? ErrorMessage { get; set; }

        public IndexModel(ILogger<IndexModel> logger)
        {
            _logger = logger;
        }

        public IActionResult OnGet()
        {
            // Se usuário já está logado, redirecionar para dashboard
            if (User.Identity?.IsAuthenticated ?? false)
            {
                return Redirect("/dashboard");
            }

            return Page();
        }
    }
}
