using CotacoesEPC.Data;
using CotacoesEPC.Models;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace CotacoesEPC.Services
{
    public interface IAuthService
    {
        Task<(bool success, string message, User? user, string? token)> RegisterAsync(string name, string email, string password, string registration);
        Task<(bool success, string message, User? user, string? token)> LoginAsync(string email, string password);
        Task<User?> GetUserByIdAsync(int userId);
        Task<User?> GetUserByEmailAsync(string email);
        Task<bool> IsRegistrationAllowedAsync(string registration);
    }

    public class AuthService : IAuthService
    {
        private readonly ApplicationDbContext _context;
        private readonly IJwtService _jwtService;

        public AuthService(ApplicationDbContext context, IJwtService jwtService)
        {
            _context = context;
            _jwtService = jwtService;
        }

        public async Task<(bool success, string message, User? user, string? token)> RegisterAsync(string name, string email, string password, string registration)
        {
            try
            {
                // Verificar se o email já existe
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (existingUser != null)
                {
                    return (false, "Email já registrado", null, null);
                }

                // Verificar se o registration é permitido
                var allowedReg = await _context.AllowedRegistrations
                    .FirstOrDefaultAsync(ar => ar.RegistrationNumber == registration);

                if (allowedReg == null)
                {
                    return (false, "Número de registro não encontrado", null, null);
                }

                if (allowedReg.IsUsed)
                {
                    return (false, "Este número de registro já foi utilizado", null, null);
                }

                // Criar novo usuário
                var user = new User
                {
                    Name = name,
                    Email = email,
                    PasswordHash = HashPassword(password),
                    InitialLetter = name[0].ToString().ToUpper(),
                    Registration = registration,
                    CreatedAt = DateTime.UtcNow,
                    IsActive = true
                };

                _context.Users.Add(user);
                
                // Marcar registration como usado
                allowedReg.IsUsed = true;
                allowedReg.UsedByUserId = user.Id;
                allowedReg.UsedAt = DateTime.UtcNow;
                _context.AllowedRegistrations.Update(allowedReg);

                await _context.SaveChangesAsync();

                // Gerar token
                var token = _jwtService.GenerateToken(user.Id, user.Email, user.Name);

                return (true, "Usuário registrado com sucesso", user, token);
            }
            catch (Exception ex)
            {
                return (false, $"Erro ao registrar: {ex.Message}", null, null);
            }
        }

        public async Task<bool> IsRegistrationAllowedAsync(string registration)
        {
            var allowedReg = await _context.AllowedRegistrations
                .FirstOrDefaultAsync(ar => ar.RegistrationNumber == registration && !ar.IsUsed);
            
            return allowedReg != null;
        }

        public async Task<(bool success, string message, User? user, string? token)> LoginAsync(string email, string password)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
                if (user == null)
                {
                    return (false, "Usuário não encontrado", null, null);
                }

                if (!VerifyPassword(password, user.PasswordHash))
                {
                    return (false, "Senha incorreta", null, null);
                }

                if (!user.IsActive)
                {
                    return (false, "Usuário inativo", null, null);
                }

                var token = _jwtService.GenerateToken(user.Id, user.Email, user.Name);

                return (true, "Login realizado com sucesso", user, token);
            }
            catch (Exception ex)
            {
                return (false, $"Erro ao fazer login: {ex.Message}", null, null);
            }
        }

        public async Task<User?> GetUserByIdAsync(int userId)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
        }

        public async Task<User?> GetUserByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }

        private string HashPassword(string password)
        {
            using (var sha256 = SHA256.Create())
            {
                var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
                return Convert.ToBase64String(hashedBytes);
            }
        }

        private bool VerifyPassword(string password, string hash)
        {
            var hashOfInput = Convert.ToBase64String(
                SHA256.Create().ComputeHash(Encoding.UTF8.GetBytes(password)));
            return hashOfInput.Equals(hash);
        }
    }
}

