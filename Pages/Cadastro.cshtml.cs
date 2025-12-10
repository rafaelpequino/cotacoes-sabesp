using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;

namespace CotacoesEPC.Pages
{
    public class RegisterModel : PageModel
    {
        public string? ErrorMessage { get; set; }
        public string? SuccessMessage { get; set; }

        public void OnGet()
        {
            // Se usuário já está logado, redirecionar para dashboard
            if (User.Identity?.IsAuthenticated ?? false)
            {
                Response.Redirect("/dashboard");
            }
        }

        public IActionResult OnPostAsync(string? name, string? email, string? password, string? confirmPassword, string? registration)
        {
            // Este método não será usado pois o registro acontece via API
            // Mantendo para compatibilidade com formulários tradicionais, se necessário

            return Page();
        }
    }
}

