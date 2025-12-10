using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.RazorPages;
using CotacoesEPC.Helpers;

namespace CotacoesEPC.Pages
{
    public class planilhasModel : PageModel
    {
        public string? UserName { get; set; }
        public int UserId { get; set; }

        public IActionResult OnGet()
        {
            if (!AuthHelper.IsUserAuthenticated(HttpContext))
            {
                return Redirect("/");
            }

            UserId = AuthHelper.GetUserId(HttpContext);
            UserName = AuthHelper.GetUserName(HttpContext);

            return Page();
        }
    }
}

