using CotacoesEPC.Data;
using CotacoesEPC.Models;
using Microsoft.EntityFrameworkCore;

namespace CotacoesEPC.Services
{
    public interface IDataSeederService
    {
        Task SeedAllowedRegistrationsAsync();
    }

    public class DataSeederService : IDataSeederService
    {
        private readonly ApplicationDbContext _context;

        public DataSeederService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task SeedAllowedRegistrationsAsync()
        {
            try
            {
                // Verificar se já existem registros
                if (await _context.AllowedRegistrations.AnyAsync())
                {
                    return;
                }

                // Criar registros permitidos de exemplo
                var allowedRegistrations = new List<AllowedRegistration>
                {
                    new AllowedRegistration { RegistrationNumber = "REG001", IsUsed = false },
                    new AllowedRegistration { RegistrationNumber = "REG002", IsUsed = false },
                    new AllowedRegistration { RegistrationNumber = "REG003", IsUsed = false },
                    new AllowedRegistration { RegistrationNumber = "REG004", IsUsed = false },
                    new AllowedRegistration { RegistrationNumber = "REG005", IsUsed = false },
                    new AllowedRegistration { RegistrationNumber = "REG006", IsUsed = false },
                    new AllowedRegistration { RegistrationNumber = "REG007", IsUsed = false },
                    new AllowedRegistration { RegistrationNumber = "REG008", IsUsed = false },
                    new AllowedRegistration { RegistrationNumber = "REG009", IsUsed = false },
                    new AllowedRegistration { RegistrationNumber = "REG010", IsUsed = false },
                };

                _context.AllowedRegistrations.AddRange(allowedRegistrations);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                // Log error
                Console.WriteLine($"Erro ao seed registrations: {ex.Message}");
            }
        }
    }
}

