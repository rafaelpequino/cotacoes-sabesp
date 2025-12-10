using System.Security.Claims;

namespace CotacoesEPC.Helpers
{
    public static class AuthHelper
    {
        public static bool IsUserAuthenticated(HttpContext context)
        {
            return context.User.Identity?.IsAuthenticated ?? false;
        }

        public static int GetUserId(HttpContext context)
        {
            var claim = context.User.FindFirst(ClaimTypes.NameIdentifier);
            return claim != null ? int.Parse(claim.Value) : 0;
        }

        public static string GetUserEmail(HttpContext context)
        {
            return context.User.FindFirst(ClaimTypes.Email)?.Value ?? "";
        }

        public static string GetUserName(HttpContext context)
        {
            return context.User.FindFirst(ClaimTypes.Name)?.Value ?? "";
        }

        public static void RedirectToLogin(HttpContext context)
        {
            context.Response.Redirect("/");
        }
    }
}

