using CotacoesEPC.Services;
using Microsoft.AspNetCore.Mvc;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message, user, token) = await _authService.RegisterAsync(
                request.Name, request.Email, request.Password, request.Registration);

            if (!success)
                return BadRequest(new { message });

            return Ok(new
            {
                success = true,
                message,
                user = new { user!.Id, user.Name, user.Email },
                token
            });
        }

        [HttpPost("verify-registration")]
        public async Task<IActionResult> VerifyRegistration([FromBody] VerifyRegistrationRequest request)
        {
            var isAllowed = await _authService.IsRegistrationAllowedAsync(request.Registration);
            return Ok(new { isAllowed });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var (success, message, user, token) = await _authService.LoginAsync(
                request.Email, request.Password);

            if (!success)
                return Unauthorized(new { message });

            return Ok(new
            {
                success = true,
                message,
                user = new { user!.Id, user.Name, user.Email, initialLetter = user.InitialLetter },
                token
            });
        }
    }

    public class RegisterRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string Registration { get; set; } = string.Empty;
    }

    public class LoginRequest
    {
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class VerifyRegistrationRequest
    {
        public string Registration { get; set; } = string.Empty;
    }
}

