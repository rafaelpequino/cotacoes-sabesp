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
                    return (false, "Este email já está registrado no sistema", null, null);
                }

                // Verificar se o registration é permitido
                var allowedReg = await _context.AllowedRegistrations
                    .FirstOrDefaultAsync(ar => ar.RegistrationNumber == registration);

                if (allowedReg == null)
                {
                    return (false, "Número de registro inválido", null, null);
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
                await _context.SaveChangesAsync(); // Salvar usuário primeiro

                // Agora marcar registration como usado
                allowedReg.IsUsed = true;
                allowedReg.UsedByUserId = user.Id;
                allowedReg.UsedAt = DateTime.UtcNow;
                _context.AllowedRegistrations.Update(allowedReg);
                await _context.SaveChangesAsync(); // Salvar atualização

                // Gerar token
                var token = _jwtService.GenerateToken(user.Id, user.Email, user.Name);

                return (true, "Usuário registrado com sucesso", user, token);
            }
            catch (DbUpdateException ex)
            {
                System.Diagnostics.Debug.WriteLine($"Erro ao salvar dados: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"Inner Exception: {ex.InnerException?.Message}");
                return (false, "Erro ao salvar os dados. Verifique se os dados estão corretos", null, null);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Erro ao registrar: {ex.Message}");
                System.Diagnostics.Debug.WriteLine($"Stack trace: {ex.StackTrace}");
                return (false, "Erro ao criar a conta. Tente novamente mais tarde", null, null);
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
                    return (false, "Email ou senha incorretos", null, null);
                }

                if (!VerifyPassword(password, user.PasswordHash))
                {
                    return (false, "Email ou senha incorretos", null, null);
                }

                if (!user.IsActive)
                {
                    return (false, "Sua conta foi desativada", null, null);
                }

                var token = _jwtService.GenerateToken(user.Id, user.Email, user.Name);

                return (true, "Login realizado com sucesso", user, token);
            }
            catch (Exception ex)
            {
                System.Diagnostics.Debug.WriteLine($"Erro ao fazer login: {ex.Message}");
                return (false, "Erro ao fazer login. Tente novamente mais tarde", null, null);
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

