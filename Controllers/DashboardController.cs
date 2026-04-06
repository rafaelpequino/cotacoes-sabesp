using CotacoesEPC.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace CotacoesEPC.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DashboardController(ApplicationDbContext context)
        {
            _context = context;
        }

        private int GetUserId()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return int.Parse(userId ?? "0");
        }

        // GET: api/dashboard/summary
        [HttpGet("summary")]
        public async Task<IActionResult> GetSummary()
        {
            var userId = GetUserId();

            // Contar TODAS as cotações, fornecedores e spreadsheets (compartilhadas)
            var quotationsCount = await _context.Quotations.CountAsync();
            var suppliersCount = await _context.Suppliers.CountAsync();
            var spreadsheetsCount = await _context.Spreadsheets.CountAsync();

            var recentQuotations = await _context.Quotations
                .OrderByDescending(q => q.CreatedAt)
                .Take(3)
                .Select(q => new
                {
                    q.Id,
                    q.OriginalId,
                    q.Item,
                    q.PrecoAdotado,
                    q.CreatedAt,
                    ResponsibleName = q.User!.Name
                })
                .ToListAsync();

            var recentSuppliers = await _context.Suppliers
                .OrderByDescending(s => s.DataCadastro)
                .Take(3)
                .Select(s => new
                {
                    s.Id,
                    s.NomeFantasia,
                    s.DataCadastro
                })
                .ToListAsync();

            var recentSpreadsheets = await _context.Spreadsheets
                .OrderByDescending(s => s.CreatedAt)
                .Take(3)
                .Select(s => new
                {
                    s.Id,
                    s.Name,
                    s.FilePath,
                    s.CreatedAt,
                    ResponsibleName = s.User!.Name
                })
                .ToListAsync();

            return Ok(new
            {
                quotationsCount,
                suppliersCount,
                spreadsheetsCount,
                recentQuotations,
                recentSuppliers,
                recentSpreadsheets
            });
        }

        // GET: api/dashboard/statistics
        [HttpGet("statistics")]
        public async Task<IActionResult> GetStatistics()
        {
            var userId = GetUserId();

            var totalQuotationsValue = await _context.Quotations
                .Where(q => q.UserId == userId)
                .SumAsync(q => q.PrecoAdotado);

            var averageQuotationPrice = await _context.Quotations
                .Where(q => q.UserId == userId)
                .AverageAsync(q => (decimal?)q.PrecoAdotado) ?? 0;

            return Ok(new
            {
                totalQuotationsValue,
                averageQuotationPrice
            });
        }
    }
}

