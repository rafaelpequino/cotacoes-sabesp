using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using CotacoesEPC.Helpers;
using System.Security.Claims;

namespace CotacoesEPC.Pages
{
    public class dashboardModel : PageModel
    {
        public string? UserName { get; set; }
        public string? UserEmail { get; set; }
        public int UserId { get; set; }

        public IActionResult OnGet()
        {
            // Verificar autenticação
            if (!AuthHelper.IsUserAuthenticated(HttpContext))
            {
                return Redirect("/");
            }

            // Obter dados do usuário do claims
            UserId = AuthHelper.GetUserId(HttpContext);
            UserName = AuthHelper.GetUserName(HttpContext);
            UserEmail = AuthHelper.GetUserEmail(HttpContext);

            return Page();
        }
    }
}
